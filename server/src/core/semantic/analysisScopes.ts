import { canonicalIdentifier } from '../languageFacts';

export type SemanticScopeKind = 'global' | 'script' | 'block' | 'for';

interface SemanticScope {
    names: Set<string>;
    types: Map<string, string>;
    kind: SemanticScopeKind;
}

/** Lexical names and inferred/declared types for one analyzer run. */
export class SemanticScopeStack {
    private readonly scopes: SemanticScope[] = [];

    push(kind: SemanticScopeKind = 'block'): void {
        this.scopes.push({ names: new Set(), types: new Map(), kind });
    }

    pop(): Set<string> | undefined {
        return this.scopes.pop()?.names;
    }

    get active(): boolean {
        return this.scopes.length > 0;
    }

    addName(name: string): void {
        this.scopes[this.scopes.length - 1]?.names.add(canonicalIdentifier(name));
    }

    deleteName(name: string): void {
        this.scopes[this.scopes.length - 1]?.names.delete(canonicalIdentifier(name));
    }

    hasName(name: string): boolean {
        const key = canonicalIdentifier(name);
        return this.scopes.some(scope => scope.names.has(key));
    }

    declareType(name: string, type: string | undefined): void {
        if (!name || !type) { return; }
        this.scopes[this.scopes.length - 1]?.types.set(canonicalIdentifier(name), type);
    }

    lookupType(name: string): string | undefined {
        const key = canonicalIdentifier(name);
        for (let index = this.scopes.length - 1; index >= 0; index--) {
            const type = this.scopes[index].types.get(key);
            if (type) { return type; }
        }
        return undefined;
    }
}

/** Definite assignments grouped by independently executed BHS blocks. */
export class AssignmentTracker {
    private readonly blocks: Set<string>[] = [];

    get active(): boolean {
        return this.blocks.length > 0;
    }

    push(): void {
        this.blocks.push(new Set());
    }

    pop(): void {
        this.blocks.pop();
    }

    mark(name: string): void {
        const current = this.blocks[this.blocks.length - 1];
        if (current && name) {
            current.add(canonicalIdentifier(name));
        }
    }

    remove(names: ReadonlySet<string> | undefined): void {
        if (!names?.size) { return; }
        for (const assigned of this.blocks) {
            for (const name of names) {
                assigned.delete(name);
            }
        }
    }

    has(name: string): boolean {
        for (let index = this.blocks.length - 1; index >= 0; index--) {
            if (this.blocks[index].has(name)) { return true; }
        }
        return false;
    }
}
