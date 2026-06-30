import type { PrimitiveType, ScopeType } from './types';

/**
 * Canonical language vocabulary and primitive semantic relations for BHS.
 *
 * BHS identifiers are case-insensitive, but keyword reservation is mixed:
 * datatype and several control names are reserved case-insensitively, while
 * another group is reserved only in its lowercase keyword spelling.
 */

export const canonicalIdentifier = (name: string): string => name.toLowerCase();

export const TYPE_KEYWORDS: ReadonlySet<string> = new Set([
    'int', 'float', 'string', 'bool', 'void', 'anytype'
]);

export const VALUE_TYPE_KEYWORDS: ReadonlySet<string> = new Set([
    'int', 'float', 'string', 'bool', 'anytype'
]);

export const RETURN_TYPE_KEYWORDS: ReadonlySet<string> = new Set([
    ...VALUE_TYPE_KEYWORDS,
    'void'
]);

export const SCRIPT_TYPES: ReadonlySet<ScopeType> = new Set([
    'scenario', 'conquest', 'ai'
]);

export const QUALIFIERS: ReadonlySet<string> = new Set(['static', 'local']);

export const STATEMENT_KEYWORDS: ReadonlySet<string> = new Set([
    'if', 'while', 'for', 'do', 'switch', 'return', 'break', 'continue',
    'trigger', 'run_once', 'labels', 'include', 'struct', 'else', 'case', 'default'
]);

/**
 * Context-independent reserved names accepted by the game-facing analyzer.
 * `struct` and `anytype` intentionally remain contextual: the compiler accepts
 * them as names in some positions (for example, a struct named `anytype`).
 */
export const RESERVED_IDENTIFIERS: ReadonlySet<string> = new Set([
    'int', 'float', 'string', 'bool', 'void',
    ...SCRIPT_TYPES,
    'for', 'while', 'do', 'switch', 'case'
]);

export const CASE_SENSITIVE_RESERVED_IDENTIFIERS: ReadonlySet<string> = new Set([
    'struct', 'static', 'ref',
    'if', 'else', 'default', 'break', 'continue', 'return',
    'trigger', 'run_once', 'labels',
    'true', 'false'
]);

export const isReservedIdentifier = (name: string): boolean => {
    return RESERVED_IDENTIFIERS.has(canonicalIdentifier(name)) ||
        CASE_SENSITIVE_RESERVED_IDENTIFIERS.has(name);
};

export const NUMERIC_TYPES: ReadonlySet<PrimitiveType> = new Set(['int', 'float']);

export const BOOLEAN_RESULT_OPERATORS: ReadonlySet<string> = new Set([
    '==', '!=', '<', '<=', '>', '>=', '&&', '||', '&', '|'
]);

export const COMPARISON_OPERATORS: ReadonlySet<string> = new Set([
    '==', '!=', '<', '<=', '>', '>='
]);

export const ORDERING_OPERATORS: ReadonlySet<string> = new Set([
    '<', '<=', '>', '>='
]);

export const ARITHMETIC_OPERATORS: ReadonlySet<string> = new Set([
    '+', '-', '*', '/', '%', '^'
]);

export const NON_ADDITIVE_ARITHMETIC_OPERATORS: ReadonlySet<string> = new Set([
    '-', '*', '/', '^'
]);

export const SHIFT_OPERATORS: ReadonlySet<string> = new Set(['<<', '>>']);

/** Primitive conversions performed by the BHS compiler without an explicit cast. */
export function isImplicitPrimitiveConversion(source: string, target: string): boolean {
    const src = canonicalIdentifier(source);
    const dst = canonicalIdentifier(target);

    if (src === dst || src === 'anytype' || dst === 'anytype') {
        return true;
    }
    if (src === 'int' && (dst === 'float' || dst === 'bool')) {
        return true;
    }
    return dst === 'string' && src !== 'void' && src !== 'bool';
}
