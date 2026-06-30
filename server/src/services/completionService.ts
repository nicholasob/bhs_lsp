import { TextDocument, Position } from 'vscode-languageserver-textdocument';
import { 
    CompletionItem,
    CompletionItemKind,
    InsertTextFormat,
    MarkupKind,
    SignatureHelp,
    SignatureInformation,
    ParameterInformation
} from 'vscode-languageserver/node';
import {
    FunctionSignature,
    FunctionSignatureMap,
    getFunctionOverloads,
    isFunctionSignatureVisibleAt,
    isVariadicFunctionSignature,
    TypedSymbol
} from '../core/types';
import { ScopeManager } from '../core/scopeManager';
import { formatFunctionParameter, formatFunctionSignature } from './markup';
import { identifierBefore, previousNonWhitespaceIndex } from '../utilities/text';

const TRIGGER_REFERENCE_FUNCTIONS = new Set(['enable_trigger', 'disable_trigger', 'is_trigger_enabled']);
const STRING_ONLY_TRIGGER_REFERENCE_FUNCTIONS = new Set(['is_trigger_enabled']);

export interface CompletionContext {
    functionSignatures: FunctionSignatureMap;
    scopeManager: ScopeManager;
}

export class CompletionService {
    // Language keywords not already provided as editor snippets (bhs.json
    // supplies scenario/if/while/for/switch/trigger/run_once/labels/include).
    private static readonly KEYWORDS = [
        'int', 'float', 'string', 'bool', 'void',
        'static', 'ref', 'struct',
        'conquest', 'ai',
        'else', 'do', 'case', 'break', 'continue', 'return'
    ];
    private static readonly KEYWORD_COMPLETIONS: CompletionItem[] = CompletionService.KEYWORDS.map(keyword => ({
        label: keyword,
        kind: CompletionItemKind.Keyword,
        sortText: `40_${keyword}`,
        insertText: keyword,
        insertTextFormat: InsertTextFormat.PlainText,
        detail: `(keyword) ${keyword}`
    }));

    private readonly builtinFunctionKeys: Set<string>;
    private readonly builtinFunctionCompletions: CompletionItem[];

    constructor(builtinSignatures: FunctionSignatureMap) {
        this.builtinFunctionKeys = new Set(builtinSignatures.keys());
        this.builtinFunctionCompletions = Array.from(builtinSignatures.values())
            .filter(overloads => overloads.length > 0)
            .map(overloads => this.createCompletionFromFunction(overloads[0]));
    }

    getCompletions(document: TextDocument, position: Position, context: CompletionContext): CompletionItem[] {
        const offset = document.offsetAt(position);
        const visibleSymbols = context.scopeManager.getVisibleSymbols(offset);
        const triggerReferenceContext = this.getTriggerReferenceContext(document, offset);

        if (triggerReferenceContext) {
            return this.sortedCompletions(this.triggerReferenceCompletions(visibleSymbols, triggerReferenceContext.name));
        }

        return this.sortedCompletions([
            ...this.symbolCompletions(visibleSymbols),
            ...this.visibleBuiltinFunctionCompletions(visibleSymbols),
            ...this.userFunctionCompletions(offset, visibleSymbols, context.functionSignatures),
            ...CompletionService.cloneCompletionItems(CompletionService.KEYWORD_COMPLETIONS)
        ]);
    }

    private triggerReferenceCompletions(
        visibleSymbols: Map<string, TypedSymbol>,
        functionName: string
    ): CompletionItem[] {
        const completions: CompletionItem[] = [];
        for (const symbol of visibleSymbols.values()) {
            if (symbol.kind === 'trigger') {
                completions.push(this.createTriggerReferenceCompletion(symbol, functionName));
            }
        }
        return completions;
    }

    private symbolCompletions(visibleSymbols: Map<string, TypedSymbol>): CompletionItem[] {
        const completions: CompletionItem[] = [];
        for (const symbol of visibleSymbols.values()) {
            if (symbol.kind === 'function') { continue; }
            completions.push(this.createCompletionFromSymbol(symbol, this.symbolSortPrefix(symbol)));
        }
        return completions;
    }

    private visibleBuiltinFunctionCompletions(visibleSymbols: Map<string, TypedSymbol>): CompletionItem[] {
        return CompletionService.cloneCompletionItems(this.builtinFunctionCompletions)
            .filter(item => {
                const symbol = visibleSymbols.get(String(item.label).toLowerCase());
                return !symbol || symbol.kind === 'function';
            });
    }

    private userFunctionCompletions(
        position: number,
        visibleSymbols: Map<string, TypedSymbol>,
        functionSignatures: FunctionSignatureMap
    ): CompletionItem[] {
        const completions: CompletionItem[] = [];
        for (const [key, overloads] of functionSignatures) {
            if (this.builtinFunctionKeys.has(key)) {
                continue;
            }
            if (visibleSymbols.get(key)?.kind !== 'function') {
                continue;
            }
            const signature = overloads.find(candidate => isFunctionSignatureVisibleAt(candidate, position));
            if (!signature) {
                continue;
            }
            completions.push(this.createCompletionFromFunction(signature, '20', overloads));
        }
        return completions;
    }

    private sortedCompletions(completions: CompletionItem[]): CompletionItem[] {
        return completions.sort((a, b) => this.compareCompletionItems(a, b));
    }

    private static cloneCompletionItems(items: CompletionItem[]): CompletionItem[] {
        return items.map(item => ({
            ...item,
            documentation: item.documentation && typeof item.documentation === 'object'
                ? { ...item.documentation }
                : item.documentation,
            command: item.command ? { ...item.command } : undefined,
            data: item.data && typeof item.data === 'object' ? { ...item.data } : item.data
        }));
    }

    private createCompletionFromSymbol(symbol: TypedSymbol, sortPrefix = '10'): CompletionItem {
        const item: CompletionItem = {
            label: symbol.name,
            kind: this.getCompletionKind(symbol.kind),
            sortText: `${sortPrefix}_${symbol.name.toLowerCase()}`,
            detail: `(${symbol.kind}) ${symbol.name}: ${symbol.type}`,
            documentation: {
                kind: MarkupKind.Markdown,
                value: `Symbol of type \`${symbol.type}\` declared in ${symbol.scope || 'local'} scope`
            },
            // Add data for resolution
            data: {
                type: symbol.kind,
                kind: symbol.kind,
                symbolType: symbol.type
            }
        };

        return item;
    }

    private createCompletionFromFunction(
        signature: FunctionSignature,
        sortPrefix = '30',
        overloads?: readonly FunctionSignature[]
    ): CompletionItem {
        const args = signature.paramNames.map((name, i) => `\${${i + 1}:${name}}`).join(', ');
        const item: CompletionItem = {
            label: signature.name,
            kind: CompletionItemKind.Function,
            sortText: `${sortPrefix}_${signature.name.toLowerCase()}`,
            detail: `(function) ${formatFunctionSignature(signature)}`,
            documentation: {
                kind: MarkupKind.Markdown,
                value: signature.scope ? 
                    `Function declared in ${signature.scope} scope` :
                    'Built-in function'
            },
            insertText: `${signature.name}(${args})`,
            insertTextFormat: InsertTextFormat.Snippet,
            // Add command to trigger parameter hints
            command: {
                title: 'Trigger Parameter Hints',
                command: 'editor.action.triggerParameterHints'
            },
            // Add data for resolution
            data: {
                type: 'function',
                signature,
                ...(overloads ? { overloads } : {})
            }
        };

        return item;
    }

    private createTriggerReferenceCompletion(symbol: TypedSymbol, functionName: string): CompletionItem {
        const item = this.createCompletionFromSymbol(symbol, '00');
        if (STRING_ONLY_TRIGGER_REFERENCE_FUNCTIONS.has(functionName)) {
            item.insertText = `"${symbol.name}"`;
            item.insertTextFormat = InsertTextFormat.PlainText;
            item.detail = `(trigger) "${symbol.name}"`;
        }
        return item;
    }

    private getCompletionKind(symbolKind: TypedSymbol['kind']): CompletionItemKind {
        switch (symbolKind) {
            case 'function':
                return CompletionItemKind.Function;
            case 'variable':
                return CompletionItemKind.Variable;
            case 'parameter':
                return CompletionItemKind.Variable;
            case 'label':
                return CompletionItemKind.Constant;
            case 'trigger':
                return CompletionItemKind.Event;
            case 'struct':
                return CompletionItemKind.Struct;
            case 'field':
                return CompletionItemKind.Field;
            default:
                return CompletionItemKind.Text;
        }
    }

    public getSignatureHelp(doc: TextDocument, position: Position, analysis: CompletionContext): SignatureHelp {
        const text = doc.getText();
        const offset = doc.offsetAt(position);
        const call = this.findCurrentCallContext(text.slice(0, offset));
        if (!call) {
            return { signatures: [], activeSignature: 0, activeParameter: 0 };
        }

        const visibleSymbol = analysis.scopeManager.getVisibleSymbols(offset).get(call.name.toLowerCase());
        if (visibleSymbol && visibleSymbol.kind !== 'function') {
            return { signatures: [], activeSignature: 0, activeParameter: 0 };
        }
        const signatures = getFunctionOverloads(analysis.functionSignatures, call.name)
            .filter(signature => isFunctionSignatureVisibleAt(signature, offset));
        if (!signatures.length) {
            return { signatures: [], activeSignature: 0, activeParameter: 0 };
        }

        const activeParameter = call.argumentIndex + (call.hasReceiver ? 1 : 0);
        const activeSignature = this.bestSignatureIndexForArity(signatures, activeParameter + 1);
        return {
            signatures: signatures.map(signature => this.createSignatureInformation(signature, call.name)),
            activeSignature,
            activeParameter: Math.min(activeParameter, Math.max(signatures[activeSignature].paramNames.length - 1, 0))
        };
    }

    private createSignatureInformation(signature: FunctionSignature, displayName: string): SignatureInformation {
        const sigInfo = SignatureInformation.create(
            formatFunctionSignature(signature, displayName),
            `Function ${displayName}`
        );

        sigInfo.parameters = signature.paramNames.map((name, i) =>
            ParameterInformation.create(
                name,
                `Parameter ${formatFunctionParameter(signature, i)}\n\nArgument ${i + 1} of ${displayName}`
            )
        );

        return sigInfo;
    }

    private bestSignatureIndexForArity(signatures: readonly FunctionSignature[], argumentCount: number): number {
        const exact = signatures.findIndex(signature => signature.paramNames.length === argumentCount);
        if (exact >= 0) {
            return exact;
        }
        const variadic = signatures.findIndex(signature =>
            isVariadicFunctionSignature(signature) &&
                argumentCount >= Math.max(signature.paramNames.length - 1, 0));
        return variadic >= 0 ? variadic : 0;
    }

    private symbolSortPrefix(symbol: TypedSymbol): string {
        switch (symbol.kind) {
            case 'parameter': return '00';
            case 'variable': return '01';
            case 'trigger': return '02';
            case 'label': return '03';
            case 'struct': return '04';
            case 'field': return '05';
            default: return '10';
        }
    }

    private compareCompletionItems(a: CompletionItem, b: CompletionItem): number {
        const aSort = a.sortText ?? a.label.toString();
        const bSort = b.sortText ?? b.label.toString();
        const bySort = aSort.localeCompare(bSort);
        return bySort !== 0 ? bySort : a.label.toString().localeCompare(b.label.toString());
    }

    private getTriggerReferenceContext(document: TextDocument, offset: number): { name: string; argumentIndex: number } | undefined {
        const text = document.getText().slice(0, offset);
        const context = this.findCurrentCallContext(text);
        return context && TRIGGER_REFERENCE_FUNCTIONS.has(context.name) && context.argumentIndex === 0
            ? context
            : undefined;
    }

    private findCurrentCallContext(textBeforeCursor: string): { name: string; argumentIndex: number; hasReceiver: boolean } | undefined {
        let depth = 0;
        let argumentIndex = 0;
        let inString = false;
        let escaped = false;

        for (let i = textBeforeCursor.length - 1; i >= 0; i--) {
            const ch = textBeforeCursor[i];
            if (inString) {
                if (escaped) {
                    escaped = false;
                } else if (ch === '\\') {
                    escaped = true;
                } else if (ch === '"') {
                    inString = false;
                }
                continue;
            }
            if (ch === '"') {
                inString = true;
                continue;
            }
            if (ch === ')') {
                depth++;
                continue;
            }
            if (ch === '(') {
                if (depth > 0) {
                    depth--;
                    continue;
                }
                const callee = identifierBefore(textBeforeCursor, i);
                if (!callee) { return undefined; }
                return {
                    name: callee.text.toLowerCase(),
                    argumentIndex,
                    hasReceiver: this.hasMemberReceiver(textBeforeCursor, callee.start)
                };
            }
            if (ch === ',' && depth === 0) {
                argumentIndex++;
            }
        }
        return undefined;
    }

    private hasMemberReceiver(textBeforeCursor: string, calleeStart: number): boolean {
        return textBeforeCursor[previousNonWhitespaceIndex(textBeforeCursor, calleeStart - 1)] === '.';
    }

}
