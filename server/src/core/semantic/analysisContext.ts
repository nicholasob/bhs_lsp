import * as A from '../ast/ast';
import { FunctionSignatureMap, PrimitiveType, ScopeType } from '../types';
import { ScopeManager } from '../scopeManager';
import { suggestSimilar } from './nameSimilarity';
import { CallResolver } from './callResolution';
import { AssignmentTracker, SemanticScopeKind, SemanticScopeStack } from './analysisScopes';
import { canonicalIdentifier, isReservedIdentifier } from '../languageFacts';

export interface SemDiagnostic {
    start: number;
    end: number;
    message: string;
    severity: number;
}

export interface IncludedProgramGroup {
    include: A.IncludeDecl;
    programs: readonly A.Program[];
}

/** Source-facing type spelling, including any trailing array dimensions. */
export type TypeName = string;

/**
 * Mutable state owned by exactly one semantic-analysis run.
 *
 * The analyzer classes form a processing pipeline through inheritance:
 * declaration collection -> expression analysis -> statement analysis. State
 * lives here so helper components such as CallResolver remain stateless and a
 * document analysis cannot leak symbols or diagnostics into another version.
 */
export abstract class AnalysisContext {
    protected readonly allNames = new Set<string>();
    protected readonly globalNames = new Set<string>();
    protected readonly explicitDeclNames: string[] = [];
    protected readonly staticTypedDeclNames: string[] = [];
    protected readonly labelDeclNames = new Set<string>();
    protected readonly labelCaseKeys = new Map<string, string>();
    protected collectingIncludedProgram = false;
    protected importedVisibilityStart: number | undefined;
    protected readonly varTypes = new Map<string, TypeName>();
    protected readonly semanticScopes = new SemanticScopeStack();
    protected readonly structTypes = new Map<string, Map<string, TypeName>>();
    protected readonly availableStructTypes = new Map<string, Map<string, TypeName>>();
    protected readonly diagnostics: SemDiagnostic[] = [];
    protected readonly typeCache = new Map<A.Expr, PrimitiveType>();
    protected currentParamNames = new Set<string>();
    protected currentParamTypes = new Map<string, TypeName>();
    protected currentReturnType: TypeName = 'anytype';
    protected currentScriptType: ScopeType | undefined;
    protected currentSymbolVisibleRange: { start: number; end: number } | undefined;
    protected readonly assignments = new AssignmentTracker();
    protected readonly funcSignatures = new Map<string, { returnType: TypeName; hasBody: boolean }>();
    protected readonly availableFuncNames = new Set<string>();
    protected readonly availableFunctionSignatures: FunctionSignatureMap = new Map();
    protected readonly labelNames = new Set<string>();
    protected triggerNames = new Set<string>();
    protected currentTriggerNames = new Set<string>();
    protected currentTriggerDisplayNames: string[] = [];
    protected loopDepth = 0;
    protected switchDepth = 0;
    private callResolverInstance: CallResolver | undefined;

    constructor(
        protected readonly functionSignatures: FunctionSignatureMap,
        protected readonly scopeManager: ScopeManager,
        protected readonly builtinKeys: Set<string>,
        protected readonly userFunctionKeys: Set<string>,
        protected readonly includedPrograms: readonly IncludedProgramGroup[] = [],
        protected readonly suppressUnknownNames = false
    ) {}

    protected get callResolver(): CallResolver {
        if (!this.callResolverInstance) {
            this.callResolverInstance = new CallResolver({
                expressionType: expression => this.expressionTypeName(expression),
                primitiveType: expression => this.inferType(expression),
                normalizePrimitive: type => this.toPrimitiveType(type),
                baseType: type => this.baseType(type),
                isWritableReference: expression => this.isWritableRefArgument(expression)
            });
        }
        return this.callResolverInstance;
    }

    protected abstract inferType(expression: A.Expr): PrimitiveType;
    protected abstract expressionTypeName(expression: A.Expr): TypeName;
    protected abstract isWritableRefArgument(expression: A.Expr): boolean;
    protected abstract toPrimitiveType(type: TypeName | undefined): PrimitiveType | undefined;
    protected abstract baseType(type: TypeName | undefined): string | undefined;

    protected report(at: A.Pos, message: string, severity: number): void {
        this.diagnostics.push({ start: at.start, end: at.end, message, severity });
    }

    protected pushScope(kind: SemanticScopeKind = 'block'): void {
        this.semanticScopes.push(kind);
    }

    protected popScope(): void {
        this.assignments.remove(this.semanticScopes.pop());
    }

    protected declareImplicitLocal(name: string, type: TypeName): void {
        this.semanticScopes.declareType(name, type);
        this.semanticScopes.addName(name);
    }

    protected lookupType(name: string): TypeName | undefined {
        const key = canonicalIdentifier(name);
        return this.currentParamTypes.get(key) ?? this.semanticScopes.lookupType(key) ?? this.varTypes.get(key);
    }

    protected withSymbolVisibility<T>(range: { start: number; end: number } | undefined, cb: () => T): T {
        const previous = this.currentSymbolVisibleRange;
        this.currentSymbolVisibleRange = range;
        try {
            return cb();
        } finally {
            this.currentSymbolVisibleRange = previous;
        }
    }

    protected withLoop<T>(cb: () => T): T {
        this.loopDepth++;
        try {
            return cb();
        } finally {
            this.loopDepth--;
        }
    }

    protected withSwitch<T>(cb: () => T): T {
        this.switchDepth++;
        try {
            return cb();
        } finally {
            this.switchDepth--;
        }
    }

    protected checkRead(identifier: A.Ident): void {
        if (this.suppressUnknownNames) { return; }
        const key = canonicalIdentifier(identifier.name);
        if (!this.isKnownName(key)) {
            const hint = suggestSimilar(identifier.name, this.explicitDeclNames);
            this.report(identifier, `Cannot find name '${identifier.name}'.` +
                (hint ? ` Did you mean '${hint}'?` : ''), 1);
            return;
        }
        if (this.assignments.active && !this.globalNames.has(key) &&
            !this.currentParamNames.has(key) && !this.assignments.has(key)) {
            const hint = suggestSimilar(identifier.name, this.staticTypedDeclNames);
            this.report(identifier, `'${identifier.name}' is used before it is assigned.` +
                (hint ? ` Did you mean '${hint}'?` : ''), 1);
        }
    }

    protected isKnownName(key: string): boolean {
        return this.allNames.has(key) || this.currentParamNames.has(key);
    }

    protected isAvailableUserFunctionName(name: string): boolean {
        const key = canonicalIdentifier(name);
        return this.userFunctionKeys.has(key) && this.availableFuncNames.has(key);
    }

    protected declareVar(identifier: A.Ident): boolean {
        const key = canonicalIdentifier(identifier.name);
        if (!key || !this.semanticScopes.active) { return false; }
        const existingScope = this.semanticScopes.hasName(key);
        if (isReservedIdentifier(identifier.name)) {
            this.report(identifier, `Cannot use reserved keyword '${identifier.name}' as a variable name`, 1);
        } else if (this.isAvailableUserFunctionName(identifier.name)) {
            this.report(identifier, `Variable '${identifier.name}' conflicts with a previously declared function or script`, 1);
        } else if (this.availableStructTypes.has(key)) {
            this.report(identifier, `Variable '${identifier.name}' conflicts with struct type '${identifier.name}' (names are case-insensitive)`, 1);
        } else if (this.triggerNames.has(key)) {
            this.report(identifier, `Variable '${identifier.name}' conflicts with a previously declared trigger`, 1);
        } else if (existingScope) {
            this.report(identifier, `Variable '${identifier.name}' is already declared in this scope or a parent scope`, 1);
        } else if (this.currentParamNames.has(key)) {
            this.report(identifier, `Variable '${identifier.name}' is already declared as a parameter`, 1);
        } else if (this.labelNames.has(key)) {
            this.report(identifier, `Variable '${identifier.name}' conflicts with a label (constant) of the same name`, 1);
        } else {
            this.semanticScopes.addName(key);
            return true;
        }
        return false;
    }
}
