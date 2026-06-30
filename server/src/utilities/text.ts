const IDENTIFIER_CHAR = /\w/;

export interface IdentifierRange {
    text: string;
    start: number;
    end: number;
}

export function identifierAtOffset(text: string, offset: number): string | undefined {
    return identifierRangeAtOffset(text, offset)?.text;
}

export function identifierRangeAtOffset(text: string, offset: number): IdentifierRange | undefined {
    let start = offset;
    let end = offset;

    while (start > 0 && IDENTIFIER_CHAR.test(text[start - 1])) { start--; }
    while (end < text.length && IDENTIFIER_CHAR.test(text[end])) { end++; }

    return start === end ? undefined : { text: text.slice(start, end), start, end };
}

export function previousNonWhitespaceIndex(text: string, start: number): number {
    let index = start;
    while (index >= 0 && /\s/.test(text[index])) { index--; }
    return index;
}

export function identifierBefore(text: string, endBefore: number): IdentifierRange | undefined {
    const end = previousNonWhitespaceIndex(text, endBefore - 1) + 1;
    let start = end;
    while (start > 0 && IDENTIFIER_CHAR.test(text[start - 1])) { start--; }
    return start === end
        ? undefined
        : { text: text.slice(start, end), start, end };
}
