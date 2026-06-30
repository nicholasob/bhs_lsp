/** Legacy/source-facing encoding, for example `int[][]` or `UnitGroup[]`. */
export type TypeName = string;
export type StructTypeTable = ReadonlyMap<string, Map<string, TypeName>>;

export interface TypeRef {
    /** Source-facing base name; custom struct casing is preserved. */
    base: string;
    /** Number of trailing [] dimensions. Scalars have rank zero. */
    rank: number;
}

/** Parse the source-facing type encoding without canonicalizing custom casing. */
export function parseTypeRef(type: TypeName): TypeRef {
    let end = type.length;
    let rank = 0;
    while (end >= 2 && type.slice(end - 2, end) === '[]') {
        rank++;
        end -= 2;
    }
    return { base: type.slice(0, end), rank };
}

export function formatTypeRef(type: TypeRef): TypeName {
    return type.base + '[]'.repeat(type.rank);
}

/** Type identity is case-insensitive but always includes array rank. */
export function sameType(left: TypeName, right: TypeName): boolean {
    const leftRef = parseTypeRef(left);
    const rightRef = parseTypeRef(right);
    return leftRef.rank === rightRef.rank &&
        leftRef.base.toLowerCase() === rightRef.base.toLowerCase();
}

export function canonicalType(type: TypeName): TypeName {
    const parsed = parseTypeRef(type);
    return formatTypeRef({ base: parsed.base.toLowerCase(), rank: parsed.rank });
}

export function isArrayType(type: TypeName | undefined): boolean {
    return type !== undefined && parseTypeRef(type).rank > 0;
}

/** Remove exactly one array dimension, preserving scalar types. */
export function elementType(type: TypeName): TypeName {
    const parsed = parseTypeRef(type);
    return formatTypeRef({ base: parsed.base, rank: Math.max(parsed.rank - 1, 0) });
}

export function baseType(type: TypeName | undefined): string | undefined {
    if (!type) { return undefined; }
    return parseTypeRef(type).base.toLowerCase();
}

export function arrayRank(type: TypeName): number {
    return parseTypeRef(type).rank;
}

/**
 * BHS compares scalar struct parameters by recursive field layout when deciding
 * whether overload declarations have the same signature. Array parameters keep
 * their nominal element identity.
 */
export function overloadTypeKey(
    type: TypeName,
    structTypes: StructTypeTable,
    expandingStructs: ReadonlySet<string> = new Set()
): string {
    const normalized = canonicalType(type);
    if (isArrayType(normalized)) {
        return normalized;
    }

    const base = baseType(normalized);
    if (!base) {
        return normalized;
    }
    const fields = structTypes.get(base);
    if (!fields) {
        return normalized;
    }

    // Invalid recursive declarations can exist transiently while editing.
    if (expandingStructs.has(base)) {
        return `struct:${base}`;
    }
    const nestedExpansions = new Set(expandingStructs);
    nestedExpansions.add(base);
    const shape = [...fields.entries()]
        .map(([name, fieldType]) =>
            `${name}:${overloadFieldTypeKey(fieldType, structTypes, nestedExpansions)}`)
        .join(',');
    return `struct{${shape}}`;
}

function overloadFieldTypeKey(
    type: TypeName,
    structTypes: StructTypeTable,
    expandingStructs: ReadonlySet<string>
): string {
    const normalized = canonicalType(type);
    // Scalar void fields are integer-backed for overload layout identity.
    if (normalized === 'void') {
        return 'int';
    }
    return overloadTypeKey(normalized, structTypes, expandingStructs);
}
