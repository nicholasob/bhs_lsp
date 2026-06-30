/**
 * Tokenizer for Big Huge Script.
 *
 * Produces a flat token stream plus lexical diagnostics (unterminated strings,
 * invalid character literals, malformed numbers, unknown symbols). Comments and
 * whitespace are skipped.
 */

export type TokenKind = 'ident' | 'number' | 'string' | 'char' | 'op' | 'punct' | 'eof';

export interface Token {
    kind: TokenKind;
    value: string;
    start: number;
    end: number;
    /** True when at least one line break precedes this token. */
    newlineBefore: boolean;
}

export interface LexDiagnostic {
    start: number;
    end: number;
    message: string;
    severity: number;
}

// Single-character punctuation that the parser dispatches on.
const PUNCT = new Set(['{', '}', '(', ')', '[', ']', ';', ',', ':', '?', '.']);

// Operators, longest first so greedy matching picks '==' over '='.
const OPERATORS = [
    '<<=', '>>=',
    '==', '!=', '<=', '>=', '<<', '>>', '&&', '||', '++', '--',
    '+=', '-=', '*=', '/=', '%=', '^=',
    '+', '-', '*', '/', '%', '^', '<', '>', '=', '!', '&', '|'
];

const isSpace = (c: string) => c === ' ' || c === '\t' || c === '\r' || c === '\n' || c === '\f' || c === '\v';
const isDigit = (c: string) => c >= '0' && c <= '9';
const isHexDigit = (c: string) => isDigit(c) || (c.toLowerCase() >= 'a' && c.toLowerCase() <= 'f');
const isIdentStart = (c: string) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
const isIdentPart = (c: string) => isIdentStart(c) || isDigit(c);

export function tokenize(text: string): { tokens: Token[]; diagnostics: LexDiagnostic[] } {
    const tokens: Token[] = [];
    const diagnostics: LexDiagnostic[] = [];
    const n = text.length;
    let i = 0;
    let nl = false;   // a line break has been seen since the last token

    const push = (kind: TokenKind, value: string, start: number, end: number) => {
        tokens.push({ kind, value, start, end, newlineBefore: nl });
        nl = false;
    };

    while (i < n) {
        const c = text[i];

        if (isSpace(c)) { if (c === '\n') { nl = true; } i++; continue; }

        // Comments
        if (c === '/' && text[i + 1] === '/') {
            i += 2;
            while (i < n && text[i] !== '\n') { i++; }
            continue;
        }
        if (c === '/' && text[i + 1] === '*') {
            const start = i;
            i += 2;
            let depth = 1;
            while (i < n && depth > 0) {
                if (text[i] === '/' && text[i + 1] === '*') {
                    depth++;
                    i += 2;
                    continue;
                }
                if (text[i] === '*' && text[i + 1] === '/') {
                    depth--;
                    i += 2;
                    continue;
                }
                if (text[i] === '\n') { nl = true; }
                i++;
            }
            if (depth > 0) {
                diagnostics.push({ start, end: i, message: 'Unterminated block comment', severity: 1 });
            }
            continue;
        }

        // String literal
        if (c === '"') {
            const start = i;
            i++;
            let closed = false;
            while (i < n) {
                if (text[i] === '\\') { i += 2; continue; }
                if (text[i] === '"') { i++; closed = true; break; }
                if (text[i] === '\n') { break; }
                i++;
            }
            if (!closed) {
                diagnostics.push({ start, end: i, message: 'Unterminated string literal', severity: 1 });
            }
            push('string', text.slice(start, i), start, i);
            continue;
        }

        // Character literal
        if (c === "'") {
            const start = i;
            i++;
            while (i < n) {
                if (text[i] === '\\') { i += 2; continue; }
                if (text[i] === "'") { i++; break; }
                if (text[i] === '\n') { break; }
                i++;
            }
            const raw = text.slice(start, i);
            if (!/^'(?:\\.|[^'\\])'$/.test(raw)) {
                diagnostics.push({
                    start,
                    end: i,
                    message: `Invalid character literal ${raw}. Single quotes denote a single character; use double quotes "..." for strings.`,
                    severity: 1
                });
            }
            push('char', raw, start, i);
            continue;
        }

        // Number (hexadecimal integer or decimal, including leading-dot)
        if (isDigit(c) || (c === '.' && isDigit(text[i + 1] || ''))) {
            const start = i;
            if (c === '0' && (text[i + 1] === 'x' || text[i + 1] === 'X') && isHexDigit(text[i + 2] || '')) {
                i += 2;
                while (i < n && isHexDigit(text[i])) { i++; }
                push('number', text.slice(start, i), start, i);
                continue;
            }
            while (i < n && (isDigit(text[i]) || text[i] === '.')) { i++; }
            if (text[i] === 'e' || text[i] === 'E') {
                i++;
                if (text[i] === '+' || text[i] === '-') { i++; }
                while (i < n && isDigit(text[i])) { i++; }
            }
            const raw = text.slice(start, i);
            if (!/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(raw)) {
                diagnostics.push({ start, end: i, message: `Invalid number '${raw}'`, severity: 1 });
            }
            push('number', raw, start, i);
            continue;
        }

        // Identifier / keyword
        if (c === '$' && isIdentStart(text[i + 1] || '')) {
            const start = i;
            i++;
            while (i < n && isIdentPart(text[i])) { i++; }
            push('ident', text.slice(start, i), start, i);
            continue;
        }

        // Identifier / keyword
        if (isIdentStart(c)) {
            const start = i;
            while (i < n && isIdentPart(text[i])) { i++; }
            push('ident', text.slice(start, i), start, i);
            continue;
        }

        // Operators
        let matched = false;
        for (const op of OPERATORS) {
            if (text.startsWith(op, i)) {
                push('op', op, i, i + op.length);
                i += op.length;
                matched = true;
                break;
            }
        }
        if (matched) { continue; }

        // Punctuation
        if (PUNCT.has(c)) {
            push('punct', c, i, i + 1);
            i++;
            continue;
        }

        // Anything else is unknown
        diagnostics.push({ start: i, end: i + 1, message: `Unknown symbol "${c}" encountered.`, severity: 1 });
        i++;
    }

    push('eof', '', n, n);
    return { tokens, diagnostics };
}
