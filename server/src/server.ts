import {
    createConnection,
    TextDocuments,
    ProposedFeatures,
    InitializeParams,
    TextDocumentSyncKind,
    InitializeResult,
    TextDocumentPositionParams,
    DidChangeConfigurationNotification,
    CompletionItem,
    CodeAction,
    CodeActionKind,
    TextEdit
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { ValidationService } from './core/validator/validationService';
import { DocumentAnalysisStore } from './core/validator/documentAnalysisStore';
import { CompletionService } from './services/completionService';
import { createBuiltinFunctionSignatures } from './catalog/builtinCatalog';
import { ScopeManager } from './core/scopeManager';
import { IncludeResolver } from './core/includeResolver';
import { getFunctionOverloads } from './core/types';
import {
    fieldHoverDocumentation,
    formatFunctionSignature,
    functionCompletionDocumentation,
    overloadedFunctionHoverDocumentation,
    symbolCompletionDocumentation,
    symbolHoverDocumentation
} from './services/markup';
import { selectFunctionHoverSignatures } from './services/functionHoverService';
import {
    IdentifierRange,
    identifierBefore,
    identifierRangeAtOffset,
    previousNonWhitespaceIndex
} from './utilities/text';


// Create connection and core services
const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

const builtinFunctionSignatures = createBuiltinFunctionSignatures();
const TYPED_COMPLETION_KINDS = new Set(['variable', 'parameter', 'struct', 'field']);

// Resolves `include "..."` targets. Reads open buffers via the document manager
// so unsaved edits to libraries are reflected.
const includeResolver = new IncludeResolver(() => documents.all());

// Each analyzed document owns its semantic state. The store reuses that state
// across validation, completion, signature-help, and hover requests.
const validationService = new ValidationService(builtinFunctionSignatures, includeResolver);
const analysisStore = new DocumentAnalysisStore(validationService);
const completionService = new CompletionService(builtinFunctionSignatures);

// Configuration and capabilities
let hasConfigCapability = true;
let hasWorkspaceFolders = false;

interface Settings { 
    validationMethod: boolean;
}

const documentSettings = new Map<string, Thenable<Settings>>();
const defaultSettings: Settings = { validationMethod: true };
const globalSettings = defaultSettings;
const validationTimers = new Map<string, ReturnType<typeof setTimeout>>();
const VALIDATION_DEBOUNCE_MS = 200;

// Workspace roots used to resolve include files. Kept in sync as folders change.
let workspaceFolderUris: string[] = [];

// Initialize connection
connection.onInitialize((params: InitializeParams): InitializeResult => {
    const { capabilities } = params;
    hasConfigCapability = !!capabilities.workspace?.configuration;
    hasWorkspaceFolders = !!capabilities.workspace?.workspaceFolders;

    if (params.workspaceFolders?.length) {
        workspaceFolderUris = params.workspaceFolders.map(f => f.uri);
    } else if (params.rootUri) {
        workspaceFolderUris = [params.rootUri];
    }
    includeResolver.setWorkspaceRoots(workspaceFolderUris);

    return {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,
            // Enhance completion provider configuration
            completionProvider: {
                resolveProvider: true,
                triggerCharacters: ['.', '(', ' '],  // Add space for manual triggering
                allCommitCharacters: ['.', ',', '(', ')', '[', ']', ';', ' ']
            },
            signatureHelpProvider: {
                triggerCharacters: ['(', ','],
                retriggerCharacters: [',']
            },
            hoverProvider: true,
            codeActionProvider: true,
            workspace: hasWorkspaceFolders ? { workspaceFolders: { supported: true } } : undefined
        }
    };
});

connection.onInitialized(() => {
    if (hasConfigCapability) {
        connection.client.register(DidChangeConfigurationNotification.type, undefined);
    }
    if (hasWorkspaceFolders) {
        connection.workspace.onDidChangeWorkspaceFolders(e => {
            const removed = new Set(e.removed.map(f => f.uri));
            workspaceFolderUris = workspaceFolderUris
                .filter(uri => !removed.has(uri))
                .concat(e.added.map(f => f.uri));
            includeResolver.setWorkspaceRoots(workspaceFolderUris);
            analysisStore.clear();
        });
    }
});

// Settings management
function getSettings(uri: string): Thenable<Settings> {
    if (!hasConfigCapability) {
        return Promise.resolve(globalSettings);
    }
    let settings = documentSettings.get(uri);
    if (!settings) {
        settings = connection.workspace.getConfiguration({ scopeUri: uri, section: 'bhs' });
        documentSettings.set(uri, settings);
    }
    return settings;
}

// Document validation
async function validateDocument(doc: TextDocument, expectedVersion = doc.version): Promise<void> {
    const diagnostics = analysisStore.get(doc).diagnostics;
    const current = documents.get(doc.uri);
    if (!current || current.version !== expectedVersion) {
        return;
    }
    connection.sendDiagnostics({ uri: doc.uri, diagnostics });
}

function scheduleValidation(doc: TextDocument): void {
    cancelScheduledValidation(doc.uri);
    const expectedVersion = doc.version;
    validationTimers.set(doc.uri, setTimeout(() => {
        validationTimers.delete(doc.uri);
        validateDocument(doc, expectedVersion);
    }, VALIDATION_DEBOUNCE_MS));
}

function cancelScheduledValidation(uri: string): void {
    const existing = validationTimers.get(uri);
    if (existing) {
        clearTimeout(existing);
        validationTimers.delete(uri);
    }
}

// Event handlers
documents.onDidChangeContent(async change => {
    // Any open document may be an include dependency of another document.
    analysisStore.clear();
    const settings = await getSettings(change.document.uri);
    if (settings.validationMethod) {
        scheduleValidation(change.document);
    } else {
        cancelScheduledValidation(change.document.uri);
    }
});

documents.onDidClose(e => {
    documentSettings.delete(e.document.uri);
    cancelScheduledValidation(e.document.uri);
    analysisStore.clear();
});

// Language features
connection.onCompletion((params: TextDocumentPositionParams) => {
    const doc = documents.get(params.textDocument.uri);
    if (!doc) return [];
    return completionService.getCompletions(doc, params.position, analysisStore.get(doc));
});

connection.onSignatureHelp((params) => {
    const doc = documents.get(params.textDocument.uri);
    if (!doc) {
        return { signatures: [], activeSignature: 0, activeParameter: 0 };
    }
    return completionService.getSignatureHelp(doc, params.position, analysisStore.get(doc));
});

// Enhanced completion item resolve handler
connection.onCompletionResolve(resolveCompletionItem);

function resolveCompletionItem(item: CompletionItem): CompletionItem {
    if (!item.data) return item;

    if (item.data.type === 'function') {
        return resolveFunctionCompletionItem(item);
    }
    if (TYPED_COMPLETION_KINDS.has(item.data.type)) {
        return resolveTypedSymbolCompletionItem(item);
    }
    if (item.data.type === 'label' || item.data.type === 'trigger') {
        return resolveNameOnlyCompletionItem(item);
    }

    return item;
}

function resolveFunctionCompletionItem(item: CompletionItem): CompletionItem {
    const signature = item.data.signature;
    if (!signature) {
        return item;
    }

    item.detail = `(function) ${formatFunctionSignature(signature)}`;
    const builtinOverloads = getFunctionOverloads(builtinFunctionSignatures, String(signature.name));
    const overloads = item.data.overloads ?? (builtinOverloads.length ? builtinOverloads : [signature]);
    item.documentation = functionCompletionDocumentation(signature, overloads);
    return item;
}

function resolveTypedSymbolCompletionItem(item: CompletionItem): CompletionItem {
    const symbolType = item.data.symbolType ?? item.data.type;
    item.detail = `(${item.data.kind}) ${item.label}: ${symbolType}`;
    item.documentation = symbolCompletionDocumentation(item.data.kind, symbolType);
    return item;
}

function resolveNameOnlyCompletionItem(item: CompletionItem): CompletionItem {
    item.detail = `(${item.data.kind}) ${item.label}`;
    item.documentation = symbolCompletionDocumentation(item.data.kind);
    return item;
}

connection.onHover(({ textDocument, position }) => {
    const doc = documents.get(textDocument.uri);
    if (!doc) return null;

    const offset = doc.offsetAt(position);
    const text = doc.getText();
    const analysis = analysisStore.get(doc);
    const identifier = identifierRangeAtOffset(text, offset);
    if (!identifier) return null;

    const word = identifier.text;

    const fieldHover = resolveMemberFieldHover(text, identifier, analysis.scopeManager);
    if (fieldHover) {
        return { contents: fieldHover };
    }

    const symbol = analysis.scopeManager.lookupSymbolAt(word, offset);
    if (symbol && symbol.kind !== 'function') {
        return { contents: symbolHoverDocumentation(symbol) };
    }

    const funcSigs = selectFunctionHoverSignatures(
        analysis.program,
        analysis.functionSignatures,
        word,
        offset,
        (name, position) => analysis.scopeManager.lookupSymbolAt(name, position)?.type
    );
    if (funcSigs.length) {
        return { contents: overloadedFunctionHoverDocumentation(funcSigs, word) };
    }

    if (symbol) {
        return { contents: symbolHoverDocumentation(symbol) };
    }

    return null;
});

function resolveMemberFieldHover(text: string, identifier: IdentifierRange, scopeManager: ScopeManager) {
    const dot = previousNonWhitespaceIndex(text, identifier.start - 1);
    if (text[dot] !== '.') {
        return undefined;
    }

    const receiver = identifierBefore(text, dot);
    if (!receiver) {
        return undefined;
    }

    const receiverSymbol = scopeManager.lookupSymbolAt(receiver.text, receiver.start);
    if (!receiverSymbol) {
        return undefined;
    }

    const field = scopeManager.lookupStructField(receiverSymbol.type, identifier.text);
    return field ? fieldHoverDocumentation(field.name, field.type, receiverSymbol.type) : undefined;
}

connection.onCodeAction(params => {
    const doc = documents.get(params.textDocument.uri);
    if (!doc) return [];

    const actions: CodeAction[] = [];
    for (const diagnostic of params.context.diagnostics) {
        const match = /Did you mean '([^']+)'\\?/.exec(diagnostic.message);
        if (!match) {
            continue;
        }
        const replacement = replacementForSuggestion(doc, diagnostic.range, match[1]);
        actions.push({
            title: `Replace with '${match[1]}'`,
            kind: CodeActionKind.QuickFix,
            diagnostics: [diagnostic],
            edit: {
                changes: {
                    [doc.uri]: [TextEdit.replace(diagnostic.range, replacement)]
                }
            }
        });
    }
    return actions;
});

function replacementForSuggestion(
    doc: TextDocument,
    range: { start: { line: number; character: number }; end: { line: number; character: number } },
    suggestion: string
): string {
    const current = doc.getText(range);
    if (current.length >= 2 && current[0] === '"' && current[current.length - 1] === '"') {
        return `"${suggestion}"`;
    }
    return suggestion;
}

// Start the server
documents.listen(connection);
connection.listen();
