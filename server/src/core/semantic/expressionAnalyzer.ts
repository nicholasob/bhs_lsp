import * as A from '../ast/ast';
import { FunctionSignature, getFunctionOverloads, PrimitiveType } from '../types';
import { suggestSimilar } from './nameSimilarity';
import { binaryOperatorIssue } from './operatorRules';
import { arrayRank, elementType, isArrayType } from './typeRelations';
import { canonicalIdentifier } from '../languageFacts';
import { DeclarationCollector, TypeName } from './declarationCollector';
import { binaryExpressionType, unaryExpressionType } from './expressionTypeRules';
import { intrinsicReturnType, isCompilerIntrinsic } from './intrinsics';

const TRIGGER_CONTROL_FUNCTIONS = new Set(['enable_trigger', 'disable_trigger']);
const TRIGGER_STRING_REFERENCE_FUNCTIONS = new Set([
    'enable_trigger',
    'disable_trigger',
    'is_trigger_enabled'
]);

/** Expression traversal, type inference, member access, and call validation. */
export abstract class ExpressionAnalyzer extends DeclarationCollector {
    protected abstract checkCondition(condition: A.Expr): void;
    protected abstract checkKnownType(type: TypeName, at: A.Pos): void;
    protected abstract isAggregateOrVoidType(type: TypeName): boolean;
    protected describeValue(value: A.Expr): string {
        if (value.kind === 'String') { return value.value; }      // already quoted
        if (value.kind === 'Number') { return `"${value.value}"`; }
        return `a value of type '${this.inferType(value)}'`;
    }

    /** Walk an expression, warning about identifiers that are never defined. */
    protected checkExpr(expr: A.Expr): void {
        switch (expr.kind) {
            case 'Ident':
                this.checkRead(expr);
                break;
            case 'Call':
                this.checkCall(expr);
                if (expr.receiver) {
                    this.checkExpr(expr.receiver);
                }
                for (let i = 0; i < expr.args.length; i++) {
                    if (this.isTriggerControlReferenceArg(expr, i)) {
                        continue;
                    }
                    this.checkExpr(expr.args[i]);
                }
                break;
            case 'Member':
                this.checkExpr(expr.receiver);
                this.checkMemberAccess(expr);
                break;
            case 'Index':
                this.checkExpr(expr.receiver);
                this.checkExpr(expr.index);
                this.checkIndexAccess(expr);
                break;
            case 'Unary':
                this.checkExpr(expr.operand);
                this.checkUnaryOperator(expr);
                break;
            case 'Binary':
                this.checkExpr(expr.left);
                this.checkExpr(expr.right);
                this.checkBinaryOperator(expr);
                break;
            case 'Ternary':
                this.checkCondition(expr.cond);
                this.checkExpr(expr.whenTrue);
                this.checkExpr(expr.whenFalse);
                break;
            case 'Paren':
                this.checkExpr(expr.expr);
                break;
            case 'Cast':
                if (expr.castType.toLowerCase() === 'anytype' &&
                    !this.availableStructTypes.has('anytype')) {
                    this.report(expr, `The implicit type 'anytype' cannot be used in an explicit cast`, 1);
                } else {
                    this.checkKnownType(expr.castType, expr);
                }
                this.checkExpr(expr.operand);
                this.checkCastCompatibility(expr);
                break;
            default:
                break;
        }
    }

    private checkCastCompatibility(expr: A.CastExpr): void {
        const targetType = expr.castType;
        const sourceType = this.expressionTypeName(expr.operand);

        if (sourceType === 'anytype') {
            return;
        }

        const targetRank = arrayRank(targetType);
        const sourceRank = arrayRank(sourceType);

        const targetIsArray = targetRank > 0;
        const sourceIsArray = sourceRank > 0;

        if (!targetIsArray && !sourceIsArray) {
            const targetIsStruct = this.isStructType(targetType);
            const sourceIsStruct = this.isStructType(sourceType);
            if ((targetIsStruct || sourceIsStruct) &&
                (!targetIsStruct || !sourceIsStruct ||
                    this.baseType(targetType) !== this.baseType(sourceType))) {
                this.report(expr,
                    `Cannot cast '${sourceType}' to '${targetType}': struct casts require the same declared type`,
                    1);
            }
            return;
        }

        if (targetRank !== sourceRank) {
            this.report(expr,
                `Cannot cast '${sourceType}' to '${targetType}': array casts must preserve dimensionality`,
                1);
            return;
        }

        const targetElementType = this.baseType(targetType);
        const sourceElementType = this.baseType(sourceType);

        if (targetElementType !== sourceElementType) {
            this.report(expr,
                `Cannot cast '${sourceType}' to '${targetType}': array casts must preserve element type`,
                1);
        }
    }

    private checkBinaryOperator(expr: A.BinaryExpr): void {
        const leftType = this.expressionTypeName(expr.left);
        const rightType = this.expressionTypeName(expr.right);
        const issue = binaryOperatorIssue(
            expr.op,
            {
                primitive: this.inferType(expr.left),
                type: leftType,
                isAggregate: this.isAggregateType(leftType),
                isAggregateOrVoid: this.isAggregateOrVoidType(leftType)
            },
            {
                primitive: this.inferType(expr.right),
                type: rightType,
                isAggregate: this.isAggregateType(rightType),
                isAggregateOrVoid: this.isAggregateOrVoidType(rightType)
            },
            this.aggregateEqualityTypesMatch(leftType, rightType)
        );
        if (issue) {
            this.report(issue.target === 'left' ? expr.left : expr, issue.message, 1);
        }
    }

    protected returnValueType(value: A.Expr): PrimitiveType {
        if (value.kind === 'Bool') { return 'int'; }
        if (value.kind === 'Paren') { return this.returnValueType(value.expr); }
        return this.inferType(value);
    }

    private checkUnaryOperator(expr: A.UnaryExpr): void {
        if (expr.op === '!') {
            const type = this.expressionTypeName(expr.operand);
            if (this.isAggregateType(type) || this.toPrimitiveType(type) === 'void') {
                this.report(expr, `Operator '!' is not valid for type '${type}'`, 1);
            }
            return;
        }
        if (expr.op === '+') {
            this.report(expr, `Unary operator '+' is not valid in an expression`, 1);
            return;
        }
        if (expr.op === '-') {
            const type = this.expressionTypeName(expr.operand);
            const primitive = this.toPrimitiveType(type);
            if (primitive !== 'int' && primitive !== 'float' && primitive !== 'bool' && primitive !== 'anytype') {
                this.report(expr, `Operator '-' is not valid for type '${type}'`, 1);
            }
            return;
        }
        if (expr.op !== '++' && expr.op !== '--') {
            return;
        }

        if (!this.isWritableUnaryTarget(expr.operand)) {
            this.report(expr.operand, `Operator '${expr.op}' requires a variable or array element; dotted members are not incrementable`, 1);
            return;
        }

        const type = this.expressionTypeName(expr.operand);
        const primitive = this.toPrimitiveType(type);
        if (primitive === 'int' || primitive === 'float') {
            return;
        }
        if (primitive === 'anytype' || primitive === undefined) {
            this.report(expr.operand, `Operator '${expr.op}' is only valid for numeric values; declare this variable as 'int' or 'float' if it is used as a loop counter`, 2);
            return;
        }
        this.report(expr.operand, `Operator '${expr.op}' is not valid for type '${type}'`, 1);
    }

    private isWritableUnaryTarget(expr: A.Expr): boolean {
        // The game reports every dotted member as a non-variable for ++/--,
        // including fields of otherwise writable local structs.
        if (expr.kind === 'Member') { return false; }
        return expr.kind === 'Ident' || expr.kind === 'Index';
    }

    protected isWritableMemberTarget(expr: A.MemberExpr): boolean {
        return !isArrayType(this.expressionTypeName(expr.receiver)) &&
            this.isVariablePath(expr.receiver);
    }

    /**
     * BHS dot access requires a variable path, not merely an expression whose
     * resulting type is a struct or array. Parentheses around an existing path
     * are transparent, but cannot turn a computed value into a variable.
     */
    private isVariablePath(expr: A.Expr): boolean {
        switch (expr.kind) {
            case 'Ident':
                return true;
            case 'Paren':
                return this.isVariablePath(expr.expr);
            case 'Member':
            case 'Index':
                return this.isVariablePath(expr.receiver);
            default:
                return false;
        }
    }

    private checkMemberAccess(expr: A.MemberExpr): void {
        const receiverType = this.expressionTypeName(expr.receiver);
        if (this.checkDotReceiver(expr.receiver, receiverType)) {
            return;
        }
        if (this.hasVisibleVariableNamed(expr.field.name)) {
            this.report(expr, `Cannot access member '${expr.field.name}' because a visible variable has the same name`, 1);
            return;
        }
        if (this.availableStructTypes.has(expr.field.name.toLowerCase())) {
            this.report(expr.field, `Cannot access member '${expr.field.name}' because a struct type has the same name (names are case-insensitive)`, 1);
            return;
        }
        if (isArrayType(receiverType)) {
            return;
        }
        const fields = this.structFields(receiverType);
        if (!fields) {
            return;
        }
        if (this.isAvailableUserFunctionName(expr.field.name)) {
            this.report(expr.field, `Cannot use function or script name '${expr.field.name}' as a bare struct member`, 1);
            return;
        }
        if (!fields.has(expr.field.name.toLowerCase())) {
            this.report(expr.field, `Struct '${receiverType}' has no field '${expr.field.name}'`, 1);
        }
    }

    private checkIndexAccess(expr: A.IndexExpr): void {
        const receiverType = this.expressionTypeName(expr.receiver);
        if (!isArrayType(receiverType)) {
            this.report(expr, `Type '${receiverType}' is not an array`, 1);
        } else if (!this.isVariablePath(expr.receiver)) {
            this.report(expr.receiver, `Array index may only be used on an array variable`, 1);
        }
    }

    protected memberType(expr: A.MemberExpr): TypeName | undefined {
        const receiverType = this.expressionTypeName(expr.receiver);
        if (isArrayType(receiverType)) {
            return 'int';
        }
        const fieldType = this.structFields(receiverType)?.get(expr.field.name.toLowerCase());
        // Although `void` is not a legal local or parameter type, the game
        // accepts scalar void struct fields and treats their values as
        // integer-backed. Keep this normalization specific to field reads so
        // actual void-returning function calls remain void.
        return this.baseType(fieldType) === 'void' ? 'int' : fieldType;
    }

    private structFields(type: TypeName | undefined): Map<string, TypeName> | undefined {
        const base = this.baseType(type);
        return base ? this.availableStructTypes.get(base) : undefined;
    }

    private checkDotReceiver(receiver: A.Expr, receiverType = this.expressionTypeName(receiver)): boolean {
        // Array dot members (such as `.length`) are value metadata and can be
        // read from computed arrays. Indexing has the stricter variable-path
        // requirement enforced by checkIndexAccess.
        if (isArrayType(receiverType)) {
            return false;
        }
        if (this.isStructType(receiverType)) {
            if (!this.isVariablePath(receiver)) {
                this.report(receiver, `Left of '.' must be a struct variable; '${receiverType}' is only a computed value`, 1);
                return true;
            }
            return false;
        }
        const primitive = this.toPrimitiveType(receiverType);
        if (primitive && primitive !== 'anytype') {
            this.report(receiver, `Can only use '.' with array or struct variables; got '${receiverType}'`, 1);
            return true;
        }
        return false;
    }

    private checkCall(expr: A.CallExpr): void {
        if (this.hasInvalidCallReceiver(expr)) {
            return;
        }
        if (this.hasCallNameCollision(expr.callee.name)) {
            this.report(expr, `Cannot call function '${expr.callee.name}' because a visible value or label has the same name`, 1);
            return;
        }

        const key = expr.callee.name.toLowerCase();
        if (this.userFunctionKeys.has(key) && !this.availableFuncNames.has(key)) {
            this.report(expr.callee, `Cannot find function or script '${expr.callee.name}' before it is declared`, 1);
            return;
        }
        const signatures = this.callSignatures(key);
        if (!signatures.length) {
            this.reportUnknownFunction(expr);
            return;
        }

        const { args, arityMatches, compatible, bestMatches } = this.callResolver.resolve(expr, signatures);
        if (!arityMatches.length) {
            this.reportArityMismatch(expr, signatures, args.length);
            return;
        }

        if (!compatible.length) {
            this.reportNoMatchingOverload(expr, signatures, args);
            return;
        }
        if (bestMatches.length > 1) {
            const argumentTypes = args.map(arg => this.expressionTypeName(arg)).join(', ');
            const allExact = bestMatches.every(signature => this.callResolver.isExactCall(signature, args));
            const message = allExact
                ? `Ambiguous call to '${expr.callee.name}': argument types (${argumentTypes}) exactly match ${bestMatches.length} overloads`
                : `Ambiguous call to '${expr.callee.name}': argument types (${argumentTypes}) require auto-casts to ${bestMatches.length} possible overloads. Use an explicit cast to resolve it`;
            this.report(expr, message, 1);
            return;
        }
        const signature = bestMatches[0];

        this.checkTriggerControlCall(expr);
        this.checkCallArguments(expr, signature, args);
    }

    private hasInvalidCallReceiver(expr: A.CallExpr): boolean {
        if (!expr.receiver) {
            return false;
        }
        if (this.checkDotReceiver(expr.receiver)) {
            return true;
        }
        return false;
    }

    private reportUnknownFunction(expr: A.CallExpr): void {
        // `$S("...")` (and other `$`-prefixed compiler intrinsics) are valid
        // even though they aren't in the function database.
        if (!this.suppressUnknownNames && !isCompilerIntrinsic(expr.callee.name)) {
            this.report(expr.callee, `Cannot find function or script '${expr.callee.name}'`, 1);
        }
    }

    private callSignatures(name: string): FunctionSignature[] {
        const signatures = getFunctionOverloads(this.availableFunctionSignatures, name);
        if (!this.currentScriptType) {
            return signatures;
        }
        return signatures.filter(signature =>
            !signature.scriptType || signature.scriptType === this.currentScriptType);
    }

    private reportArityMismatch(
        expr: A.CallExpr,
        signatures: readonly FunctionSignature[],
        argumentCount: number
    ): void {
        if (expr.receiver) {
            this.report(expr, `Invalid receiver call to '${expr.callee.name}': dotted calls require an overload whose first parameter accepts '${this.expressionTypeName(expr.receiver)}'`, 1);
            return;
        }

        this.report(expr, `Invalid call to '${expr.callee.name}': expected ${this.callResolver.describeAcceptedArities(signatures)} argument(s), got ${argumentCount}`, 1);
    }

    private reportNoMatchingOverload(
        expr: A.CallExpr,
        signatures: readonly FunctionSignature[],
        args: readonly A.Expr[]
    ): void {
        this.report(expr, `No overload for '${expr.callee.name}' matches argument types (${args.map(arg => this.expressionTypeName(arg)).join(', ')}). Available overloads: ${signatures.map(s => this.callResolver.formatSignature(s)).join('; ')}`, 1);
    }

    private checkCallArguments(expr: A.CallExpr, signature: FunctionSignature, args: readonly A.Expr[]): void {
        for (let i = 0; i < args.length; i++) {
            if (this.isTriggerControlReferenceArg(expr, i)) {
                continue;
            }
            if (signature.paramQualifiers?.[i] === 'ref' && this.checkRefArgument(expr, signature, i)) {
                continue;
            }
            const expectedType = signature.paramTypes[i];
            if (this.callResolver.isWildcardParameter(signature, i)) { continue; }
            const actualType = this.expressionTypeName(args[i]);
            if (!this.callResolver.isArgumentCompatible(args[i], expectedType)) {
                const paramName = signature.paramNames[i] ?? `argument ${i + 1}`;
                this.report(args[i], `Invalid argument ${i + 1} (${paramName}) for '${expr.callee.name}': expected '${expectedType}', got '${actualType}'`, 1);
            }
        }
    }

    /**
     * Validate an argument passed to a `ref` parameter: it must be a writable
     * variable, so neither an arbitrary expression nor a label (constant) is
     * allowed. Returns true if a problem was reported, so the caller can skip
     * the ordinary type check for this argument.
     */
    private checkRefArgument(expr: A.CallExpr, signature: FunctionSignature, index: number): boolean {
        const arg = this.callResolver.arguments(expr)[index];
        const paramName = signature.paramNames[index] ?? `argument ${index + 1}`;
        if (!this.isWritableRefArgument(arg)) {
            this.report(arg, `Invalid argument ${index + 1} (${paramName}) for '${expr.callee.name}': ref parameters require a writable variable or field`, 1);
            return true;
        }
        if (arg.kind === 'Ident' && this.labelNames.has(arg.name.toLowerCase())) {
            this.report(arg, `Invalid argument ${index + 1} (${paramName}) for '${expr.callee.name}': labels are constants and cannot be passed as ref parameters`, 1);
            return true;
        }
        return false;
    }

    protected isWritableRefArgument(arg: A.Expr): boolean {
        if (arg.kind === 'Paren') {
            return this.isWritableRefArgument(arg.expr);
        }
        if (arg.kind === 'Ident') {
            return !this.labelNames.has(arg.name.toLowerCase());
        }
        if (arg.kind !== 'Member') {
            return false;
        }
        return this.isWritableMemberTarget(arg);
    }

    private checkTriggerControlCall(expr: A.CallExpr): void {
        const callee = expr.callee.name.toLowerCase();
        if (!TRIGGER_STRING_REFERENCE_FUNCTIONS.has(callee) || expr.args.length !== 1) {
            return;
        }

        const arg = expr.args[0];
        let triggerName: string | undefined;
        if (arg.kind === 'String') {
            triggerName = this.unquoteStringLiteral(arg.value);
        } else if (arg.kind === 'Ident') {
            if (!TRIGGER_CONTROL_FUNCTIONS.has(callee)) {
                this.report(arg, `Invalid trigger reference for '${expr.callee.name}': expected a trigger name as a string literal`, 1);
                return;
            }
            triggerName = arg.name;
        } else {
            const expected = TRIGGER_CONTROL_FUNCTIONS.has(callee)
                ? 'a trigger name as a string literal or bare identifier'
                : 'a trigger name as a string literal';
            this.report(arg, `Invalid trigger reference for '${expr.callee.name}': expected ${expected}`, 1);
            return;
        }

        if (!this.currentTriggerNames.has(triggerName.toLowerCase())) {
            const hint = suggestSimilar(triggerName, this.currentTriggerDisplayNames);
            this.report(arg, `Cannot find trigger '${triggerName}'.` + (hint ? ` Did you mean '${hint}'?` : ''), 1);
        }
    }

    private isTriggerControlReferenceArg(expr: A.CallExpr, index: number): boolean {
        return !expr.receiver && index === 0 && TRIGGER_STRING_REFERENCE_FUNCTIONS.has(expr.callee.name.toLowerCase());
    }

    private unquoteStringLiteral(value: string): string {
        if (value.length >= 2 && value[0] === '"' && value[value.length - 1] === '"') {
            return value.slice(1, -1);
        }
        return value;
    }

    /**
     * Label values must be a constant literal. The compiler rejects parenthesized
     * expressions, arithmetic, function calls, and variable references — the
     * manual claims constant expressions like (2 ^ 3) are allowed, but in-game
     * testing shows the compiler does not accept them. Signed numbers are unary
     * expressions in this grammar and are rejected as well.
     */
    protected isConstantLabelValue(expr: A.Expr): boolean {
        if (expr.kind === 'Number' || expr.kind === 'String' || expr.kind === 'Char' || expr.kind === 'Bool') {
            return true;
        }
        return false;
    }

    // --- type inference (only as precise as needed for the float rule) ------

    protected inferType(expr: A.Expr): PrimitiveType {
        const cached = this.typeCache.get(expr);
        if (cached !== undefined) { return cached; }
        const result = this.toPrimitiveType(this.computeTypeName(expr)) ?? 'anytype';
        this.typeCache.set(expr, result);
        return result;
    }

    protected expressionTypeName(expr: A.Expr): TypeName {
        return this.computeTypeName(expr);
    }

    private computeTypeName(expr: A.Expr): TypeName {
        switch (expr.kind) {
            case 'Number': return expr.isFloat ? 'float' : 'int';
            case 'String': return 'string';
            case 'Char': return 'int';            // character literals are integers
            // The keywords true/false are integer-backed constants (1/0).
            // Boolean-producing operators such as !, comparisons, &, and |
            // still return the distinct bool type.
            case 'Bool': return 'int';
            case 'Ident': return this.lookupType(canonicalIdentifier(expr.name)) ?? 'anytype';
            case 'Member': return this.memberType(expr) ?? 'anytype';
            case 'Index': {
                const receiverType = this.expressionTypeName(expr.receiver);
                return isArrayType(receiverType) ? elementType(receiverType) : 'anytype';
            }
            case 'Call': {
                const intrinsicType = intrinsicReturnType(expr.callee.name);
                if (intrinsicType) { return intrinsicType; }
                if (this.hasCallNameCollision(expr.callee.name)) {
                    return 'void';
                }
                const signatures = this.callSignatures(expr.callee.name);
                if (!signatures.length) { return 'anytype'; }
                const resolution = this.callResolver.resolve(expr, signatures);
                return resolution.bestMatches.length === 1
                    ? resolution.bestMatches[0].returnType
                    : 'void';
            }
            case 'Paren': return this.expressionTypeName(expr.expr);
            case 'Cast': return expr.castType || 'anytype';
            case 'Unary': return unaryExpressionType(expr.op, this.inferType(expr.operand));
            case 'Binary':
                return binaryExpressionType(
                    expr.op,
                    this.inferType(expr.left),
                    this.inferType(expr.right)
                );
            // BHS takes a ternary expression's static type from the operand
            // after ':', even when the true branch has a different type.
            case 'Ternary': return this.expressionTypeName(expr.whenFalse);
            default: return 'anytype';
        }
    }
}
