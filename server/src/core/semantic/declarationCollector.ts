import * as A from '../ast/ast';
import {
    addFunctionSignature,
    FunctionSignature,
    getFunctionOverloads,
    PrimitiveType,
    TypedSymbol
} from '../types';
import { literalText, resolveLabels } from './constantValues';
import {
    baseType,
    isArrayType,
    overloadTypeKey as createOverloadTypeKey,
    sameType
} from './typeRelations';
import { isReservedIdentifier } from '../languageFacts';
import { AnalysisContext, TypeName } from './analysisContext';

export { IncludedProgramGroup, SemDiagnostic, TypeName } from './analysisContext';

/**
 * First semantic pass: index declarations needed by tooling and identity
 * checks. Indexing does not make user declarations callable or usable early;
 * StatementAnalyzer adds them to the available sets as source order advances.
 */
export abstract class DeclarationCollector extends AnalysisContext {
    protected collectProgram(program: A.Program): void {
        for (const item of program.items) { this.collectTopLevel(item); }
    }

    private collectTopLevel(item: A.TopLevel): void {
        switch (item.kind) {
            case 'Struct':
                this.collectStruct(item);
                break;
            case 'Script':
                this.collectScript(item);
                break;
            case 'Labels':
                this.collectStmt(item);
                break;
            case 'Include':
            case 'Empty':
                break;
        }
    }

    protected collectStruct(stmt: A.StructDecl): void {
        const key = stmt.name.name.toLowerCase();
        this.define(stmt.name.name);
        if (key && !this.structTypes.has(key)) {
            const fields = this.structFieldsFromDeclaration(stmt);
            this.structTypes.set(key, fields);
            this.scopeManager.addStruct(stmt.name.name, stmt.fields.map(field => ({
                name: field.name.name,
                type: field.fieldType
            })));
            this.scopeManager.recordSymbol(this.symbol(
                stmt.name,
                'struct',
                'struct',
                undefined,
                undefined,
                this.describeStruct(stmt)
            ));
        }
    }

    protected addAvailableStruct(stmt: A.StructDecl): void {
        const key = stmt.name.name.toLowerCase();
        if (key && !this.availableStructTypes.has(key)) {
            this.availableStructTypes.set(key, this.structFieldsFromDeclaration(stmt));
        }
    }

    private structFieldsFromDeclaration(stmt: A.StructDecl): Map<string, TypeName> {
        return new Map(stmt.fields.map(field => [field.name.name.toLowerCase(), field.fieldType]));
    }

    private describeStruct(stmt: A.StructDecl): string {
        if (!stmt.fields.length) {
            return 'Struct with no fields.';
        }
        return [
            'Fields:',
            ...stmt.fields.map(field => `- \`${field.fieldType} ${field.name.name}\``)
        ].join('\n');
    }

    private collectScript(script: A.ScriptDecl): void {
        if (script.name?.name) {
            const key = script.name.name.toLowerCase();
            if (!isReservedIdentifier(script.name.name)) {
                this.define(script.name.name);
                this.globalNames.add(key);
                this.scopeManager.recordSymbol(this.symbol(
                    script.name,
                    this.declaredScriptReturnType(script),
                    'function'
                ));
            }
            if (!isReservedIdentifier(script.name.name) && !this.builtinKeys.has(key)) {
                this.userFunctionKeys.add(key);
                this.publishScriptSignature(script);
            }
        }
        if (this.collectingIncludedProgram) {
            if (script.body) { this.collectIncludedLabels(script.body); }
            return;
        }
        for (const parameter of script.params) {
            this.explicitDeclNames.push(parameter.name.name);
            this.staticTypedDeclNames.push(parameter.name.name);
            this.scopeManager.recordSymbol(this.symbol(
                parameter.name,
                parameter.paramType ?? 'int',
                'parameter',
                undefined,
                script.body
            ));
        }
        if (script.body) {
            const previousParamNames = this.currentParamNames;
            this.currentParamNames = new Set(
                script.params.map(parameter => parameter.name.name.toLowerCase()).filter(Boolean)
            );
            this.withSymbolVisibility(script.body, () => this.collectStmt(script.body!));
            this.currentParamNames = previousParamNames;
        }
    }

    protected hasTerminalReturn(body: A.Block): boolean {
        return body.body[body.body.length - 1]?.kind === 'Return';
    }

    protected isAggregateType(type: TypeName | undefined): boolean {
        return !!type && (isArrayType(type) || this.isStructType(type));
    }

    protected aggregateEqualityTypesMatch(leftType: TypeName, rightType: TypeName): boolean {
        const leftIsArray = isArrayType(leftType);
        const rightIsArray = isArrayType(rightType);
        if (leftIsArray || rightIsArray) {
            return leftIsArray && rightIsArray && sameType(leftType, rightType);
        }
        return this.isStructType(leftType) && this.isStructType(rightType) &&
            this.baseType(leftType) === this.baseType(rightType);
    }

    private publishScriptSignature(script: A.ScriptDecl): void {
        const signature = this.scriptSignature(script);
        const duplicate = getFunctionOverloads(this.functionSignatures, signature.name)
            .some(existing =>
                existing.scriptType === signature.scriptType &&
                existing.paramTypes.length === signature.paramTypes.length &&
                existing.paramTypes.every((type, index) =>
                    this.overloadTypeKey(type, this.structTypes) ===
                        this.overloadTypeKey(signature.paramTypes[index], this.structTypes)) &&
                existing.paramNames.every((name, index) =>
                    name.toLowerCase() === signature.paramNames[index]?.toLowerCase()) &&
                existing.paramQualifiers?.every((qualifier, index) =>
                    qualifier === signature.paramQualifiers?.[index])
            );
        if (!duplicate) {
            addFunctionSignature(this.functionSignatures, signature);
        }
    }

    private collectIncludedLabels(stmt: A.Stmt): void {
        if (stmt.kind === 'Labels') {
            this.collectStmt(stmt);
            return;
        }
        switch (stmt.kind) {
            case 'Block':
                for (const child of stmt.body) { this.collectIncludedLabels(child); }
                break;
            case 'Trigger':
            case 'RunOnce':
            case 'While':
            case 'DoWhile':
                this.collectIncludedLabels(stmt.body);
                break;
            case 'If':
                this.collectIncludedLabels(stmt.then);
                if (stmt.alt) { this.collectIncludedLabels(stmt.alt); }
                break;
            case 'For':
                this.collectIncludedLabels(stmt.body);
                break;
            case 'Switch':
                for (const switchCase of stmt.cases) {
                    for (const child of switchCase.body) { this.collectIncludedLabels(child); }
                }
                break;
            default:
                break;
        }
    }

    protected scriptSignature(script: A.ScriptDecl): FunctionSignature {
        return {
            name: script.name?.name ?? '',
            paramNames: script.params.map(parameter => parameter.name.name),
            paramTypes: script.params.map(parameter => (parameter.paramType as PrimitiveType) ?? 'int'),
            paramQualifiers: script.params.map(parameter => parameter.isRef ? 'ref' : parameter.qualifier),
            returnType: this.declaredScriptReturnType(script),
            scriptType: script.scriptType as 'scenario' | 'conquest' | 'ai',
            declarationStart: this.importedVisibilityStart ?? script.start
        };
    }

    protected declaredScriptReturnType(script: A.ScriptDecl): TypeName {
        return script.returnType ?? 'anytype';
    }

    protected addAvailableScriptSignature(script: A.ScriptDecl): void {
        if (!script.name?.name || isReservedIdentifier(script.name.name)) { return; }
        const signature = this.scriptSignature(script);
        const overloads = getFunctionOverloads(this.availableFunctionSignatures, signature.name);
        const alreadyAvailable = overloads.some(existing =>
            existing.scriptType === signature.scriptType &&
            existing.paramTypes.length === signature.paramTypes.length &&
            existing.paramTypes.every((type, index) =>
                this.overloadTypeKey(type) === this.overloadTypeKey(signature.paramTypes[index])) &&
            existing.paramNames.every((name, index) =>
                name.toLowerCase() === signature.paramNames[index]?.toLowerCase()) &&
            existing.paramQualifiers?.every((qualifier, index) =>
                qualifier === signature.paramQualifiers?.[index])
        );
        if (!alreadyAvailable) {
            addFunctionSignature(this.availableFunctionSignatures, signature);
        }
    }

    protected overloadTypeKey(
        type: TypeName,
        structTypes: ReadonlyMap<string, Map<string, TypeName>> = this.availableStructTypes
    ): string {
        return createOverloadTypeKey(type, structTypes);
    }

    private collectStmt(stmt: A.Stmt): void {
        switch (stmt.kind) {
            case 'Struct':
                this.collectStruct(stmt);
                break;
            case 'VarDecl':
                for (const declarator of stmt.declarators) {
                    this.define(declarator.name.name);
                    this.explicitDeclNames.push(declarator.name.name);
                    const declaredType = declarator.varType ?? stmt.varType;
                    if (stmt.qualifier === 'static' || declaredType) {
                        this.staticTypedDeclNames.push(declarator.name.name);
                    }
                    const type: TypeName = declaredType ?? 'anytype';
                    this.scopeManager.recordSymbol(this.symbol(
                        declarator.name,
                        type,
                        'variable',
                        literalText(declarator.init),
                        this.currentSymbolVisibleRange
                    ));
                }
                break;
            case 'Assign':
                if (stmt.target.kind === 'Ident') {
                    const key = stmt.target.name.toLowerCase();
                    const visibleSymbol = this.scopeManager.lookupSymbolAt(
                        stmt.target.name,
                        stmt.target.start
                    );
                    if (!this.currentParamNames.has(key) && !visibleSymbol) {
                        this.define(stmt.target.name);
                        this.scopeManager.recordSymbol(this.symbol(
                            stmt.target,
                            'anytype',
                            'variable',
                            undefined,
                            this.currentSymbolVisibleRange
                        ));
                    }
                }
                break;
            case 'Labels': {
                const resolvedLabels = resolveLabels(
                    stmt,
                    expression => this.inferType(expression),
                    this.labelCaseKeys
                );
                for (const [index, entry] of stmt.entries.entries()) {
                    const key = entry.name.name.toLowerCase();
                    const resolved = resolvedLabels[index];
                    this.labelDeclNames.add(key);
                    this.explicitDeclNames.push(entry.name.name);
                    const type = resolved.type;
                    if (this.collectingIncludedProgram) {
                        this.define(entry.name.name);
                        this.globalNames.add(key);
                        this.labelNames.add(key);
                        this.varTypes.set(key, type === 'anytype' ? 'int' : type);
                        if (resolved.caseKey) { this.labelCaseKeys.set(key, resolved.caseKey); }
                    }
                    this.scopeManager.recordSymbol(this.symbol(
                        entry.name,
                        type === 'anytype' ? 'int' : type,
                        'label',
                        resolved.displayValue,
                        this.currentSymbolVisibleRange
                    ));
                }
                break;
            }
            case 'Trigger':
                if (stmt.name) {
                    this.define(stmt.name.name);
                    this.globalNames.add(stmt.name.name.toLowerCase());
                    this.scopeManager.recordSymbol(this.symbol(
                        stmt.name,
                        'bool',
                        'trigger',
                        undefined,
                        this.currentSymbolVisibleRange
                    ));
                }
                this.withSymbolVisibility(stmt.body, () => this.collectStmt(stmt.body));
                break;
            case 'RunOnce':
                this.withSymbolVisibility(stmt.body, () => this.collectStmt(stmt.body));
                break;
            case 'Block':
                this.withSymbolVisibility(stmt, () => {
                    for (const child of stmt.body) { this.collectStmt(child); }
                });
                break;
            case 'If':
                this.collectStmt(stmt.then);
                if (stmt.alt) { this.collectStmt(stmt.alt); }
                break;
            case 'While':
                this.collectStmt(stmt.body);
                break;
            case 'For':
                if (stmt.init) { this.collectStmt(stmt.init); }
                if (stmt.update) { this.collectStmt(stmt.update); }
                this.collectStmt(stmt.body);
                break;
            case 'DoWhile':
                this.collectStmt(stmt.body);
                break;
            case 'Switch':
                for (const switchCase of stmt.cases) {
                    for (const child of switchCase.body) {
                        if (child.kind !== 'Struct') { this.collectStmt(child); }
                    }
                }
                break;
            default:
                break;
        }
    }

    protected collectLocalTriggers(stmt: A.Stmt, names: Set<string>, displayNames: string[]): void {
        switch (stmt.kind) {
            case 'Trigger':
                if (stmt.name?.name) {
                    names.add(stmt.name.name.toLowerCase());
                    displayNames.push(stmt.name.name);
                }
                break;
            case 'Block':
                for (const child of stmt.body) { this.collectLocalTriggers(child, names, displayNames); }
                break;
            case 'RunOnce':
                this.collectLocalTriggers(stmt.body, names, displayNames);
                break;
            case 'If':
                this.collectLocalTriggers(stmt.then, names, displayNames);
                if (stmt.alt) { this.collectLocalTriggers(stmt.alt, names, displayNames); }
                break;
            case 'While':
            case 'DoWhile':
                this.collectLocalTriggers(stmt.body, names, displayNames);
                break;
            case 'For':
                this.collectLocalTriggers(stmt.body, names, displayNames);
                break;
            case 'Switch':
                for (const switchCase of stmt.cases) {
                    for (const child of switchCase.body) {
                        this.collectLocalTriggers(child, names, displayNames);
                    }
                }
                break;
            default:
                break;
        }
    }

    protected define(name: string): void {
        if (name) { this.allNames.add(name.toLowerCase()); }
    }

    private symbol(
        id: A.Ident,
        type: string,
        kind: TypedSymbol['kind'],
        value?: string,
        visibleRange?: { start: number; end: number },
        description?: string
    ): TypedSymbol {
        const start = this.importedVisibilityStart ?? id.start;
        const end = this.importedVisibilityStart === undefined ? id.end : start + id.name.length;
        return { name: id.name, type, kind, value, range: { start, end }, visibleRange, description };
    }

    protected toPrimitiveType(type: TypeName | undefined): PrimitiveType | undefined {
        const base = this.baseType(type);
        if (base && this.availableStructTypes.has(base)) {
            return undefined;
        }
        switch (base) {
            case 'int':
            case 'float':
            case 'string':
            case 'bool':
            case 'void':
            case 'anytype':
                return base;
            default:
                return undefined;
        }
    }

    protected baseType(type: TypeName | undefined): string | undefined {
        return baseType(type);
    }

    protected isStructType(type: TypeName | undefined): boolean {
        const base = this.baseType(type);
        return !!base && this.availableStructTypes.has(base);
    }

    protected hasVisibleVariableNamed(name: string): boolean {
        const key = name.toLowerCase();
        return this.currentParamNames.has(key) || this.semanticScopes.hasName(key);
    }

    protected hasCallNameCollision(name: string): boolean {
        return this.hasVisibleVariableNamed(name) || this.labelNames.has(name.toLowerCase());
    }
}
