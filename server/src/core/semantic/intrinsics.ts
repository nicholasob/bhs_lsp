import { PrimitiveType } from '../types';
import { canonicalIdentifier } from '../languageFacts';

const INTRINSIC_RETURN_TYPES: ReadonlyMap<string, PrimitiveType> = new Map([
    ['$s', 'string']
]);

export function isCompilerIntrinsic(name: string): boolean {
    return name.startsWith('$');
}

export function intrinsicReturnType(name: string): PrimitiveType | undefined {
    return INTRINSIC_RETURN_TYPES.get(canonicalIdentifier(name));
}
