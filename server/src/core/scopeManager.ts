import { TypedScope, TypedSymbol } from './types';
import { canonicalIdentifier } from './languageFacts';
import { elementType } from './semantic/typeRelations';

/**
 * Symbol index used by completion and hover.
 *
 * SemanticScopeStack owns compiler-facing declaration rules; this class keeps
 * source ranges and display metadata so editor features can query the symbols
 * visible at an arbitrary document offset.
 */
export class ScopeManager {
    private currentScope: TypedScope;
    private globalScope: TypedScope;
    private allSymbols: TypedSymbol[] = [];
    private symbolsByName = new Map<string, TypedSymbol[]>();
    private structs = new Map<string, Map<string, { name: string; type: string }>>();

    constructor() {
        this.globalScope = this.createScope(undefined, 'scenario');
        this.currentScope = this.globalScope;
    }

    /**
     * Create a new scope with the given parent
     */
    createScope(parent?: TypedScope, type?: TypedScope['type']): TypedScope {
        const scope: TypedScope = {
            symbols: new Map(),
            parent,
            children: [],
            range: { start: 0, end: 0 },
            startIndex: 0,
            endIndex: 0,
            type
        };
        
        if (parent) {
            parent.children.push(scope);
        }
        
        return scope;
    }

    /**
     * Enters a new scope
     */
    enterScope(scope: TypedScope): void {
        scope.parent = this.currentScope;
        this.currentScope.children?.push(scope);
        this.currentScope = scope;
    }

    /**
     * Exits the current scope
     */
    exitScope(): void {
        if (this.currentScope.parent) {
            this.currentScope = this.currentScope.parent;
        }
    }

    /**
     * Adds a symbol to the current scope
     */
    recordSymbol(symbol: TypedSymbol): void {
        this.allSymbols.push(symbol);
        // BHS identifiers are case-insensitive: key by lowercase, but keep the
        // symbol's original casing (symbol.name) for display.
        const key = canonicalIdentifier(symbol.name);
        const namedSymbols = this.symbolsByName.get(key);
        if (namedSymbols) {
            namedSymbols.push(symbol);
        } else {
            this.symbolsByName.set(key, [symbol]);
        }
        if (!this.currentScope.symbols.has(key)) {
            this.currentScope.symbols.set(key, symbol);
        }
    }

    addStruct(name: string, fields: Array<{ name: string; type: string }>): void {
        this.structs.set(
            canonicalIdentifier(name),
            new Map(fields.map(field => [canonicalIdentifier(field.name), field]))
        );
    }

    lookupStructField(structType: string, fieldName: string): { name: string; type: string } | undefined {
        return this.structs.get(canonicalIdentifier(elementType(structType)))
            ?.get(canonicalIdentifier(fieldName));
    }

    lookupSymbolAt(name: string, position: number): TypedSymbol | undefined {
        const key = canonicalIdentifier(name);
        let best: TypedSymbol | undefined;
        for (const symbol of this.symbolsByName.get(key) ?? []) {
            if (!this.isVisible(symbol, position)) {
                continue;
            }
            best = this.preferMoreSpecificSymbol(symbol, best);
        }
        return best;
    }

    updateSymbolTypeAt(name: string, position: number, type: string): void {
        const symbol = this.lookupSymbolAt(name, position);
        if (symbol) {
            symbol.type = type;
        }
    }

    /**
     * Looks up a symbol in the current scope and parent scopes
     */
    lookupSymbol(name: string): TypedSymbol | undefined {
        let scope: TypedScope | undefined = this.currentScope;
        
        const key = canonicalIdentifier(name);
        while (scope) {
            const symbol = scope.symbols.get(key);
            if (symbol) {
                return symbol;
            }
            scope = scope.parent;
        }
        
        return undefined;
    }

    /**
     * Gets all symbols visible from the current position
     */
    getVisibleSymbols(position: number): Map<string, TypedSymbol> {
        const symbols = new Map<string, TypedSymbol>();
        for (const symbol of this.allSymbols) {
            if (!this.isVisible(symbol, position)) {
                continue;
            }
            const key = canonicalIdentifier(symbol.name);
            const existing = symbols.get(key);
            symbols.set(key, this.preferMoreSpecificSymbol(symbol, existing));
        }

        return symbols;
    }

    private preferMoreSpecificSymbol(candidate: TypedSymbol, current: TypedSymbol | undefined): TypedSymbol {
        if (!current) {
            return candidate;
        }
        if (this.visibilityWidth(candidate) < this.visibilityWidth(current)) {
            return candidate;
        }
        return candidate.range.start > current.range.start ? candidate : current;
    }

    private isVisible(symbol: TypedSymbol, position: number): boolean {
        if (symbol.kind !== 'trigger' && symbol.range.start > position) {
            return false;
        }
        if (!symbol.visibleRange) {
            return true;
        }
        return symbol.visibleRange.start <= position && position <= symbol.visibleRange.end;
    }

    private visibilityWidth(symbol: TypedSymbol): number {
        if (!symbol.visibleRange) {
            return Number.MAX_SAFE_INTEGER;
        }
        return symbol.visibleRange.end - symbol.visibleRange.start;
    }

    /**
     * Resets the scope manager
     */
    reset(): void {
        this.globalScope = this.createScope(undefined, 'scenario');
        this.currentScope = this.globalScope;
        this.allSymbols = [];
        this.symbolsByName.clear();
        this.structs.clear();
    }
}
