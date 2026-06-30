import * as A from '../ast/ast';
import { PrimitiveType, ScopeType } from '../types';
import { caseDisplayText, resolveLabels, switchCaseKey } from './constantValues';
import { SemanticScopeKind } from './analysisScopes';
import { TypeName } from './declarationCollector';
import { ExpressionAnalyzer } from './expressionAnalyzer';
import { isImplicitPrimitiveConversion, isReservedIdentifier } from '../languageFacts';
import { isArrayType } from './typeRelations';

/**
 * Second semantic pass: validate statements in source order and publish each
 * declaration when the game compiler would make it visible.
 */
export class StatementAnalyzer extends ExpressionAnalyzer {
    protected checkTopLevel(item: A.TopLevel): void {
        if (item.kind === 'Include') {
            const included = this.includedPrograms.find(group => group.include === item);
            if (included) { this.importIncludedPrograms(included.programs, item.start); }
            return;
        }
        if (item.kind === 'Struct') { this.checkStruct(item); return; }
        if (item.kind === 'Script') { this.checkScript(item); return; }
        if (item.kind === 'Labels' || item.kind === 'Empty') {
            this.checkStmt(item);
            return;
        }
        this.report(item, `Statement must be declared inside a script block`, 1);
        return;
    }

    private importIncludedPrograms(programs: readonly A.Program[], visibleFrom: number): void {
        const previousCollecting = this.collectingIncludedProgram;
        const previousVisibilityStart = this.importedVisibilityStart;
        this.collectingIncludedProgram = true;
        this.importedVisibilityStart = visibleFrom;
        try {
            for (const program of programs) {
                this.collectProgram(program);
                for (const item of program.items) {
                    if (item.kind === 'Struct') {
                        this.addAvailableStruct(item);
                    } else if (item.kind === 'Script' && item.name?.name) {
                        this.availableFuncNames.add(item.name.name.toLowerCase());
                        this.addAvailableScriptSignature(item);
                    }
                }
            }
        } finally {
            this.collectingIncludedProgram = previousCollecting;
            this.importedVisibilityStart = previousVisibilityStart;
        }
    }

    private checkStruct(stmt: A.StructDecl): void {
        const key = stmt.name.name.toLowerCase();
        const alreadyDeclared = this.availableStructTypes.has(key);
        if (stmt.fields.length === 0) {
            this.report(stmt.name, `Struct '${stmt.name.name}' must declare at least one field`, 1);
        }
        if (isReservedIdentifier(stmt.name.name)) {
            this.report(stmt.name, `Cannot use reserved keyword '${stmt.name.name}' as a struct name`, 1);
        } else if (this.isAvailableUserFunctionName(stmt.name.name)) {
            this.report(stmt.name, `Struct '${stmt.name.name}' conflicts with a previously declared function or script`, 1);
        } else if (this.labelNames.has(key)) {
            this.report(stmt.name, `Struct '${stmt.name.name}' conflicts with a previously declared label`, 1);
        } else if (this.triggerNames.has(key)) {
            this.report(stmt.name, `Struct '${stmt.name.name}' conflicts with a previously declared trigger`, 1);
        } else if (this.hasVisibleVariableNamed(stmt.name.name)) {
            this.report(stmt.name, `Struct '${stmt.name.name}' conflicts with a visible variable or parameter of the same name`, 1);
        } else if (alreadyDeclared) {
            this.report(stmt.name, `Duplicate definition of struct '${stmt.name.name}' does not match the original`, 1);
        } else {
            this.addAvailableStruct(stmt);
        }
        const seen = new Set<string>();
        for (const field of stmt.fields) {
            const key = field.name.name.toLowerCase();
            const selfReferential = this.baseType(field.fieldType) === stmt.name.name.toLowerCase();
            if (key && isReservedIdentifier(field.name.name)) {
                this.report(field.name, `Cannot use reserved keyword '${field.name.name}' as a field name`, 1);
            } else if (key && seen.has(key)) {
                this.report(field.name, `Field '${field.name.name}' is already declared in struct '${stmt.name.name}'`, 1);
            } else if (key) {
                seen.add(key);
            }
            this.checkKnownType(field.fieldType, field);
            if (selfReferential) {
                this.report(field,
                    `Struct '${stmt.name.name}' cannot contain a field of its own type '${field.fieldType}'`,
                    1);
            }
            if (isArrayType(field.fieldType) && this.baseType(field.fieldType) === 'void') {
                this.report(field, `Struct field '${field.name.name}' cannot have array type 'void[]'`, 1);
            }
        }
    }

    protected checkKnownType(type: TypeName, at: A.Pos): void {
        const base = this.baseType(type);
        if (base && this.availableStructTypes.has(base)) {
            return;
        }
        if (base === 'anytype') {
            this.report(at, `The implicit type 'anytype' cannot be written explicitly; use a concrete type or omit the type where permitted`, 1);
            return;
        }
        if (!base || this.toPrimitiveType(base)) {
            return;
        }
        this.report(at, `Unknown type '${type}'`, 1);
    }

    private checkScript(s: A.ScriptDecl): void {
        if (s.returnType?.toLowerCase() === 'anytype') {
            this.report(s, `The implicit return type 'anytype' cannot be written explicitly; omit the return type`, 1);
        } else if (s.returnType) {
            this.checkKnownType(s.returnType, s);
        }

        let functionNameWasAlreadyAvailable = false;
        if (s.name && s.name.name) {
            const key = s.name.name.toLowerCase();
            const conflictsWithStruct = this.availableStructTypes.has(key);
            functionNameWasAlreadyAvailable = this.availableFuncNames.has(key);
            const signatureKey = `${s.scriptType.toLowerCase()}:${key}/${s.params.map(p =>
                `${p.isRef ? 'ref ' : ''}${this.overloadTypeKey(p.paramType ?? 'int')} ${p.name.name.toLowerCase()}`
            ).join(',')}`;
            const previousDeclaration = this.funcSignatures.get(signatureKey);
            const returnType = this.declaredScriptReturnType(s);
            if (isReservedIdentifier(s.name.name)) {
                this.report(s.name, `Cannot use reserved keyword '${s.name.name}' as a function name`, 1);
            } else if (conflictsWithStruct) {
                this.report(s.name, `Function '${s.name.name}' conflicts with struct type '${s.name.name}' (names are case-insensitive)`, 1);
            } else if (this.labelNames.has(key)) {
                this.report(s.name, `Function '${s.name.name}' conflicts with a label of the same name`, 1);
            } else if (previousDeclaration && previousDeclaration.returnType !== returnType) {
                this.report(s.name, `Overloaded script '${s.name.name}' differs only in return type`, 1);
            } else if (s.body && previousDeclaration?.hasBody) {
                this.report(s.name, `Function '${s.name.name}' with the same parameters is already declared`, 1);
            } else if (!previousDeclaration || s.body) {
                this.funcSignatures.set(signatureKey, { returnType, hasBody: !!s.body });
            }
            if (!isReservedIdentifier(s.name.name) && !conflictsWithStruct) {
                this.availableFuncNames.add(key);
                this.addAvailableScriptSignature(s);
            }
        }
        const seenParams = new Set<string>();
        const ownFunctionName = s.name?.name.toLowerCase();
        for (const p of s.params) {
            const key = p.name.name.toLowerCase();
            if (p.qualifier && !p.isRef) {
                this.report(p,
                    `Qualifier '${p.qualifier}' is not valid on a parameter; only 'ref' is supported`,
                    1);
            }
            if (key && isReservedIdentifier(p.name.name)) {
                this.report(p.name, `Cannot use reserved keyword '${p.name.name}' as a parameter name`, 1);
            } else if (key && this.availableStructTypes.has(key)) {
                this.report(p.name, `Parameter '${p.name.name}' conflicts with struct type '${p.name.name}' (names are case-insensitive)`, 1);
            } else if (key && this.isAvailableUserFunctionName(p.name.name) &&
                (key !== ownFunctionName || functionNameWasAlreadyAvailable)) {
                this.report(p.name, `Parameter '${p.name.name}' conflicts with a previously declared function or script`, 1);
            } else if (key && seenParams.has(key)) {
                this.report(p, `Parameter '${p.name.name}' is already declared`, 1);
            } else if (key) {
                seenParams.add(key);
            }
            if (p.paramType) {
                this.checkKnownType(p.paramType, p);
                if (this.baseType(p.paramType) === 'void') {
                    this.report(p, `Parameter '${p.name.name}' cannot have type 'void'`, 1);
                }
            }
            // Per the manual a `ref` parameter must have an explicit type.
            if (p.isRef && !p.paramType) {
                this.report(p, `Reference parameter '${p.name.name}' must be declared with an explicit type (e.g. 'ref int')`, 1);
            }
        }
        if (s.body) {
            const declaredReturnType = this.declaredScriptReturnType(s);
            if (s.returnType && this.isAggregateType(declaredReturnType) &&
                !this.hasTerminalReturn(s.body)) {
                this.report(s.body,
                    `Script expected to return a value of '${declaredReturnType}'; aggregate-returning scripts require a terminal return statement`,
                    1);
            }
            const previousParamNames = this.currentParamNames;
            const previousParamTypes = this.currentParamTypes;
            const previousReturnType = this.currentReturnType;
            const previousScriptType = this.currentScriptType;
            const previousDeclaredTriggerNames = this.triggerNames;
            const previousTriggerNames = this.currentTriggerNames;
            const previousTriggerDisplayNames = this.currentTriggerDisplayNames;
            this.currentParamNames = new Set<string>();
            this.currentParamTypes = new Map<string, TypeName>();
            for (const p of s.params) {
                const key = p.name.name.toLowerCase();
                if (key) {
                    this.currentParamNames.add(key);
                    this.currentParamTypes.set(key, p.paramType ?? 'int');
                }
            }
            const localTriggerNames = new Set<string>();
            const localTriggerDisplayNames: string[] = [];
            this.collectLocalTriggers(s.body, localTriggerNames, localTriggerDisplayNames);
            this.triggerNames = new Set<string>();
            this.currentTriggerNames = localTriggerNames;
            this.currentTriggerDisplayNames = localTriggerDisplayNames;
            this.currentReturnType = this.declaredScriptReturnType(s);
            this.currentScriptType = s.scriptType as ScopeType;
            this.assignments.push();
            this.checkBlock(s.body, 'script');
            this.assignments.pop();
            this.currentParamNames = previousParamNames;
            this.currentParamTypes = previousParamTypes;
            this.currentReturnType = previousReturnType;
            this.currentScriptType = previousScriptType;
            this.triggerNames = previousDeclaredTriggerNames;
            this.currentTriggerNames = previousTriggerNames;
            this.currentTriggerDisplayNames = previousTriggerDisplayNames;
        }
    }

    private checkStmt(stmt: A.Stmt): void {
        switch (stmt.kind) {
            case 'Struct':
                this.checkStruct(stmt);
                break;
            case 'VarDecl':
                this.checkVarDecl(stmt);
                break;
            case 'Assign':
                this.checkAssignment(stmt);
                break;
            case 'ExprStmt':
                this.checkExpr(stmt.expr);
                break;
            case 'If':
                this.checkCondition(stmt.cond);
                this.checkUnbracedDeclarationBody(stmt.then);
                if (stmt.alt && stmt.alt.kind !== 'If') {
                    this.checkUnbracedDeclarationBody(stmt.alt);
                }
                this.checkStmt(stmt.then);
                if (stmt.alt) { this.checkStmt(stmt.alt); }
                break;
            case 'While':
                this.checkCondition(stmt.cond);
                this.checkUnbracedDeclarationBody(stmt.body);
                this.withLoop(() => this.checkStmt(stmt.body));
                break;
            case 'For': {
                if (stmt.init) { this.checkStmt(stmt.init); }
                if (stmt.cond) { this.checkCondition(stmt.cond); }
                if (stmt.update) { this.checkStmt(stmt.update); }
                this.checkUnbracedDeclarationBody(stmt.body);
                this.withLoop(() => this.checkLoopBody(stmt.body));
                break;
            }
            case 'DoWhile':
                this.checkUnbracedDeclarationBody(stmt.body);
                this.withLoop(() => this.checkStmt(stmt.body));
                this.checkCondition(stmt.cond);
                break;
            case 'Break':
            case 'Continue':
                this.checkLoopControl(stmt);
                break;
            case 'Switch':
                this.checkExpr(stmt.disc);
                this.withSwitch(() => this.checkSwitchCases(stmt, this.expressionTypeName(stmt.disc)));
                break;
            case 'Return':
                this.checkReturn(stmt);
                break;
            case 'Block':
                this.checkBlock(stmt);
                break;
            case 'RunOnce':
                // A run_once body is its own execution; locals start fresh.
                this.assignments.push();
                this.checkStmt(stmt.body);
                this.assignments.pop();
                break;
            case 'Trigger':
                this.checkTriggerStmt(stmt);
                break;
            case 'Labels':
                this.checkLabelsStmt(stmt);
                break;
            default:
                break;
        }
    }

    private checkLoopControl(stmt: A.BreakStmt | A.ContinueStmt): void {
        if (stmt.kind === 'Break') {
            if (this.loopDepth === 0 && this.switchDepth === 0) {
                this.report(stmt, `'break' can only be used inside a loop or switch`, 1);
            }
            return;
        }

        if (this.loopDepth === 0) {
            this.report(stmt, `'continue' can only be used inside a loop`, 1);
        }
    }

    private checkUnbracedDeclarationBody(stmt: A.Stmt): void {
        if (stmt.kind === 'Block') {
            return;
        }

        // `name = value` declares an implicit local when name is not visible,
        // so it follows the same bracing rule as an explicit declaration.
        const isDeclaration = stmt.kind === 'VarDecl' || stmt.kind === 'Struct' ||
            (stmt.kind === 'Assign' && stmt.op === '=' && stmt.target.kind === 'Ident' &&
                !this.hasVisibleVariableNamed(stmt.target.name));
        if (isDeclaration) {
            this.report(stmt, `A declaration used as a control-flow body must be enclosed in braces`, 1);
        }
    }

    private checkSwitchCases(stmt: A.SwitchStmt, discriminatorType: TypeName): void {
		const seenCases = new Set<string>();
		let hasDefault = false;

		for (const c of stmt.cases) {
			if (c.test) {
				if (hasDefault) {
					this.report(c.test, `A case statement cannot appear after default`, 1);
				}

				const key = this.checkSwitchCaseValue(discriminatorType, c.test);

				if (key && seenCases.has(key)) {
					this.report(c.test, `Duplicate case statement '${caseDisplayText(c.test, this.labelCaseKeys)}'`, 1);
				} else if (key) {
					seenCases.add(key);
				}
			} else if (hasDefault) {
				this.report(c.body[0] ?? stmt, `Switch cannot contain more than one default case`, 1);
			} else {
				hasDefault = true;
			}

			this.pushScope('block');
			for (const s of c.body) {
				if (s.kind === 'Struct') {
					this.report(s, `Struct declarations are not valid directly inside switch cases`, 1);
				} else {
					this.checkStmt(s);
				}
			}
			this.popScope();
		}
	}

	private checkSwitchCaseValue(discriminatorType: TypeName, test: A.Expr): string | undefined {
		switch (test.kind) {
			case 'Number':
			case 'String':
			case 'Char':
			case 'Bool':
				this.checkSwitchCaseType(discriminatorType, test);
				return switchCaseKey(test, this.labelCaseKeys);

			case 'Ident': {
				const key = test.name.toLowerCase();

				if (this.labelNames.has(key)) {
					this.checkSwitchCaseType(discriminatorType, test);
					return switchCaseKey(test, this.labelCaseKeys);
				}

				// If includes failed, this identifier might be a label from a file
				// we could not inspect. Do not emit a false positive.
				if (this.suppressUnknownNames && !this.isKnownName(key)) {
					return undefined;
				}

				this.report(test, `Case identifier '${test.name}' must refer to a label constant`, 1);
				return undefined;
			}

			case 'Unary':
				this.report(test, `Unary operator '${test.op}' is not valid in a case statement`, 1);
				return undefined;

			case 'Binary':
				this.report(test, `Binary operator '${test.op}' is not valid in a case statement`, 1);
				return undefined;

			case 'Paren':
				this.report(test, `Parenthesized expressions are not valid in a case statement`, 1);
				return undefined;

			case 'Cast':
				this.report(test, `Cast expressions are not valid in a case statement`, 1);
				return undefined;

			case 'Call':
				this.report(test, `Function calls are not valid in a case statement`, 1);
				return undefined;

			case 'Ternary':
				this.report(test, `Ternary expressions are not valid in a case statement`, 1);
				return undefined;

			case 'Member':
			case 'Index':
				this.report(test, `Runtime storage values are not valid in a case statement; use a literal or label`, 1);
				return undefined;

			default:
				this.report(test, `Case value must be a literal or label constant`, 1);
				return undefined;
		}
	}

    private checkSwitchCaseType(discriminatorType: TypeName, test: A.Expr): void {
        const expected = this.expressionTypeNameFromType(discriminatorType);
        const actual = this.expressionTypeName(test);
        if (expected === 'anytype' || actual === 'anytype' || expected === actual ||
            (expected === 'int' && actual === 'bool') ||
            (expected === 'bool' && actual === 'int')) { return; }
        this.report(test, `Cannot convert ${this.describeValue(test)} to '${expected}'. An explicit cast is required.`, 1);
    }

    private expressionTypeNameFromType(type: TypeName): TypeName {
        return this.toPrimitiveType(type) ?? type.toLowerCase();
    }

    private checkVarDecl(stmt: A.VarDecl): void {
        if (stmt.qualifier === 'local') {
            this.report(stmt, `The 'local' qualifier is not supported for variable declarations`, 1);
        }
        for (const declarator of stmt.declarators) {
            const declaredType = declarator.varType ?? stmt.varType;
            const declared = this.declareVar(declarator.name);
            this.checkDeclaredType(stmt, declarator, declaredType);
            if (declarator.init) {
                // A declarator does not participate in member-name collisions
                // until its own initializer has finished evaluating.
                if (declared) { this.semanticScopes.deleteName(declarator.name.name); }
                this.checkExpr(declarator.init);
                this.checkAssignableType(declaredType, declarator.init);
                if (declared) { this.semanticScopes.addName(declarator.name.name); }
            }
            // A declared variable is available afterwards (typed decls are
            // zero-initialized; an undefined anytype is still readable).
            this.assignments.mark(declarator.name.name);
        }
    }

    private checkDeclaredType(stmt: A.VarDecl, declarator: A.Declarator, declaredType: TypeName | undefined): void {
        if (!declaredType) {
            return;
        }

        this.checkKnownType(declaredType, stmt);
        if (this.baseType(declaredType) === 'void') {
            this.report(stmt, `Local variable '${declarator.name.name}' cannot have type 'void'`, 1);
        }
        this.semanticScopes.declareType(declarator.name.name, declaredType);
    }

    private checkAssignment(stmt: A.AssignStmt): void {
        this.checkExpr(stmt.value);
        switch (stmt.target.kind) {
            case 'Ident':
                this.checkIdentAssignment(stmt, stmt.target);
                break;
            case 'Member':
                this.checkMemberOrIndexAssignment(stmt, this.memberType(stmt.target));
                break;
            case 'Index':
                this.checkMemberOrIndexAssignment(stmt, this.expressionTypeName(stmt.target));
                break;
            default:
                this.checkExpr(stmt.target);
                this.report(stmt.target, `The left side of '${stmt.op}' must be a writable variable, field, or array element`, 1);
                break;
        }
    }

    private checkIdentAssignment(stmt: A.AssignStmt, target: A.Ident): void {
        const targetKey = target.name.toLowerCase();
        if (this.labelNames.has(targetKey)) {
            this.report(target, `Cannot assign to '${target.name}' because it is a constant (label).`, 1);
        } else if (stmt.op === '=') {
            this.checkSimpleIdentAssignment(target, stmt.value);
        } else {
            // Compound assignments (+=, *=, ...) read the target first.
            this.checkRead(target);
            this.checkCompoundAssignment(stmt);
        }
        this.assignments.mark(target.name);
    }

    private checkSimpleIdentAssignment(target: A.Ident, value: A.Expr): void {
        const key = target.name.toLowerCase();
        const targetType = this.lookupType(target.name);
        if (targetType) {
            this.checkAssignableType(targetType, value);
            return;
        }
        if (this.isAvailableUserFunctionName(target.name)) {
            this.report(target, `Variable '${target.name}' conflicts with a previously declared function or script`, 1);
            return;
        }
        if (this.availableStructTypes.has(key)) {
            this.report(target, `Variable '${target.name}' conflicts with struct type '${target.name}' (names are case-insensitive)`, 1);
            return;
        }
        if (this.triggerNames.has(key)) {
            this.report(target, `Variable '${target.name}' conflicts with a previously declared trigger`, 1);
            return;
        }
        const inferredType = this.expressionTypeName(value);
        this.declareImplicitLocal(target.name, inferredType);
        this.scopeManager.updateSymbolTypeAt(target.name, target.start, inferredType);
    }

    private checkMemberOrIndexAssignment(stmt: A.AssignStmt, targetType: TypeName | undefined): void {
        this.checkExpr(stmt.target);
        if (stmt.op === '=') {
            this.checkAssignableType(targetType, stmt.value);
        } else {
            if (!this.isWritableCompoundAssignmentTarget(stmt.target)) {
                this.report(stmt.target, `Operator '${stmt.op}' requires a writable variable, field, or array element`, 1);
                return;
            }
            this.checkCompoundAssignment(stmt);
        }
    }

    private isWritableCompoundAssignmentTarget(expr: A.Expr): boolean {
        if (expr.kind === 'Member') {
            return this.isWritableMemberTarget(expr);
        }
        return expr.kind === 'Ident' || expr.kind === 'Index';
    }

    private checkTriggerStmt(stmt: A.TriggerStmt): void {
        if (stmt.name) {
            const key = stmt.name.name.toLowerCase();
            if (this.isAvailableUserFunctionName(stmt.name.name)) {
                this.report(stmt.name, `Trigger '${stmt.name.name}' conflicts with a previously declared function or script`, 1);
            } else if (this.availableStructTypes.has(key)) {
                this.report(stmt.name, `Trigger '${stmt.name.name}' conflicts with struct type '${stmt.name.name}' (names are case-insensitive)`, 1);
            } else if (this.labelNames.has(key)) {
                this.report(stmt.name, `Trigger '${stmt.name.name}' conflicts with a previously declared label`, 1);
            } else if (this.hasVisibleVariableNamed(stmt.name.name)) {
                this.report(stmt.name, `Trigger '${stmt.name.name}' conflicts with a visible variable or parameter of the same name`, 1);
            } else if (this.triggerNames.has(key)) {
                this.report(stmt.name, `Duplicate trigger name '${stmt.name.name}'`, 1);
            } else {
                this.triggerNames.add(key);
            }
        }
        // Each trigger fires as its own execution; non-persistent locals do not
        // carry over from run_once or other triggers, so start fresh.
        this.assignments.push();
        this.checkCondition(stmt.cond);
        this.checkStmt(stmt.body);
        this.assignments.pop();
    }

    private checkLabelsStmt(stmt: A.LabelsBlock): void {
        const resolvedLabels = resolveLabels(stmt, expr => this.inferType(expr), this.labelCaseKeys);
        for (const [index, e] of stmt.entries.entries()) {
            const key = e.name.name.toLowerCase();
            const resolved = resolvedLabels[index];
            if (isReservedIdentifier(e.name.name)) {
                this.report(e.name, `Cannot use reserved keyword '${e.name.name}' as a label name`, 1);
            } else if (this.isAvailableUserFunctionName(e.name.name)) {
                this.report(e.name, `Label '${e.name.name}' conflicts with a previously declared function or script`, 1);
            } else if (this.availableStructTypes.has(key)) {
                this.report(e.name, `Label '${e.name.name}' conflicts with struct type '${e.name.name}' (names are case-insensitive)`, 1);
            } else if (this.hasVisibleVariableNamed(e.name.name)) {
                this.report(e.name, `Label '${e.name.name}' conflicts with a visible variable or parameter of the same name`, 1);
            } else if (this.triggerNames.has(key)) {
                this.report(e.name, `Label '${e.name.name}' conflicts with a previously declared trigger`, 1);
            } else if (this.labelNames.has(key)) {
                this.report(e.name, `Duplicate label '${e.name.name}'`, 1);
            } else {
                this.labelNames.add(key);
                this.define(e.name.name);
                this.globalNames.add(key);
                const type = resolved.type;
                this.varTypes.set(key, type === 'anytype' ? 'int' : type);
                if (resolved.caseKey) { this.labelCaseKeys.set(key, resolved.caseKey); }
            }
            if (e.value) { this.checkExpr(e.value); }
            if (e.value && !this.isConstantLabelValue(e.value)) {
                this.report(e.value, `Label values must be a constant literal (number, string, character, or boolean); expressions and function calls are not allowed`, 1);
            }
        }
    }

    private checkBlock(stmt: A.Block, kind: SemanticScopeKind = 'block'): void {
        this.pushScope(kind);
        for (const s of stmt.body) { this.checkStmt(s); }
        this.popScope();
    }

    /**
     * A for-loop header and its outer body share the current lexical scope:
     * `for (int i = 0; ... ) { int i = 1; }` redeclares `i`.
     */
    private checkLoopBody(stmt: A.Stmt): void {
        if (stmt.kind !== 'Block') {
            this.checkStmt(stmt);
            return;
        }
        this.checkBlock(stmt);
    }

    protected checkCondition(cond: A.Expr): void {
        this.checkExpr(cond);
        // BHS evaluates integer and boolean values as conditions. Aggregate,
        // floating-point, string, and void values are not condition-compatible.
        const type = this.expressionTypeName(cond);
        const primitive = this.toPrimitiveType(type);
        if (this.isAggregateType(type) ||
            (primitive !== 'int' && primitive !== 'bool' && primitive !== 'anytype')) {
            this.report(cond, `Condition of type '${type}' cannot be evaluated as a boolean value. Compare it explicitly to produce an integer result.`, 1);
        }
    }

    /**
     * The game's compiler does not perform narrowing or string<->number
     * conversions implicitly: `int x = 5000.0` (float->int) and `int x = "5"`
     * (string->int) are both rejected with "explicit cast required". Widening
     * (`int`->`float`) and to-string conversions are implicit, so
     * they are left alone, as are `anytype`/unknown values.
     */
    private checkAssignableType(targetType: TypeName | undefined, value: A.Expr): void {
        if (isArrayType(targetType)) {
            const sourceType = this.expressionTypeName(value);
            if (sourceType !== 'anytype' && sourceType !== targetType) {
                this.report(value, `Cannot convert ${this.describeValue(value)} to '${targetType}'. An explicit cast is required.`, 1);
            }
            return;
        }

        if (this.isStructType(targetType)) {
            const sourceType = this.expressionTypeName(value);
            if (sourceType !== 'anytype' && this.baseType(sourceType) !== this.baseType(targetType)) {
                this.report(value, `Cannot convert ${this.describeValue(value)} to '${targetType}'. An explicit cast is required.`, 1);
            }
            return;
        }

        const primitiveTarget = this.toPrimitiveType(targetType);
        if (primitiveTarget === 'string') {
            const sourceType = this.inferType(value);
            if (sourceType === 'void' || sourceType === 'bool') {
                this.report(value, `Cannot convert a value of type '${sourceType}' to 'string'. An explicit cast is required.`, 1);
            }
            return;
        }
        if (primitiveTarget !== 'int' && primitiveTarget !== 'float' && primitiveTarget !== 'bool') { return; }
        const src = this.inferType(value);
        if (src === 'anytype') { return; }
        if (!isImplicitPrimitiveConversion(src, primitiveTarget)) {
            this.report(value, `Cannot convert ${this.describeValue(value)} to '${primitiveTarget}'. An explicit cast is required.`, 1);
        }
    }

    private checkCompoundAssignment(stmt: A.AssignStmt): void {
        const targetType = this.expressionTypeName(stmt.target);
        const sourceType = this.expressionTypeName(stmt.value);
        if (this.isAggregateOrVoidType(targetType) || this.isAggregateOrVoidType(sourceType)) {
            this.report(stmt,
                `Operator '${stmt.op}' is not valid for aggregate or void operands ('${targetType}' and '${sourceType}')`,
                1);
            return;
        }
        if ((stmt.op === '<<=' || stmt.op === '>>=') &&
            (this.toPrimitiveType(targetType) === 'float' || this.inferType(stmt.value) === 'float')) {
            this.report(stmt, `Operator '${stmt.op}' is not valid for float values`, 1);
            return;
        }
        if (stmt.op === '%=' &&
            (this.toPrimitiveType(targetType) === 'float' || this.inferType(stmt.value) === 'float')) {
            this.report(stmt, `Operator '%=' is not valid for float values`, 1);
            return;
        }
        if (this.toPrimitiveType(targetType) === 'string' && stmt.op !== '+=') {
            this.report(stmt, `Operator '${stmt.op}' is not valid for string values`, 1);
            return;
        }
        if (stmt.op === '+=') {
            if (this.toPrimitiveType(targetType) === 'string') {
                if (this.inferType(stmt.value) === 'bool') {
                    this.report(stmt.value, `Cannot convert a value of type 'bool' to 'string'. An explicit cast is required.`, 1);
                }
                return;
            }
            this.checkAssignableType(targetType, stmt.value);
            return;
        }

        this.checkAssignableType(targetType, stmt.value);
    }

    protected isAggregateOrVoidType(type: TypeName): boolean {
        return this.isAggregateType(type) || this.toPrimitiveType(type) === 'void';
    }

    /**
     * Validate an explicit return statement. Missing return statements are valid:
     * the manual says scripts return the default value of their declared type.
     */
    private checkReturn(stmt: A.ReturnStmt): void {
        const expectedType = this.currentReturnType === 'anytype' ? 'int' : this.currentReturnType;
        if (!stmt.value) {
            if (expectedType !== 'void') {
                this.report(stmt, `Script expected to return a value of '${expectedType}'; cannot return without one`, 1);
            }
            return;
        }

        this.checkExpr(stmt.value);

        if (expectedType === 'void') {
            this.report(stmt.value, `Void scripts cannot return a value`, 1);
            return;
        }

        if (this.isAggregateType(expectedType)) {
            this.checkAssignableType(expectedType, stmt.value);
            return;
        }
        this.checkReturnValueType(expectedType as PrimitiveType, stmt.value);
    }

    private checkReturnValueType(targetType: PrimitiveType, value: A.Expr): void {
        const src = this.returnValueType(value);
        if (src === 'anytype') { return; }
        if (src === 'void') {
            this.report(value, `Cannot return a value of type 'void' from a script that returns '${targetType}'`, 1);
            return;
        }
        if (targetType === 'string' && src === 'bool') {
            this.report(value, `Cannot return a value of type 'bool' from a script that returns 'string'. An explicit cast is required.`, 1);
            return;
        }
        if (targetType === 'string') {
            return;
        }
        if (targetType === 'int' || targetType === 'float' || targetType === 'bool') {
            if (!isImplicitPrimitiveConversion(src, targetType)) {
                this.report(value, `Cannot return ${this.describeValue(value)} from a script that returns '${targetType}'. An explicit cast is required.`, 1);
            }
        }
    }

}
