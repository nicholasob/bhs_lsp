import * as A from '../ast/ast';
import { PrimitiveType } from '../types';

export interface ResolvedLabel {
    type: PrimitiveType;
    caseKey?: string;
    displayValue?: string;
}

/** Render a simple literal initializer or label value as source text. */
export function literalText(expr: A.Expr | undefined): string | undefined {
    if (!expr) { return undefined; }
    switch (expr.kind) {
        case 'Number': return expr.value;
        case 'String': return expr.value;
        case 'Char': return expr.value;
        case 'Bool': return expr.value ? 'true' : 'false';
        case 'Unary':
            if ((expr.op === '-' || expr.op === '+') && expr.operand.kind === 'Number') {
                return expr.op + expr.operand.value;
            }
            return undefined;
        default:
            return undefined;
    }
}

export function switchCaseKey(
    expr: A.Expr,
    labelCaseKeys: ReadonlyMap<string, string>
): string | undefined {
    switch (expr.kind) {
        case 'Number': return `${expr.isFloat ? 'float' : 'int'}:${normalizedNumber(expr.value)}`;
        case 'String': return `string:${expr.value}`;
        case 'Char': return `int:${characterCode(expr.value)}`;
        case 'Bool': return `int:${expr.value ? 1 : 0}`;
        case 'Ident':
            return labelCaseKeys.get(expr.name.toLowerCase()) ?? `ident:${expr.name.toLowerCase()}`;
        default:
            return undefined;
    }
}

export function resolveLabels(
    stmt: A.LabelsBlock,
    inferType: (expr: A.Expr) => PrimitiveType,
    labelCaseKeys: ReadonlyMap<string, string>
): ResolvedLabel[] {
    let nextImplicitNumber: { value: number; type: 'int' | 'float' } | undefined;
    return stmt.entries.map(entry => {
        if (!entry.value) {
            if (!nextImplicitNumber) {
                return { type: 'int' };
            }
            const { value, type } = nextImplicitNumber;
            nextImplicitNumber = { value: value + 1, type };
            return { type, caseKey: `${type}:${value}`, displayValue: String(value) };
        }

        const type = inferType(entry.value);
        const caseKey = switchCaseKey(entry.value, labelCaseKeys);
        const displayValue = literalText(entry.value);
        if (entry.value.kind === 'Number') {
            const value = Number(entry.value.value);
            nextImplicitNumber = Number.isFinite(value)
                ? { value: value + 1, type: entry.value.isFloat ? 'float' : 'int' }
                : undefined;
        } else if (entry.value.kind === 'Bool') {
            nextImplicitNumber = { value: (entry.value.value ? 1 : 0) + 1, type: 'int' };
        } else if (entry.value.kind === 'Char') {
            nextImplicitNumber = { value: characterCode(entry.value.value) + 1, type: 'int' };
        } else {
            nextImplicitNumber = undefined;
        }
        return { type, caseKey, displayValue };
    });
}

export function caseDisplayText(
    expr: A.Expr,
    labelCaseKeys: ReadonlyMap<string, string>
): string {
    if (expr.kind === 'Number') { return normalizedNumber(expr.value); }
    if (expr.kind === 'Ident') {
        return labelCaseKeys.get(expr.name.toLowerCase())?.split(':').slice(1).join(':') ?? expr.name;
    }
    return literalText(expr) ?? 'case';
}

function normalizedNumber(value: string): string {
    const number = Number(value);
    return Number.isFinite(number) ? String(number) : value;
}

function characterCode(value: string): number {
    const content = value.slice(1, -1);
    if (!content.startsWith('\\')) {
        return content.codePointAt(0) ?? 0;
    }
    const escaped = content.slice(1);
    const escapeCodes: Record<string, number> = {
        t: 9,
        n: 10,
        v: 11,
        f: 12,
        r: 13,
        '"': 34,
        "'": 39,
        '\\': 92
    };
    return escapeCodes[escaped] ?? escaped.codePointAt(0) ?? 0;
}
