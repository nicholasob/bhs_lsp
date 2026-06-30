import { PrimitiveType } from '../types';
import { BOOLEAN_RESULT_OPERATORS, NUMERIC_TYPES } from '../languageFacts';

export function unaryExpressionType(operator: string, operandType: PrimitiveType): string {
    return operator === '!' ? 'bool' : operandType;
}

/** Infer the result type after operator validity has been checked separately. */
export function binaryExpressionType(
    operator: string,
    leftType: PrimitiveType,
    rightType: PrimitiveType
): string {
    if (BOOLEAN_RESULT_OPERATORS.has(operator)) { return 'bool'; }
    if (operator === '?') { return 'anytype'; }
    if (operator === '+' && (leftType === 'string' || rightType === 'string')) {
        return 'string';
    }
    if (leftType === 'float' || rightType === 'float') { return 'float'; }
    if (NUMERIC_TYPES.has(leftType) && NUMERIC_TYPES.has(rightType)) { return 'int'; }
    return 'anytype';
}
