import functions from '../RoN_Functions/functions.json';
import { addFunctionSignature, FunctionSignatureMap } from '../core/types';

interface BuiltinArgument {
    name: string;
    type: string;
    qualifier?: string;
}

interface BuiltinReturn {
    name?: string;
    type?: string;
}

interface BuiltinDefinition {
    name: string;
    arguments: BuiltinArgument[];
    return?: BuiltinReturn;
    description?: string;
    notes?: string;
}

/** Build a fresh mutable signature map from the checked-in game catalog. */
export function createBuiltinFunctionSignatures(): FunctionSignatureMap {
    const signatures: FunctionSignatureMap = new Map();
    for (const definition of functions as BuiltinDefinition[]) {
        addFunctionSignature(signatures, {
            name: definition.name,
            paramNames: definition.arguments.map(argument => argument.name),
            paramTypes: definition.arguments.map(argument => normalizeBuiltinType(argument.type)),
            paramQualifiers: definition.arguments.map(argument => argument.qualifier),
            returnType: normalizeBuiltinType(definition.return?.type ?? 'void'),
            description: definition.description?.trim() || undefined,
            notes: definition.notes?.trim() || undefined,
            returnDescription: definition.return?.name?.trim() || undefined
        });
    }
    return signatures;
}

/** Normalize documentation aliases while preserving custom game handle types. */
function normalizeBuiltinType(type: string): string {
    switch (type.toLowerCase()) {
        case 'int':
        case 'integer':
            return 'int';
        case 'real':
        case 'float':
            return 'float';
        case 'string':
            return 'string';
        case 'bool':
        case 'boolean':
            return 'bool';
        case 'void':
            return 'void';
        default:
            return type;
    }
}
