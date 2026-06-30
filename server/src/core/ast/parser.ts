/**
 * Recursive-descent parser for Big Huge Script.
 *
 * Consumes the token stream from the lexer and produces a Program AST, emitting
 * syntax diagnostics (missing semicolons, missing operators between operands,
 * unmatched brackets, etc.). Errors recover by skipping to the next statement
 * boundary so a single mistake doesn't cascade.
 */

import { Token } from './lexer';
import * as A from './ast';
import {
    canonicalIdentifier,
    QUALIFIERS,
    RETURN_TYPE_KEYWORDS,
    SCRIPT_TYPES,
    STATEMENT_KEYWORDS,
    TYPE_KEYWORDS,
    VALUE_TYPE_KEYWORDS,
    isReservedIdentifier
} from '../languageFacts';

export interface ParseDiagnostic {
    start: number;
    end: number;
    message: string;
    severity: number;
}

const RESERVED_TYPE_KEYWORDS = new Set(['int', 'float', 'string', 'bool', 'void']);
// Foreign C-style type names the compiler rejects in script code, each mapped to
// the BHS type to use instead. `real` is the important one: the manual uses it as
// the name of the float type, so "meant float, wrote real" is the usual mistake.
// The unsupported-type set is derived from these keys, so this is the only list
// to maintain. (`void` is handled separately — it's a valid return type, just not
// a variable/parameter type — so it is intentionally not listed here.)
const TYPE_REPLACEMENTS: Record<string, string> = {
    real: 'float', double: 'float', char: 'int', short: 'int', long: 'int', unsigned: 'int'
};
const UNSUPPORTED_DECL_TYPES = new Set(Object.keys(TYPE_REPLACEMENTS));

// Binary operator precedence (higher binds tighter). '^' is the power operator.
const BINARY_PREC: Record<string, number> = {
    '||': 1, '&&': 2,
    '|': 3, '&': 4,
    '==': 5, '!=': 5,
    '<': 6, '<=': 6, '>': 6, '>=': 6,
    '<<': 7, '>>': 7,
    '+': 8, '-': 8,
    '*': 9, '/': 9, '%': 9,
    '^': 10
};
const ASSIGN_OPS = new Set(['=', '+=', '-=', '*=', '/=', '%=', '^=', '<<=', '>>=']);
const PREFIX_OPS = new Set(['!', '-', '+', '++', '--']);
const isScriptTypeName = (name: string): boolean => SCRIPT_TYPES.has(canonicalIdentifier(name) as 'scenario' | 'conquest' | 'ai');
const isReturnTypeName = (name: string): boolean => RETURN_TYPE_KEYWORDS.has(canonicalIdentifier(name));
const isUnsupportedDeclTypeName = (name: string): boolean => UNSUPPORTED_DECL_TYPES.has(canonicalIdentifier(name));
const EXPRESSION_RESERVED_WORDS = new Set([...RESERVED_TYPE_KEYWORDS, ...QUALIFIERS, ...SCRIPT_TYPES, ...STATEMENT_KEYWORDS, 'ref']);

export class Parser {
    private pos = 0;
    private readonly knownStructTypes = new Set<string>();
    public readonly diagnostics: ParseDiagnostic[] = [];

    constructor(private readonly tokens: Token[]) {}

    parseProgram(): A.Program {
        const items: A.TopLevel[] = [];
        while (!this.eof()) {
            const before = this.pos;
            const item = this.parseTopLevel();
            if (item) { items.push(item); }
            if (this.pos === before) { this.advance(); }   // guarantee progress
        }
        return { kind: 'Program', items };
    }

    // --- token helpers ------------------------------------------------------

    private peek(o = 0): Token {
        const idx = this.pos + o;
        return this.tokens[idx < this.tokens.length ? idx : this.tokens.length - 1];
    }
    private prev(): Token { return this.tokens[this.pos > 0 ? this.pos - 1 : 0]; }
    private advance(): Token { return this.tokens[this.pos < this.tokens.length - 1 ? this.pos++ : this.pos]; }
    private eof(): boolean { return this.peek().kind === 'eof'; }

    private isOp(v: string): boolean { const t = this.peek(); return t.kind === 'op' && t.value === v; }
    private isPunct(v: string): boolean { const t = this.peek(); return t.kind === 'punct' && t.value === v; }
    private isKw(v: string): boolean {
        const t = this.peek();
        return t.kind === 'ident' && t.value === v;
    }
    private kw(): string | null {
        const t = this.peek();
        return t.kind === 'ident' ? t.value : null;
    }

    private eat(v: string): boolean {
        const t = this.peek();
        if ((t.kind === 'op' || t.kind === 'punct') && t.value === v) { this.pos++; return true; }
        return false;
    }
    private error(at: { start: number; end: number }, message: string, severity = 1): void {
        this.diagnostics.push({ start: at.start, end: at.end, message, severity });
    }
    private expect(v: string, message: string): boolean {
        if (this.eat(v)) { return true; }
        this.error(this.peek(), message);
        return false;
    }
    private expectSemicolon(): void {
        if (this.eat(';')) { return; }
        const p = this.prev();
        this.error({ start: p.start, end: p.end }, 'Missing semicolon at end of statement');
    }
    private expectIdent(): A.Ident {
        const t = this.peek();
        if (t.kind === 'ident') { this.pos++; return { kind: 'Ident', name: t.value, start: t.start, end: t.end }; }
        this.error(t, 'Expected an identifier');
        return { kind: 'Ident', name: '', start: t.start, end: t.start };
    }

    // --- top level ----------------------------------------------------------

    private parseTopLevel(): A.TopLevel | null {
        if (this.isKw('include')) { return this.parseInclude(); }
        if (this.isKw('struct')) { return this.parseStruct(); }

        // A script declaration, optionally with a leading return type:
        //   [type] (scenario|conquest|ai) [name] ( params ) { ... }
        const k = this.kw();
        if (k && (isScriptTypeName(k) || this.isScriptAfterType())) {
            return this.parseScript();
        }

        // Otherwise treat it as a statement (lenient: allows top-level code).
        return this.parseStatement();
    }

    /** True when a leading type (including array suffixes) precedes a script category. */
    private isScriptAfterType(): boolean {
        let offset = 1;
        while (this.isEmptyArraySuffix(offset)) {
            offset += 2;
        }
        const t = this.peek(offset);
        return t.kind === 'ident' && isScriptTypeName(t.value);
    }

    private parseInclude(): A.IncludeDecl {
        const start = this.peek().start;
        this.advance(); // include
        let path = '';
        let end = this.prev().end;
        if (this.peek().kind === 'string') { path = this.peek().value; end = this.peek().end; this.pos++; }
        else { this.error(this.peek(), 'Expected a file path string after include'); }
        return { kind: 'Include', path, start, end };
    }

    private parseStruct(): A.StructDecl {
        const start = this.advance().start; // struct
        const name = this.expectIdent();
        this.expect('{', "Expected '{' to open struct body");
        const fields: A.StructField[] = [];

        while (!this.eof() && !this.isPunct('}')) {
            if (this.isPunct(';')) { this.advance(); continue; }
            const fieldStart = this.peek().start;
            const baseFieldType = this.parseTypeName();
            do {
                const fieldName = this.expectIdent();
                if (!fieldName.name) { break; }
                const fieldType = this.parseArraySuffix(baseFieldType);
                fields.push({ fieldType, name: fieldName, start: fieldStart, end: this.prev().end });
            } while (this.eat(','));
            if (!this.eat(';')) {
                this.error(this.peek(), 'Expected a semicolon after struct field declaration');
                // Recover at the next field boundary. Malformed grouped fields
                // must consume input here so diagnostics remain bounded.
                while (!this.eof() && !this.isPunct(';') && !this.isPunct('}')) {
                    this.advance();
                }
                this.eat(';');
            }
        }

        this.expect('}', "Missing closing brace '}'");
        this.expectSemicolon();
        if (name.name) {
            this.knownStructTypes.add(name.name.toLowerCase());
        }
        return { kind: 'Struct', name, fields, start, end: this.prev().end };
    }

    private parseScript(): A.ScriptDecl {
        const start = this.peek().start;
        const returnType = this.parseOptionalScriptReturnType();
        const scriptType = this.advance().value.toLowerCase(); // scenario | conquest | ai

        let name: A.Ident | undefined;
        if (this.peek().kind === 'ident' && !this.isPunct('(') && !this.isPunct('{')) {
            name = this.expectIdent();
        }

        const params: A.Param[] = [];
        if (this.eat('(')) {
            this.parseParams(params);
            this.expect(')', "Expected ')' after parameters");
        }

        let body: A.Block | undefined;
        if (this.isPunct('{')) {
            body = this.parseBlock();
            if (this.isPunct(';')) {
                const semicolon = this.advance();
                this.error(semicolon, 'Script definitions cannot be followed by a semicolon');
            }
        } else {
            this.expectSemicolon(); // forward declaration
        }
        return { kind: 'Script', scriptType, name, returnType, params, body, start, end: this.prev().end };
    }

    private parseOptionalScriptReturnType(): string | undefined {
        const k = this.kw();
        if (k && isReturnTypeName(k)) {
            return this.parseArraySuffix(this.normalizeType(this.advance().value));
        }
        if (k && isUnsupportedDeclTypeName(k)) {
            const t = this.advance();
            this.error(t, this.unsupportedTypeMessage(t.value, 'script return'));
            this.parseArraySuffix(this.normalizeType(t.value));
        }
        if (k && this.isScriptAfterType()) {
            return this.parseArraySuffix(this.advance().value);
        }
        return undefined;
    }

    private parseParams(out: A.Param[]): void {
        if (this.isPunct(')')) { return; }
        for (;;) {
            const start = this.peek().start;
            const { qualifier, isRef } = this.parseOptionalParamQualifier();
            let paramType: string | undefined;
            // A type token only counts as a type if a name follows it.
            if (this.isTypeBeforeName()) {
                paramType = this.parseTypeName();
            } else if (this.kw() &&
                (isUnsupportedDeclTypeName(this.kw()!) || canonicalIdentifier(this.kw()!) === 'void') &&
                this.peek(1).kind === 'ident') {
                const t = this.advance();
                this.error(t, this.unsupportedTypeMessage(t.value, 'parameter'));
            }
            const name = this.expectIdent();
            if (paramType) {
                paramType = this.parseArraySuffix(paramType);
            }
            out.push({ qualifier, paramType, name, isRef, start, end: this.prev().end });
            if (!this.isPunct(',')) { break; }
            const comma = this.advance();
            if (this.isPunct(')')) {
                this.error(comma, 'Trailing commas are not allowed in parameter lists');
                break;
            }
        }
    }

    private parseOptionalParamQualifier(): { qualifier?: string; isRef: boolean } {
        const k = this.kw();
        if (k === 'ref' || k === 'local' || k === 'static') {
            const qualifier = this.advance().value.toLowerCase();
            return { qualifier, isRef: qualifier === 'ref' };
        }
        return { isRef: false };
    }

    // --- statements ---------------------------------------------------------

    private parseBlock(): A.Block {
        const start = this.peek().start;
        this.expect('{', "Expected '{'");
        const body: A.Stmt[] = [];
        while (!this.eof() && !this.isPunct('}')) {
            const before = this.pos;
            const stmt = this.parseStatement();
            if (stmt) { body.push(stmt); }
            if (this.pos === before) { this.advance(); }
        }
        this.expect('}', "Missing closing brace '}'");
        return { kind: 'Block', body, start, end: this.prev().end };
    }

    private parseStatement(): A.Stmt | null {
        const t = this.peek();

        if (this.isPunct(';')) { this.pos++; return { kind: 'Empty', start: t.start, end: t.end }; }
        if (this.isPunct('{')) {
            this.error(t, 'Standalone blocks are not valid BHS statements');
            return this.parseBlock();
        }

        const k = this.kw();
        if (k) {
            switch (k) {
                case 'struct': return this.parseStruct();
                case 'if': return this.parseIf();
                case 'while': return this.parseWhile();
                case 'for': return this.parseFor();
                case 'do': return this.parseDoWhile();
                case 'switch': return this.parseSwitch();
                case 'return': return this.parseReturn();
                case 'break': return this.parseBreakOrContinue('Break');
                case 'continue': return this.parseBreakOrContinue('Continue');
                case 'trigger': return this.parseTrigger();
                case 'run_once': return this.parseRunOnce();
                case 'labels': return this.parseLabels();
            }
            if (QUALIFIERS.has(k) || this.isTypeBeforeName()) {
                return this.finishSimpleStatement(this.parseDeclOrExpr(), true);
            }
            if (k === 'void') { return this.parseUnsupportedDeclaration(); }
        }

        return this.finishSimpleStatement(this.parseDeclOrExpr(), true);
    }

    private parseControlledStatement(): A.Stmt {
        if (this.isPunct('{')) {
            return this.parseBlock();
        }
        return this.parseStatement() ?? this.emptyAt();
    }

    private parseBreakOrContinue(kind: 'Break' | 'Continue'): A.BreakStmt | A.ContinueStmt {
        const start = this.advance().start;
        const stmt = { kind, start, end: this.prev().end } as A.BreakStmt | A.ContinueStmt;
        this.expectSemicolon();
        stmt.end = this.prev().end;
        return stmt;
    }

    /** Parse a declaration / assignment / expression statement (no terminator). */
    private parseDeclOrExpr(): A.Stmt {
        const k = this.kw();
        if (k && (QUALIFIERS.has(k) || this.isTypeBeforeName())) {
            return this.parseVarDecl();
        }
        // Expression or assignment statement.
        const start = this.peek().start;
        const expr = this.parseExpression();
        const opTok = this.peek();
        if (opTok.kind === 'op' && ASSIGN_OPS.has(opTok.value)) {
            this.pos++;
            const value = this.parseExpression();
            return { kind: 'Assign', target: expr, op: opTok.value, value, start, end: this.prev().end };
        }
        return { kind: 'ExprStmt', expr, start, end: this.prev().end };
    }

    private parseVarDecl(): A.VarDecl {
        const start = this.peek().start;
        let qualifier: string | undefined;
        const k = this.kw();
        if (k && QUALIFIERS.has(k)) { qualifier = this.advance().value.toLowerCase(); }
        let varType: string | undefined;
        if (this.isTypeBeforeName()) { varType = this.parseTypeName(); }
        else if (this.kw() &&
            (isUnsupportedDeclTypeName(this.kw()!) || canonicalIdentifier(this.kw()!) === 'void') &&
            this.peek(1).kind === 'ident') {
            const t = this.advance();
            this.error(t, this.unsupportedTypeMessage(t.value, 'declaration'));
        }

        const declarators: A.Declarator[] = [];
        do {
            const name = this.expectIdent();
            const declaratorType = varType ? this.parseArraySuffix(varType) : undefined;
            let init: A.Expr | undefined;
            if (this.eat('=')) { init = this.parseExpression(); }
            declarators.push({ name, varType: declaratorType, init });
        } while (this.eat(','));

        return { kind: 'VarDecl', qualifier, varType, declarators, start, end: this.prev().end };
    }

    private parseUnsupportedDeclaration(): A.EmptyStmt {
        const t = this.advance();
        this.error(t, this.unsupportedTypeMessage(t.value, 'declaration'));
        while (!this.eof() && !this.isPunct(';') && !this.isPunct('}')) { this.advance(); }
        if (this.isPunct(';')) { this.advance(); }
        return { kind: 'Empty', start: t.start, end: this.prev().end };
    }

    private unsupportedTypeMessage(typeName: string, context: 'declaration' | 'parameter' | 'script return'): string {
        const base = `Type '${typeName}' is not a supported BHS ${context} type`;
        const replacement = TYPE_REPLACEMENTS[typeName.toLowerCase()];
        return replacement ? `${base}; use '${replacement}' instead` : base;
    }

    /**
     * Normalize built-in type keywords for case-insensitive use, while preserving
     * custom struct type casing for display in hover and completion.
     */
    private normalizeType(typeName: string): string {
        const lower = canonicalIdentifier(typeName);
        return TYPE_KEYWORDS.has(lower) ? lower : typeName;
    }

    private parseTypeName(): string {
        const typeToken = this.expectIdent();
        return this.parseArraySuffix(this.normalizeType(typeToken.name));
    }

    private parseArraySuffix(typeName: string): string {
        while (this.isEmptyArraySuffix()) {
            this.advance();
            this.advance();
            typeName += '[]';
        }
        return typeName;
    }

    private isEmptyArraySuffix(offset = 0): boolean {
        return this.peek(offset).kind === 'punct' && this.peek(offset).value === '[' &&
            this.peek(offset + 1).kind === 'punct' && this.peek(offset + 1).value === ']';
    }

    private isTypeBeforeName(offset = 0): boolean {
        const typeToken = this.peek(offset);
        if (typeToken.kind !== 'ident') { return false; }
        if (STATEMENT_KEYWORDS.has(canonicalIdentifier(typeToken.value))) { return false; }

        let nameOffset = offset + 1;
        while (this.isEmptyArraySuffix(nameOffset)) {
            nameOffset += 2;
        }
        return this.peek(nameOffset).kind === 'ident';
    }

    private finishSimpleStatement(stmt: A.Stmt, requireSemicolon: boolean): A.Stmt {
        if (requireSemicolon) { this.expectSemicolon(); }
        stmt.end = this.prev().end;
        return stmt;
    }

    private parseIf(): A.IfStmt {
        const start = this.advance().start; // if
        this.expect('(', "Expected '(' after 'if'");
        const cond = this.parseExpression();
        this.expect(')', "Expected ')' after condition");
        const then = this.parseControlledStatement();
        let alt: A.Stmt | undefined;
        if (this.isKw('else')) { this.advance(); alt = this.parseControlledStatement(); }
        return { kind: 'If', cond, then, alt, start, end: this.prev().end };
    }

    private parseWhile(): A.WhileStmt {
        const start = this.advance().start;
        this.expect('(', "Expected '(' after 'while'");
        const cond = this.parseExpression();
        this.expect(')', "Expected ')' after condition");
        const body = this.parseControlledStatement();
        return { kind: 'While', cond, body, start, end: this.prev().end };
    }

    private parseFor(): A.ForStmt {
        const start = this.advance().start;
        this.expect('(', "Expected '(' after 'for'");
        let init: A.Stmt | undefined;
        if (!this.isPunct(';')) { init = this.parseDeclOrExpr(); }
        this.expect(';', "Expected ';' in for-clause");
        let cond: A.Expr | undefined;
        if (this.isPunct(';')) {
            this.error(this.peek(), 'The condition clause of a for-loop cannot be empty');
        } else {
            cond = this.parseExpression();
        }
        this.expect(';', "Expected ';' in for-clause");
        let update: A.Stmt | undefined;
        if (!this.isPunct(')')) { update = this.parseDeclOrExpr(); }
        this.expect(')', "Expected ')' after for-clause");
        const body = this.parseControlledStatement();
        return { kind: 'For', init, cond, update, body, start, end: this.prev().end };
    }

    private parseDoWhile(): A.DoWhileStmt {
        const start = this.advance().start;
        const body = this.parseControlledStatement();
        // 'while' is an identifier token; consume it explicitly.
        if (this.isKw('while')) { this.advance(); } else { this.error(this.peek(), "Expected 'while' after do-body"); }
        this.expect('(', "Expected '(' after 'while'");
        const cond = this.parseExpression();
        this.expect(')', "Expected ')' after condition");
        this.expectSemicolon();
        return { kind: 'DoWhile', body, cond, start, end: this.prev().end };
    }

    private parseSwitch(): A.SwitchStmt {
        const start = this.advance().start;
        this.expect('(', "Expected '(' after 'switch'");
        const disc = this.parseExpression();
        this.expect(')', "Expected ')' after switch expression");
        this.expect('{', "Expected '{' to open switch body");
        const cases: A.SwitchCase[] = [];
        while (!this.eof() && !this.isPunct('}')) {
            if (this.isKw('case')) {
                this.advance();
                const test = this.parseExpression();
                this.expect(':', "Expected ':' after case label");
                cases.push({ test, body: this.parseCaseBody() });
            } else if (this.isKw('default')) {
                this.advance();
                this.expect(':', "Expected ':' after default");
                cases.push({ test: undefined, body: this.parseCaseBody() });
            } else {
                const unexpected = this.peek();
                this.error(unexpected, "Expected 'case' or 'default' in switch body");
                // Recover once for the whole invalid region instead of silently
                // discarding tokens without explaining the malformed switch.
                while (!this.eof() && !this.isPunct('}') &&
                    !this.isKw('case') && !this.isKw('default')) {
                    this.advance();
                }
            }
        }
        this.expect('}', "Missing closing brace '}'");
        return { kind: 'Switch', disc, cases, start, end: this.prev().end };
    }

    private parseCaseBody(): A.Stmt[] {
        const body: A.Stmt[] = [];
        while (!this.eof() && !this.isPunct('}') && !this.isKw('case') && !this.isKw('default')) {
            const before = this.pos;
            const s = this.parseStatement();
            if (s) { body.push(s); }
            if (this.pos === before) { this.advance(); }
        }
        return body;
    }

    private parseReturn(): A.ReturnStmt {
        const start = this.advance().start;
        let value: A.Expr | undefined;
        if (!this.isPunct(';')) { value = this.parseExpression(); }
        const stmt: A.ReturnStmt = { kind: 'Return', value, start, end: this.prev().end };
        this.expectSemicolon();
        stmt.end = this.prev().end;
        return stmt;
    }

    private parseTrigger(): A.TriggerStmt {
        const start = this.advance().start;
        const name = this.isPunct('(') ? undefined : this.expectIdent();
        this.expect('(', name ? "Expected '(' after trigger name" : "Expected '(' after trigger");
        const cond: A.Expr = this.isPunct(')')
            ? { kind: 'Bool', value: true, start: this.peek().start, end: this.peek().start }
            : this.parseExpression();
        this.expect(')', "Expected ')' after trigger condition");
        const body = this.parseBlock();
        return { kind: 'Trigger', name, cond, body, start, end: this.prev().end };
    }

    private parseRunOnce(): A.RunOnceStmt {
        const start = this.advance().start;
        const body = this.parseBlock();
        return { kind: 'RunOnce', body, start, end: this.prev().end };
    }

    private parseLabels(): A.LabelsBlock {
        const start = this.advance().start;
        this.expect('{', "Expected '{' to open labels block");
        const entries: A.LabelEntry[] = [];
        while (!this.eof() && !this.isPunct('}')) {
            if (this.peek().kind !== 'ident') { this.advance(); continue; }
            const name = this.expectIdent();
            let value: A.Expr | undefined;
            if (this.eat('=')) { value = this.parseExpression(); }
            entries.push({ name, value });
            if (!this.eat(',')) { break; }
        }
        this.expect('}', "Missing closing brace '}'");
        return { kind: 'Labels', entries, start, end: this.prev().end };
    }

    private emptyAt(): A.EmptyStmt {
        const t = this.prev();
        return { kind: 'Empty', start: t.end, end: t.end };
    }

    // --- expressions --------------------------------------------------------

    parseExpression(): A.Expr {
        return this.parseTernary();
    }

    private parseTernary(): A.Expr {
        const cond = this.parseBinary(1);
        if (this.isPunct('?')) {
            const start = cond.start;
            this.advance();
            const whenTrue = this.parseExpression();
            this.expect(':', "Expected ':' in conditional expression");
            const whenFalse = this.parseExpression();
            return { kind: 'Ternary', cond, whenTrue, whenFalse, start, end: this.prev().end };
        }
        return cond;
    }

    private parseBinary(minPrec: number): A.Expr {
        let left = this.parseUnary();
        for (;;) {
            const t = this.peek();
            if (t.kind === 'op' && BINARY_PREC[t.value] !== undefined) {
                const prec = BINARY_PREC[t.value];
                if (prec < minPrec) { break; }
                this.advance();
                // '^' (power) is right-associative; the rest left-associative.
                const right = this.parseBinary(t.value === '^' ? prec : prec + 1);
                left = { kind: 'Binary', op: t.value, left, right, start: left.start, end: right.end };
                continue;
            }
            // Two operands with no operator between them, on the same line. A
            // line break instead means a new statement (handled as a missing
            // semicolon), not a missing operator.
            if (this.startsOperand() && !t.newlineBefore) {
                this.error(t, 'Missing operator between operands');
                const right = this.parseUnary();
                left = { kind: 'Binary', op: '?', left, right, start: left.start, end: right.end };
                continue;
            }
            break;
        }
        return left;
    }

    /** True when the current token can begin a value operand. */
    private startsOperand(): boolean {
        const t = this.peek();
        return t.kind === 'number' || t.kind === 'string' || t.kind === 'char' || t.kind === 'ident';
    }

    private parseUnary(): A.Expr {
        const cast = this.tryParseCast();
        if (cast) { return cast; }

        const t = this.peek();
        if (t.kind === 'op' && PREFIX_OPS.has(t.value)) {
            this.advance();
            const operand = this.parseUnary();
            return { kind: 'Unary', op: t.value, operand, prefix: true, start: t.start, end: operand.end };
        }
        return this.parsePostfix();
    }

    /**
     * A C-style cast `(type)operand`, recognised when `type` is a built-in
     * value type or a previously declared struct. Restricting custom casts to
     * known structs keeps ordinary expressions such as `(value) + 1`
     * unambiguous.
     */
    private tryParseCast(): A.Expr | undefined {
        if (!this.isPunct('(')) { return undefined; }
        const typeTok = this.peek(1);
        if (typeTok.kind !== 'ident') { return undefined; }
        const typeKey = typeTok.value.toLowerCase();
        if (!VALUE_TYPE_KEYWORDS.has(typeKey) && !this.knownStructTypes.has(typeKey)) { return undefined; }
        let closeOffset = 2;
        while (this.isEmptyArraySuffix(closeOffset)) {
            closeOffset += 2;
        }
        const close = this.peek(closeOffset);
        if (close.kind !== 'punct' || close.value !== ')') { return undefined; }

        const start = this.peek().start;
        this.advance();                                            // (
        const castType = this.parseArraySuffix(
            this.normalizeType(this.advance().value));             // type and [] suffixes
        this.advance();                                            // )
        const operand = this.parseUnary();
        return { kind: 'Cast', castType, operand, start, end: operand.end };
    }

    private parsePostfix(): A.Expr {
        let expr = this.parsePrimary();
        for (;;) {
            if (this.isPunct('.')) {
                expr = this.parseMemberAccess(expr);
                continue;
            }
            if (this.isPunct('[')) {
                expr = this.parseIndexAccess(expr);
                continue;
            }
            if (this.isOp('++') || this.isOp('--')) {
                const op = this.advance();
                expr = { kind: 'Unary', op: op.value, operand: expr, prefix: false, start: expr.start, end: op.end };
                continue;
            }
            break;
        }
        return expr;
    }

    private parseMemberAccess(receiver: A.Expr): A.Expr {
        this.expect('.', "Expected '.'");
        const member = this.expectIdent();
        if (EXPRESSION_RESERVED_WORDS.has(member.name)) {
            this.error(member, 'Expected an identifier');
            return { kind: 'Error', start: receiver.start, end: member.end };
        }
        if (this.isPunct('(')) {
            return this.parseCall(member, receiver);
        }
        return { kind: 'Member', receiver, field: member, start: receiver.start, end: member.end };
    }

    private parseIndexAccess(receiver: A.Expr): A.Expr {
        this.expect('[', "Expected '['");
        const index = this.parseExpression();
        this.expect(']', "Expected ']' after index expression");
        return { kind: 'Index', receiver, index, start: receiver.start, end: this.prev().end };
    }

    private parsePrimary(): A.Expr {
        const t = this.peek();

        if (t.kind === 'number') {
            this.pos++;
            const isFloat = !/^0[xX]/.test(t.value) && /[.eE]/.test(t.value);
            return { kind: 'Number', value: t.value, isFloat, start: t.start, end: t.end };
        }
        if (t.kind === 'string') {
            this.pos++;
            let value = t.value;
            let end = t.end;
            // As in C, adjacent string tokens are concatenated by the compiler
            // before expression analysis: "first" "second" is one literal.
            while (this.peek().kind === 'string') {
                const next = this.advance();
                value = value.slice(0, -1) + next.value.slice(1);
                end = next.end;
            }
            return { kind: 'String', value, start: t.start, end };
        }
        if (t.kind === 'char') { this.pos++; return { kind: 'Char', value: t.value, start: t.start, end: t.end }; }

        if (t.kind === 'ident') {
            if (t.value === 'true' || t.value === 'false') {
                this.pos++;
                return { kind: 'Bool', value: t.value === 'true', start: t.start, end: t.end };
            }
            if (isReservedIdentifier(t.value)) {
                this.pos++;
                this.error(t, 'Expected an expression');
                return { kind: 'Error', start: t.start, end: t.start };
            }
            this.pos++;
            const id: A.Ident = { kind: 'Ident', name: t.value, start: t.start, end: t.end };
            if (this.isPunct('(')) { return this.parseCall(id); }
            return id;
        }

        if (this.isPunct('(')) {
            const start = t.start;
            this.advance();
            const expr = this.parseExpression();
            this.expect(')', "Expected ')'");
            return { kind: 'Paren', expr, start, end: this.prev().end };
        }

        // Nothing valid here.
        this.error(t, 'Expected an expression');
        return { kind: 'Error', start: t.start, end: t.start };
    }

    private parseCall(callee: A.Ident, receiver?: A.Expr): A.CallExpr {
        this.expect('(', "Expected '('");
        const args: A.Expr[] = [];
        if (!this.isPunct(')')) {
            for (;;) {
                args.push(this.parseExpression());
                if (!this.eat(',')) { break; }
                if (this.isPunct(')')) {
                    this.error(this.peek(), 'Expected an argument after comma');
                    break;
                }
            }
        }
        this.expect(')', "Expected ')' after arguments");
        return { kind: 'Call', callee, args, receiver, start: receiver?.start ?? callee.start, end: this.prev().end };
    }
}

export function parse(tokens: Token[]): { program: A.Program; diagnostics: ParseDiagnostic[] } {
    const parser = new Parser(tokens);
    const program = parser.parseProgram();
    return { program, diagnostics: parser.diagnostics };
}
