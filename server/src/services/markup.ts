import { MarkupContent, MarkupKind } from 'vscode-languageserver/node';
import { FunctionSignature, TypedSymbol } from '../core/types';
import { elementType } from '../core/semantic/typeRelations';

export interface SignatureDisplayData {
    name: string;
    paramNames: string[];
    paramTypes: string[];
    paramQualifiers?: Array<string | undefined>;
    paramDescriptions?: string[];
    returnType: string;
    scriptType?: string;
    description?: string;
    notes?: string;
    returnDescription?: string;
}

export function formatFunctionParameter(signature: SignatureDisplayData, index: number): string {
    const qualifier = signature.paramQualifiers?.[index];
    const prefix = qualifier ? `${qualifier} ` : '';
    return `${signature.paramNames[index]}: ${prefix}${signature.paramTypes[index]}`;
}

export function formatFunctionSignature(
    signature: SignatureDisplayData,
    displayName = signature.name
): string {
    const params = signature.paramNames.map((_, i) => formatFunctionParameter(signature, i)).join(', ');
    if (signature.scriptType) {
        return `${signature.returnType} ${signature.scriptType} ${displayName}(${params})`;
    }
    return `${displayName}(${params}): ${signature.returnType}`;
}

export function formatBhsDeclaration(
    signature: SignatureDisplayData,
    displayName = signature.name
): string {
    const params = signature.paramNames.map((name, i) => {
        const qualifier = signature.paramQualifiers?.[i];
        const prefix = qualifier ? `${qualifier} ` : '';
        return `${prefix}${signature.paramTypes[i]} ${name}`;
    }).join(', ');

    if (signature.scriptType) {
        return `${signature.returnType} ${signature.scriptType} ${displayName}(${params})`;
    }
    return `${signature.returnType} ${displayName}(${params})`;
}

export function functionCompletionDocumentation(
    signature: SignatureDisplayData,
    overloadsOrFullSignature?: FunctionSignature | readonly FunctionSignature[]
): MarkupContent {
    const overloads = Array.isArray(overloadsOrFullSignature) ? overloadsOrFullSignature : undefined;
    const source = overloads ? (overloads[0] ?? signature) : (overloadsOrFullSignature ?? signature);
    const parts: string[] = [];

    if (overloads && overloads.length > 1) {
        parts.push(formatOverloadList(overloads, signature.name));
    }
    if (source.description) { parts.push(source.description); }
    if (signature.paramNames.length) {
        parts.push(signature.paramNames.map((_, i) =>
            `@param \`${formatFunctionParameter(signature, i)}\``).join('\n\n'));
    }
    parts.push(returnDocumentation(signature, source));
    if (source.notes) { parts.push(`*Note:* ${source.notes}`); }

    return markdown(parts);
}

export function overloadedFunctionHoverDocumentation(
    signatures: readonly SignatureDisplayData[],
    displayName: string
): MarkupContent {
    if (signatures.length <= 1) {
        return functionHoverDocumentation(signatures[0], displayName);
    }

    const first = signatures[0];
    const lines = [
        `**${displayName}**`,
        '```bhs',
        ...signatures.map(signature => formatBhsDeclaration(signature, displayName)),
        '```'
    ];
    if (first.description) { lines.push('', first.description); }
    if (first.notes) { lines.push('', `*Note:* ${first.notes}`); }

    return markdown([lines.join('\n')]);
}

export function functionHoverDocumentation(signature: SignatureDisplayData, displayName: string): MarkupContent {
    const paramDocs = signature.paramNames.map((name, i) => {
        const qualifier = signature.paramQualifiers?.[i];
        const type = `${qualifier ? `${qualifier} ` : ''}${signature.paramTypes[i]}`;
        const description = signature.paramDescriptions?.[i] || '';
        return `@param \`${name}\` *(${type})* ${description}`;
    }).join('\n\n');

    const lines: string[] = [
        `**${displayName}**`,
        '```bhs',
        formatBhsDeclaration(signature, displayName),
        '```'
    ];
    if (signature.description) { lines.push('', signature.description); }
    if (paramDocs) { lines.push('', paramDocs); }
    lines.push('', returnDocumentation(signature));
    if (signature.notes) { lines.push('', `*Note:* ${signature.notes}`); }

    return markdown([lines.join('\n')]);
}

function formatOverloadList(signatures: readonly SignatureDisplayData[], displayName: string): string {
    return [
        '**Overloads**',
        '```bhs',
        ...signatures.map(signature => formatBhsDeclaration(signature, displayName)),
        '```'
    ].join('\n');
}

export function symbolHoverDocumentation(symbol: TypedSymbol): MarkupContent {
    const valueSuffix = symbol.value !== undefined ? ` = ${symbol.value}` : '';
    const declaration = symbol.kind === 'struct'
        ? `struct ${symbol.name}`
        : symbol.kind === 'field'
            ? `${symbol.name}: ${symbol.type}`
            : `${symbol.name}: ${symbol.type}${valueSuffix}`;
    const lines = [
        `**${symbol.name}** *(${symbol.kind})*`,
        '```bhs',
        declaration,
        '```'
    ];
    if (symbol.value !== undefined && symbol.kind === 'variable') {
        lines.push('', '*initial value \u2014 may change at runtime*');
    }
    if (symbol.description) { lines.push('', symbol.description); }
    return markdown([lines.join('\n')]);
}

export function fieldHoverDocumentation(fieldName: string, fieldType: string, structType: string): MarkupContent {
    return markdown([[
        `**${fieldName}** *(field)*`,
        '```bhs',
        `${fieldName}: ${fieldType}`,
        '```',
        '',
        `Field of \`${elementType(structType)}\`.`
    ].join('\n')]);
}

export function symbolCompletionDocumentation(kind: string, type?: string): MarkupContent {
    if (kind === 'variable' || kind === 'parameter') {
        return markdown([`${kind} of type \`${type}\``]);
    }
    if (kind === 'struct') {
        return markdown(['Struct type']);
    }
    if (kind === 'field') {
        return markdown([`Struct field of type \`${type}\``]);
    }
    return markdown([kind === 'label' ? 'Game constant or user-defined label' : 'Trigger block']);
}

function returnDocumentation(
    signature: Pick<SignatureDisplayData, 'returnType'>,
    source?: Pick<SignatureDisplayData, 'returnDescription'>
): string {
    return source?.returnDescription
        ? `@returns \`${signature.returnType}\` \u2014 ${source.returnDescription}`
        : `@returns \`${signature.returnType}\``;
}

function markdown(parts: string[]): MarkupContent {
    return {
        kind: MarkupKind.Markdown,
        value: parts.join('\n\n')
    };
}
