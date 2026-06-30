import { PrimitiveType } from '../types';
import {
    ARITHMETIC_OPERATORS,
    COMPARISON_OPERATORS,
    NON_ADDITIVE_ARITHMETIC_OPERATORS,
    ORDERING_OPERATORS,
    SHIFT_OPERATORS
} from '../languageFacts';

export interface BinaryOperandInfo {
    primitive: PrimitiveType;
    type: string;
    isAggregate: boolean;
    isAggregateOrVoid: boolean;
}

export interface OperatorIssue {
    target: 'left' | 'expression';
    message: string;
}

const STRING_OPERATORS = new Set([
    '+', '<<', '>>', '&', '|', '==', '!=', '<', '<=', '>', '>=', '&&', '||'
]);

/** Return the first BHS binary-operator violation, preserving compiler priority. */
export function binaryOperatorIssue(
    operator: string,
    left: BinaryOperandInfo,
    right: BinaryOperandInfo,
    aggregateEqualityMatches: boolean
): OperatorIssue | undefined {
    const boolFloatPair =
        (left.primitive === 'bool' && right.primitive === 'float') ||
        (left.primitive === 'float' && right.primitive === 'bool');
    const boolStringPair =
        (left.primitive === 'bool' && right.primitive === 'string') ||
        (left.primitive === 'string' && right.primitive === 'bool');
    const comparesAggregate = left.isAggregate || right.isAggregate;

    if (SHIFT_OPERATORS.has(operator) && left.primitive === 'void') {
        return {
            target: 'left',
            message: `Operator '${operator}' cannot use a void value as its left operand`
        };
    }
    if ((operator === '==' || operator === '!=') && comparesAggregate &&
        left.type !== 'anytype' && right.type !== 'anytype' && !aggregateEqualityMatches) {
        return {
            target: 'expression',
            message: `Operator '${operator}' requires matching aggregate operand types ('${left.type}' and '${right.type}')`
        };
    }
    if (ORDERING_OPERATORS.has(operator) && comparesAggregate) {
        return {
            target: 'expression',
            message: `Operator '${operator}' is not valid for aggregate operands ('${left.type}' and '${right.type}')`
        };
    }
    if (ARITHMETIC_OPERATORS.has(operator) &&
        (left.isAggregateOrVoid || right.isAggregateOrVoid)) {
        return {
            target: 'expression',
            message: `Operator '${operator}' is not valid for aggregate or void operands ('${left.type}' and '${right.type}')`
        };
    }
    if ((COMPARISON_OPERATORS.has(operator) && (boolFloatPair || boolStringPair)) ||
        (NON_ADDITIVE_ARITHMETIC_OPERATORS.has(operator) && boolFloatPair) ||
        (operator === '+' && (boolFloatPair || boolStringPair))) {
        return {
            target: 'expression',
            message: `Operator '${operator}' cannot combine values of type '${left.primitive}' and '${right.primitive}'. An explicit cast is required`
        };
    }
    if (operator === '%' && (left.primitive === 'float' || right.primitive === 'float')) {
        return { target: 'expression', message: `Operator '%' is not valid for float values` };
    }
    if ((left.primitive === 'string' || right.primitive === 'string') &&
        !STRING_OPERATORS.has(operator)) {
        return {
            target: 'expression',
            message: `Operator '${operator}' is not valid for string values`
        };
    }
    return undefined;
}
