import * as A from '../core/ast/ast';
import {
    FunctionSignature,
    FunctionSignatureMap,
    getFunctionOverloads,
    isFunctionSignatureVisibleAt,
    isVariadicFunctionSignature,
    PrimitiveType
} from '../core/types';
import { canonicalIdentifier } from '../core/languageFacts';
import { CallResolver } from '../core/semantic/callResolution';
import { baseType, canonicalType, elementType, isArrayType } from '../core/semantic/typeRelations';

export function selectFunctionHoverSignatures(
    program: A.Program,
    signatures: FunctionSignatureMap,
    name: string,
    offset: number,
    lookupIdentifierType?: (name: string, position: number) => string | undefined
): FunctionSignature[] {
    const visible = getFunctionOverloads(signatures, name)
        .filter(signature => isFunctionSignatureVisibleAt(signature, offset));
    const declaration = program.items.find((item): item is A.ScriptDecl =>
        item.kind === 'Script' &&
        !!item.name &&
        item.name.start <= offset && offset <= item.name.end);

    if (declaration) {
        return visible.filter(signature => matchesDeclaration(signature, declaration));
    }

    const enclosingScript = program.items.find((item): item is A.ScriptDecl =>
        item.kind === 'Script' &&
        !!item.body &&
        item.body.start <= offset && offset <= item.body.end);
    if (!enclosingScript) {
        return visible;
    }

    const category = canonicalIdentifier(enclosingScript.scriptType);
    const categorySignatures = visible.filter(signature =>
        !signature.scriptType || signature.scriptType === category);
    const call = findCallAtOffset(program, offset);
    return call
        ? resolveCallSignatures(categorySignatures, call, lookupIdentifierType)
        : categorySignatures;
}

function matchesDeclaration(signature: FunctionSignature, declaration: A.ScriptDecl): boolean {
    const returnType = declaration.returnType
        ? canonicalIdentifier(declaration.returnType)
        : 'anytype';
    return signature.scriptType === canonicalIdentifier(declaration.scriptType) &&
        canonicalIdentifier(signature.returnType) === returnType &&
        signature.paramTypes.length === declaration.params.length &&
        declaration.params.every((param, index) =>
            canonicalIdentifier(signature.paramTypes[index] ?? '') ===
                (param.paramType ? canonicalIdentifier(param.paramType) : 'int') &&
            canonicalIdentifier(signature.paramNames[index] ?? '') ===
                canonicalIdentifier(param.name.name) &&
            signature.paramQualifiers?.[index] === (param.isRef ? 'ref' : param.qualifier)
        );
}

function findCallAtOffset(value: unknown, offset: number): A.CallExpr | undefined {
    if (Array.isArray(value)) {
        for (const child of value) {
            const match = findCallAtOffset(child, offset);
            if (match) { return match; }
        }
        return undefined;
    }
    if (!value || typeof value !== 'object') {
        return undefined;
    }

    const node = value as Partial<A.CallExpr> & Record<string, unknown>;
    if (node.kind === 'Call' && node.callee &&
        node.callee.start <= offset && offset <= node.callee.end) {
        return node as A.CallExpr;
    }
    for (const child of Object.values(node)) {
        const match = findCallAtOffset(child, offset);
        if (match) { return match; }
    }
    return undefined;
}

function resolveCallSignatures(
    signatures: FunctionSignature[],
    call: A.CallExpr,
    lookupIdentifierType?: (name: string, position: number) => string | undefined
): FunctionSignature[] {
    if (signatures.some(isVariadicFunctionSignature)) {
        return signatures;
    }
    const args = call.receiver ? [call.receiver, ...call.args] : call.args;
    const actualTypes = args.map(arg => staticExpressionType(arg, lookupIdentifierType));
    if (actualTypes.some(type => !type)) {
        return signatures;
    }
    const resolver = new CallResolver({
        expressionType: expression => staticExpressionType(expression, lookupIdentifierType) ?? 'anytype',
        primitiveType: expression =>
            primitiveType(staticExpressionType(expression, lookupIdentifierType)) ?? 'anytype',
        normalizePrimitive: primitiveType,
        baseType,
        isWritableReference: isWritable
    });
    const resolution = resolver.resolve(call, signatures);
    return resolution.bestMatches.length ? resolution.bestMatches : signatures;
}

function staticExpressionType(
    expression: A.Expr,
    lookupIdentifierType?: (name: string, position: number) => string | undefined
): string | undefined {
    switch (expression.kind) {
        case 'Number': return expression.isFloat ? 'float' : 'int';
        case 'String': return 'string';
        case 'Char': return 'int';
        case 'Bool': return 'int';
        case 'Ident': {
            const type = lookupIdentifierType?.(expression.name, expression.start);
            return type ? canonicalIdentifier(type) : undefined;
        }
        case 'Cast': return canonicalIdentifier(expression.castType);
        case 'Paren': return staticExpressionType(expression.expr, lookupIdentifierType);
        case 'Unary':
            return expression.op === '!'
                ? 'bool'
                : staticExpressionType(expression.operand, lookupIdentifierType);
        case 'Index': {
            const receiverType = staticExpressionType(expression.receiver, lookupIdentifierType);
            return receiverType && isArrayType(receiverType) ? elementType(receiverType) : undefined;
        }
        default: return undefined;
    }
}

function primitiveType(type: string | undefined): PrimitiveType | undefined {
    if (!type) { return undefined; }
    switch (canonicalType(type)) {
        case 'int':
        case 'float':
        case 'string':
        case 'bool':
        case 'void':
        case 'anytype':
            return canonicalType(type) as PrimitiveType;
        default:
            return undefined;
    }
}

function isWritable(expression: A.Expr): boolean {
    if (expression.kind === 'Paren') {
        return isWritable(expression.expr);
    }
    if (expression.kind === 'Ident') {
        return true;
    }
    return expression.kind === 'Member' && isVariablePath(expression.receiver);
}

function isVariablePath(expression: A.Expr): boolean {
    switch (expression.kind) {
        case 'Ident':
            return true;
        case 'Paren':
            return isVariablePath(expression.expr);
        case 'Member':
        case 'Index':
            return isVariablePath(expression.receiver);
        default:
            return false;
    }
}
