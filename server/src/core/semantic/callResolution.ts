import * as A from '../ast/ast';
import { FunctionSignature, isVariadicFunctionSignature, PrimitiveType } from '../types';
import { isImplicitPrimitiveConversion } from '../languageFacts';
import { canonicalType, isArrayType, sameType } from './typeRelations';

export interface CallResolutionContext {
    expressionType(expr: A.Expr): string;
    primitiveType(expr: A.Expr): PrimitiveType;
    normalizePrimitive(type: string | undefined): PrimitiveType | undefined;
    baseType(type: string | undefined): string | undefined;
    isWritableReference(expr: A.Expr): boolean;
}

export interface CallResolution {
    args: A.Expr[];
    arityMatches: FunctionSignature[];
    compatible: FunctionSignature[];
    bestMatches: FunctionSignature[];
}

/** Stateless BHS call compatibility and overload ranking. */
export class CallResolver {
    constructor(private readonly context: CallResolutionContext) {}

    resolve(expr: A.CallExpr, signatures: readonly FunctionSignature[]): CallResolution {
        const args = this.arguments(expr);
        const arityMatches = this.candidates(expr, signatures, args.length);
        const compatible = arityMatches.filter(signature => this.isCompatible(signature, args));
        return {
            args,
            arityMatches,
            compatible,
            bestMatches: this.bestMatches(compatible, args)
        };
    }

    arguments(expr: A.CallExpr): A.Expr[] {
        return expr.receiver ? [expr.receiver, ...expr.args] : expr.args;
    }

    isExactCall(signature: FunctionSignature, args: readonly A.Expr[]): boolean {
        return args.every((arg, index) => {
            const paramIndex = Math.min(index, signature.paramTypes.length - 1);
            return this.isExactArgument(arg, signature.paramTypes[paramIndex]);
        });
    }

    isArgumentCompatible(arg: A.Expr, expectedType: string): boolean {
        const actualType = this.context.expressionType(arg);
        if (isArrayType(expectedType)) {
            return actualType === 'anytype' || sameType(actualType, expectedType);
        }
        if (isArrayType(actualType)) {
            return false;
        }
        const primitiveExpected = this.context.normalizePrimitive(expectedType);
        if (primitiveExpected) {
            const actualPrimitive = this.context.primitiveType(arg);
            if (primitiveExpected === 'string') {
                return actualPrimitive !== 'void' && actualPrimitive !== 'bool';
            }
            return isImplicitPrimitiveConversion(actualPrimitive, primitiveExpected);
        }
        return this.context.baseType(actualType) === canonicalType(expectedType);
    }

    isWildcardParameter(signature: FunctionSignature, index: number): boolean {
        return signature.paramTypes[index] === 'anytype' && !signature.scriptType;
    }

    describeAcceptedArities(signatures: readonly FunctionSignature[]): string {
        return signatures
            .map(signature => isVariadicFunctionSignature(signature)
                ? `at least ${Math.max(signature.paramTypes.length - 1, 0)}`
                : String(signature.paramTypes.length))
            .filter((value, index, all) => all.indexOf(value) === index)
            .join(' or ');
    }

    formatSignature(signature: FunctionSignature): string {
        const params = signature.paramNames.map((name, index) => {
            const qualifier = signature.paramQualifiers?.[index];
            const prefix = qualifier ? `${qualifier} ` : '';
            return `${prefix}${signature.paramTypes[index]} ${name}`;
        }).join(', ');
        return `${signature.name}(${params})`;
    }

    private candidates(
        expr: A.CallExpr,
        signatures: readonly FunctionSignature[],
        argumentCount: number
    ): FunctionSignature[] {
        const arityMatches = signatures.filter(signature => this.acceptsArity(signature, argumentCount));
        if (!expr.receiver) {
            return arityMatches;
        }
        return arityMatches.filter(signature => this.isReceiverCompatible(expr.receiver!, signature));
    }

    private isReceiverCompatible(receiver: A.Expr, signature: FunctionSignature): boolean {
        const expectedType = signature.paramTypes[0];
        if (!expectedType || this.isWildcardParameter(signature, 0)) {
            return false;
        }
        const receiverType = this.context.expressionType(receiver);
        if (isArrayType(receiverType) || isArrayType(expectedType)) {
            return sameType(receiverType, expectedType);
        }
        const primitiveExpected = this.context.normalizePrimitive(expectedType);
        if (primitiveExpected) {
            return this.context.normalizePrimitive(receiverType) === primitiveExpected;
        }
        return this.context.baseType(receiverType) === canonicalType(expectedType);
    }

    private acceptsArity(signature: FunctionSignature, argumentCount: number): boolean {
        if (!isVariadicFunctionSignature(signature)) {
            return argumentCount === signature.paramTypes.length;
        }
        return argumentCount >= Math.max(signature.paramTypes.length - 1, 0);
    }

    private isCompatible(signature: FunctionSignature, args: readonly A.Expr[]): boolean {
        for (let index = 0; index < args.length; index++) {
            if (signature.paramQualifiers?.[index] === 'ref' &&
                !this.context.isWritableReference(args[index])) {
                return false;
            }
            const paramIndex = Math.min(index, signature.paramTypes.length - 1);
            const expectedType = signature.paramTypes[paramIndex];
            if (this.isWildcardParameter(signature, paramIndex)) { continue; }
            if (signature.paramQualifiers?.[index] === 'ref' &&
                !this.isExactArgument(args[index], expectedType)) {
                return false;
            }
            if (!this.isArgumentCompatible(args[index], expectedType)) {
                return false;
            }
        }
        return true;
    }

    /** BHS ranks by implicit-cast count, without ranking conversion kinds. */
    private bestMatches(
        signatures: readonly FunctionSignature[],
        args: readonly A.Expr[]
    ): FunctionSignature[] {
        let bestCost = Number.POSITIVE_INFINITY;
        const best: FunctionSignature[] = [];
        for (const signature of signatures) {
            const cost = args.reduce((total, arg, index) => {
                const expected = signature.paramTypes[Math.min(index, signature.paramTypes.length - 1)];
                return total + (this.isExactArgument(arg, expected) ? 0 : 1);
            }, 0);
            if (cost < bestCost) {
                bestCost = cost;
                best.length = 0;
                best.push(signature);
            } else if (cost === bestCost) {
                best.push(signature);
            }
        }
        return best;
    }

    private isExactArgument(arg: A.Expr, expectedType: string): boolean {
        const actualType = this.context.expressionType(arg);
        // Integer values are also exact bool matches in BHS overload resolution.
        if (this.context.normalizePrimitive(actualType) === 'int' && expectedType === 'bool') {
            return true;
        }
        if (isArrayType(actualType) || isArrayType(expectedType)) {
            return sameType(actualType, expectedType);
        }
        const primitiveExpected = this.context.normalizePrimitive(expectedType);
        if (primitiveExpected) {
            return this.context.normalizePrimitive(actualType) === primitiveExpected;
        }
        return this.context.baseType(actualType) === canonicalType(expectedType);
    }

}
