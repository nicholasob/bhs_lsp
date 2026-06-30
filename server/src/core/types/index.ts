import { CompletionItem, MarkupContent } from 'vscode-languageserver-protocol';

/**
 * Core types for the Big Huge Script language server
 */

// Basic types
export type PrimitiveType = 'int' | 'float' | 'string' | 'bool' | 'void' | 'anytype';
export type ScopeType = 'scenario' | 'conquest' | 'ai';
export type BlockType = 'trigger' | 'run_once' | 'function' | 'scenario';
export type SymbolKind = TypedSymbol['kind'];

// Legacy type for backward compatibility
export type bracket = TypedScope;

/**
 * Represents a fully typed function signature
 */
export interface FunctionSignature {
    name: string;
    paramNames: string[];
    paramTypes: string[];
    paramQualifiers?: Array<string | undefined>;
    paramDescriptions?: string[];
    returnType: string;
    scriptType?: ScopeType;
    description?: string;
    /** Free-text usage notes from the docs (often "works like X, except ..."). */
    notes?: string;
    /** What the return value means, e.g. "1 on success, 0 false, -1 if failed". */
    returnDescription?: string;
    scope?: TypedScope;
    /** Main-document offset where this signature becomes visible. Builtins omit it. */
    declarationStart?: number;
}

/**
 * Symbol declaration with enhanced type information
 */
export interface TypedSymbol {
    name: string;
    type: string;
    kind: 'function' | 'variable' | 'parameter' | 'label' | 'trigger' | 'struct' | 'field';
    description?: string;
    /**
     * Statically-known value as source text: a label's constant, or a variable's
     * literal initializer. Absent for non-literal initializers and runtime values.
     */
    value?: string;
    range: { start: number; end: number };
    /** Source range where the symbol can be referenced. Omitted means global. */
    visibleRange?: { start: number; end: number };
    scope?: TypedScope;
}

export type FunctionSignatureMap = Map<string, FunctionSignature[]>;

export function functionKey(name: string): string {
    return name.toLowerCase();
}

export function addFunctionSignature(signatures: FunctionSignatureMap, signature: FunctionSignature): void {
    const key = functionKey(signature.name);
    const overloads = signatures.get(key);
    if (overloads) {
        overloads.push(signature);
    } else {
        signatures.set(key, [signature]);
    }
}

export function setFunctionSignatures(
    signatures: FunctionSignatureMap,
    name: string,
    overloads: FunctionSignature[]
): void {
    signatures.set(functionKey(name), overloads);
}

export function getFunctionOverloads(
    signatures: FunctionSignatureMap,
    name: string
): FunctionSignature[] {
    return signatures.get(functionKey(name)) ?? [];
}

export function getPrimaryFunctionSignature(
    signatures: FunctionSignatureMap,
    name: string
): FunctionSignature | undefined {
    return getFunctionOverloads(signatures, name)[0];
}

export function isFunctionSignatureVisibleAt(signature: FunctionSignature, position: number): boolean {
    return signature.declarationStart === undefined || signature.declarationStart <= position;
}

export function isVariadicFunctionSignature(signature: FunctionSignature): boolean {
    return signature.paramNames.some(name => name.includes('...') || name.includes('\u2026'));
}

/**
 * Scope tracking with type information
 */
export interface TypedScope {
    symbols: Map<string, TypedSymbol>;
    parent?: TypedScope;
    children: TypedScope[];
    range: { start: number; end: number };
    startIndex: number;  // For compatibility with CodeBlock
    endIndex: number;    // For compatibility with CodeBlock
    type?: BlockType;    // Optional type for scope
}

/**
 * Combined completion information
 */
export interface CompletionInfo {
    item: CompletionItem;
    details: {
        detail: string;
        documentation: string | MarkupContent;
    };
}
