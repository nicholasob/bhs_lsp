#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
const { TextDocument } = require('vscode-languageserver-textdocument');
const { ScopeManager } = require('../server/out/core/scopeManager');
const { IncludeResolver } = require('../server/out/core/includeResolver');
const { ValidationService } = require('../server/out/core/validator/validationService');
const { DocumentAnalysisStore } = require('../server/out/core/validator/documentAnalysisStore');
const { CompletionService } = require('../server/out/services/completionService');
const { selectFunctionHoverSignatures } = require('../server/out/services/functionHoverService');
const { tokenize } = require('../server/out/core/ast/lexer');
const { parse } = require('../server/out/core/ast/parser');
const {
    baseType,
    elementType,
    formatTypeRef,
    isArrayType,
    parseTypeRef,
    sameType
} = require('../server/out/core/semantic/typeRelations');
const {
    binaryExpressionType,
    unaryExpressionType
} = require('../server/out/core/semantic/expressionTypeRules');
const {
    intrinsicReturnType,
    isCompilerIntrinsic
} = require('../server/out/core/semantic/intrinsics');

function labels(items) {
    return items.map(item => String(item.label).toLowerCase());
}

/** Compile the inline case-insensitive option used by TextMate/Oniguruma in Node. */
function textMateRegExp(pattern) {
    if (pattern.startsWith('(?i)')) {
        return new RegExp(pattern.slice(4), 'i');
    }
    return new RegExp(pattern);
}

function testTopDownFunctionTooling() {
    const signatures = new Map([['native', [{
        name: 'native',
        paramNames: [],
        paramTypes: [],
        returnType: 'int'
    }]]]);
    const scopes = new ScopeManager();
    const completions = new CompletionService(signatures);
    const context = { functionSignatures: signatures, scopeManager: scopes };
    signatures.set('later', [{
        name: 'later',
        paramNames: ['value'],
        paramTypes: ['int'],
        returnType: 'int',
        scriptType: 'scenario',
        declarationStart: 50
    }]);
    scopes.recordSymbol({
        name: 'later',
        type: 'int',
        kind: 'function',
        range: { start: 50, end: 55 }
    });

    const text = `${' '.repeat(10)}later(${ ' '.repeat(33) }later(`;
    const doc = TextDocument.create('file:///tooling.bhs', 'bhs', 1, text);
    assert(!labels(completions.getCompletions(doc, doc.positionAt(10), context)).includes('later'),
        'later function leaked into completion before declaration');
    assert(labels(completions.getCompletions(doc, doc.positionAt(text.length), context)).includes('later'),
        'later function missing from completion after declaration');
    assert.strictEqual(completions.getSignatureHelp(doc, doc.positionAt(16), context).signatures.length, 0,
        'later function leaked into signature help before declaration');
    assert.strictEqual(completions.getSignatureHelp(doc, doc.positionAt(text.length), context).signatures.length, 1,
        'later function missing from signature help after declaration');

    scopes.recordSymbol({
        name: 'native',
        type: 'int',
        kind: 'variable',
        range: { start: 52, end: 58 },
        visibleRange: { start: 52, end: 100 }
    });
    const nativeItems = completions.getCompletions(doc, doc.positionAt(text.length), context)
        .filter(item => String(item.label).toLowerCase() === 'native');
    assert.strictEqual(nativeItems.length, 1, 'shadowed builtin produced duplicate completion items');
    assert(String(nativeItems[0].detail).startsWith('(variable)'),
        'shadowed builtin won over the visible variable completion');
}

function testCategoryAwareFunctionHover() {
    const source = [
        'string scenario choose(int value) { return "scenario"; }',
        'int conquest choose(int value) { return value; }',
        'string scenario first() { return choose(1); }',
        'int conquest second() { return choose(1); }'
    ].join('\n');
    const { program } = parse(tokenize(source).tokens);
    const firstDeclaration = source.indexOf('choose');
    const secondDeclaration = source.indexOf('choose', firstDeclaration + 1);
    const firstCall = source.indexOf('choose(1)');
    const secondCall = source.indexOf('choose(1)', firstCall + 1);
    const signatures = new Map([['choose', [
        {
            name: 'choose', paramNames: ['value'], paramTypes: ['int'],
            returnType: 'string', scriptType: 'scenario', declarationStart: 0
        },
        {
            name: 'choose', paramNames: ['value'], paramTypes: ['int'],
            returnType: 'int', scriptType: 'conquest', declarationStart: secondDeclaration
        }
    ]]]);

    assert.deepStrictEqual(
        selectFunctionHoverSignatures(program, signatures, 'choose', firstDeclaration)
            .map(signature => signature.scriptType),
        ['scenario'],
        'declaration hover should show only the declaration under the cursor');
    assert.deepStrictEqual(
        selectFunctionHoverSignatures(program, signatures, 'choose', secondDeclaration)
            .map(signature => signature.scriptType),
        ['conquest'],
        'later declaration hover should not list earlier category overloads');
    assert.deepStrictEqual(
        selectFunctionHoverSignatures(program, signatures, 'choose', firstCall)
            .map(signature => signature.scriptType),
        ['scenario'],
        'scenario call hover should show scenario overloads only');
    assert.deepStrictEqual(
        selectFunctionHoverSignatures(program, signatures, 'choose', secondCall)
            .map(signature => signature.scriptType),
        ['conquest'],
        'conquest call hover should show conquest overloads only');

    const overloadedSource = [
        'int scenario select(int value) { return value; }',
        'string scenario select(string value) { return value; }',
        'scenario { int result = select(1); }'
    ].join('\n');
    const overloadedProgram = parse(tokenize(overloadedSource).tokens).program;
    const overloadedCall = overloadedSource.lastIndexOf('select');
    const overloadedSignatures = new Map([['select', [
        {
            name: 'select', paramNames: ['value'], paramTypes: ['int'],
            returnType: 'int', scriptType: 'scenario', declarationStart: 0
        },
        {
            name: 'select', paramNames: ['value'], paramTypes: ['string'],
            returnType: 'string', scriptType: 'scenario', declarationStart: 1
        }
    ]]]);
    assert.deepStrictEqual(
        selectFunctionHoverSignatures(
            overloadedProgram,
            overloadedSignatures,
            'select',
            overloadedCall
        ).map(signature => signature.returnType),
        ['int'],
        'call hover should show only the uniquely resolved overload');

    const booleanKeywordSource = [
        'int scenario inspect(int value) { return 1; }',
        'int scenario inspect(bool value) { return 2; }',
        'scenario { int result = inspect(true); }'
    ].join('\n');
    const booleanKeywordProgram = parse(tokenize(booleanKeywordSource).tokens).program;
    const booleanKeywordCall = booleanKeywordSource.lastIndexOf('inspect');
    const booleanKeywordSignatures = new Map([['inspect', [
        {
            name: 'inspect', paramNames: ['value'], paramTypes: ['int'],
            returnType: 'int', scriptType: 'scenario', declarationStart: 0
        },
        {
            name: 'inspect', paramNames: ['value'], paramTypes: ['bool'],
            returnType: 'int', scriptType: 'scenario', declarationStart: 1
        }
    ]]]);
    assert.deepStrictEqual(
        selectFunctionHoverSignatures(
            booleanKeywordProgram,
            booleanKeywordSignatures,
            'inspect',
            booleanKeywordCall
        ).map(signature => signature.paramTypes[0]),
        ['int', 'bool'],
        'boolean keyword hover should show both exact int and bool overload matches');

    const integerArgumentSource = [
        'int scenario inspect(int value) { return 1; }',
        'int scenario inspect(bool value) { return 2; }',
        'scenario { int result = inspect(1); }'
    ].join('\n');
    const integerArgumentProgram = parse(tokenize(integerArgumentSource).tokens).program;
    const integerArgumentCall = integerArgumentSource.lastIndexOf('inspect');
    assert.deepStrictEqual(
        selectFunctionHoverSignatures(
            integerArgumentProgram,
            booleanKeywordSignatures,
            'inspect',
            integerArgumentCall
        ).map(signature => signature.paramTypes[0]),
        ['int', 'bool'],
        'integer argument hover should show both exact int and bool overload matches');

    const parenthesizedRefSource = [
        'int scenario set(ref int value) { return value; }',
        'scenario { int value; int result = set((value)); }'
    ].join('\n');
    const parenthesizedRefProgram = parse(tokenize(parenthesizedRefSource).tokens).program;
    const parenthesizedRefCall = parenthesizedRefSource.lastIndexOf('set');
    const parenthesizedRefSignatures = new Map([['set', [{
        name: 'set', paramNames: ['value'], paramTypes: ['int'],
        paramQualifiers: ['ref'], returnType: 'int', scriptType: 'scenario', declarationStart: 0
    }]]]);
    assert.strictEqual(
        selectFunctionHoverSignatures(
            parenthesizedRefProgram,
            parenthesizedRefSignatures,
            'set',
            parenthesizedRefCall
        ).length,
        1,
        'parenthesized ref argument hover should retain the writable ref overload');
}

async function testImplicitAssignmentHoverAcrossScripts() {
    const source = [
        'string scenario choose(int value) { return "scenario"; }',
        'int conquest choose(int value) { return value; }',
        'scenario { result = choose(1); }',
        'conquest { result = choose(1); }'
    ].join('\n');
    const document = TextDocument.create('file:///implicit-hover.bhs', 'bhs', 1, source);
    const signatures = new Map();
    const validation = new ValidationService(signatures, new IncludeResolver(() => []));
    const analysis = validation.analyzeDocument(document);
    const diagnostics = analysis.diagnostics;
    assert.deepStrictEqual(diagnostics.map(diagnostic => diagnostic.message), [],
        'category-specific implicit assignment fixture should validate cleanly');

    const firstResult = source.indexOf('result');
    const secondResult = source.indexOf('result', firstResult + 1);
    assert.strictEqual(analysis.scopeManager.lookupSymbolAt('result', firstResult)?.type, 'string',
        'first script implicit result should retain its inferred hover type');
    assert.strictEqual(analysis.scopeManager.lookupSymbolAt('result', secondResult)?.type, 'int',
        'second script implicit result should have its own inferred hover type');
}

async function testBooleanKeywordAndExpressionHoverTypes() {
    const source = 'scenario { literal = true; expression = !1; bool declared = true; }';
    const document = TextDocument.create('file:///boolean-hover.bhs', 'bhs', 1, source);
    const signatures = new Map();
    const validation = new ValidationService(signatures, new IncludeResolver(() => []));
    const analysis = validation.analyzeDocument(document);
    const diagnostics = analysis.diagnostics;
    assert.deepStrictEqual(diagnostics.map(diagnostic => diagnostic.message), [],
        'boolean keyword and expression hover fixture should validate cleanly');

    const literal = source.indexOf('literal');
    const expression = source.indexOf('expression');
    const declared = source.indexOf('declared');
    assert.strictEqual(analysis.scopeManager.lookupSymbolAt('literal', literal)?.type, 'int',
        'an implicit variable assigned true should hover as int');
    assert.strictEqual(analysis.scopeManager.lookupSymbolAt('expression', expression)?.type, 'bool',
        'an implicit variable assigned !1 should hover as bool');
    assert.strictEqual(analysis.scopeManager.lookupSymbolAt('declared', declared)?.type, 'bool',
        'an explicitly declared bool should retain its declared hover type');
}

async function testGroupedStructFieldHoverAndRecovery() {
    const source = 'struct Data { int first[], second[][]; };';
    const document = TextDocument.create('file:///grouped-struct.bhs', 'bhs', 1, source);
    const signatures = new Map();
    const validation = new ValidationService(signatures, new IncludeResolver(() => []));
    const analysis = validation.analyzeDocument(document);
    const diagnostics = analysis.diagnostics;

    assert.deepStrictEqual(diagnostics.map(diagnostic => diagnostic.message), [],
        'valid grouped struct fields should parse cleanly');
    assert.strictEqual(analysis.scopeManager.lookupStructField('Data', 'first')?.type, 'int[]',
        'first grouped field should retain its dimensions in hover');
    assert.strictEqual(analysis.scopeManager.lookupStructField('Data', 'second')?.type, 'int[][]',
        'second grouped field should retain its dimensions in hover');

    const malformed = TextDocument.create(
        'file:///malformed-grouped-struct.bhs',
        'bhs',
        1,
        'struct Data { int first[], ; };'
    );
    const malformedDiagnostics = await validation.validateDocument(malformed);
    assert(malformedDiagnostics.some(diagnostic => diagnostic.message.includes('Expected an identifier')),
        'malformed grouped fields should produce a bounded parser diagnostic');
}

function testSharedTypeRelations() {
    assert.deepStrictEqual(parseTypeRef('Data[][]'), { base: 'Data', rank: 2 });
    assert.strictEqual(formatTypeRef({ base: 'Data', rank: 2 }), 'Data[][]');
    assert.strictEqual(elementType('Data[][]'), 'Data[]',
        'element type should remove exactly one array dimension and preserve display casing');
    assert.strictEqual(baseType('Data[][]'), 'data',
        'base type should remove every dimension and canonicalize type identity');
    assert.strictEqual(isArrayType('Data[][]'), true);
    assert.strictEqual(isArrayType('Data'), false);
    assert.strictEqual(sameType('Data[][]', 'data[][]'), true,
        'type identity should be case-insensitive while preserving dimensionality');
    assert.strictEqual(sameType('Data[]', 'Data[][]'), false,
        'different array ranks must not compare as the same type');
}

function testExpressionTypeRules() {
    assert.strictEqual(unaryExpressionType('!', 'int'), 'bool');
    assert.strictEqual(unaryExpressionType('-', 'float'), 'float');
    assert.strictEqual(binaryExpressionType('==', 'int', 'int'), 'bool');
    assert.strictEqual(binaryExpressionType('+', 'string', 'int'), 'string');
    assert.strictEqual(binaryExpressionType('+', 'float', 'int'), 'float');
    assert.strictEqual(binaryExpressionType('*', 'int', 'int'), 'int');
    assert.strictEqual(binaryExpressionType('-', 'string', 'int'), 'anytype');

    assert.strictEqual(intrinsicReturnType('$S'), 'string');
    assert.strictEqual(intrinsicReturnType('$unknown'), undefined);
    assert.strictEqual(isCompilerIntrinsic('$unknown'), true);
    assert.strictEqual(isCompilerIntrinsic('ordinary'), false);
}

function testSymbolRecordingRecovery() {
    const scopes = new ScopeManager();
    scopes.recordSymbol({
        name: 'value', type: 'int', kind: 'variable', range: { start: 1, end: 6 }
    });
    scopes.recordSymbol({
        name: 'VALUE', type: 'string', kind: 'variable', range: { start: 10, end: 15 }
    });

    assert.strictEqual(scopes.lookupSymbolAt('value', 5)?.type, 'int',
        'later declarations must not be visible before their source position');
    assert.strictEqual(scopes.lookupSymbolAt('value', 20)?.type, 'string',
        'all declarations should remain indexed for error-recovery hover');
    assert.strictEqual(scopes.lookupSymbol('value')?.type, 'int',
        'lexical lookup should retain the first declaration in a scope');
}

function testDocumentAnalysisStoreIsolation() {
    const validation = new ValidationService(new Map(), new IncludeResolver(() => []));
    const store = new DocumentAnalysisStore(validation);
    const first = TextDocument.create(
        'file:///first.bhs',
        'bhs',
        1,
        'int scenario firstHelper() { return 1; } scenario { int firstValue; }'
    );
    const second = TextDocument.create('file:///second.bhs', 'bhs', 1, 'scenario { string secondValue; }');

    const firstAnalysis = store.get(first);
    assert.strictEqual(store.get(first), firstAnalysis,
        'an unchanged document version should reuse its analysis snapshot');

    const secondAnalysis = store.get(second);
    assert.notStrictEqual(firstAnalysis.scopeManager, secondAnalysis.scopeManager,
        'different documents must not share mutable scope state');
    assert(firstAnalysis.scopeManager.lookupSymbolAt('firstValue', first.getText().length),
        'first document symbol is missing from its snapshot');
    assert(!secondAnalysis.scopeManager.lookupSymbolAt('firstValue', second.getText().length),
        'a symbol leaked from the first document into the second snapshot');
    assert(firstAnalysis.functionSignatures.has('firsthelper'),
        'first document function is missing from its snapshot');
    assert(!secondAnalysis.functionSignatures.has('firsthelper'),
        'a function signature leaked from the first document into the second snapshot');

    const changed = TextDocument.create(first.uri, 'bhs', 2, 'scenario { int changedValue; }');
    const changedAnalysis = store.get(changed);
    assert.notStrictEqual(changedAnalysis, firstAnalysis,
        'a new document version should replace the cached analysis');
    assert(changedAnalysis.scopeManager.lookupSymbolAt('changedValue', changed.getText().length),
        'the replacement snapshot did not analyze the changed document');

    assert.strictEqual(store.get(first), changedAnalysis,
        'a stale validation request must not replace a newer document snapshot');
}

function testOpenIncludeParseCache() {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bhs-lsp-open-include-'));
    try {
        const includePath = path.join(tempDir, 'library.bhs');
        fs.writeFileSync(includePath, 'scenario { }', 'utf8');
        let text = 'int scenario cached() { return 1; }';
        const resolver = new IncludeResolver(() => [{
            uri: pathToFileURL(includePath).href,
            getText: () => text
        }]);
        resolver.setWorkspaceRoots([pathToFileURL(tempDir).href]);

        const first = resolver.load(pathToFileURL(path.join(tempDir, 'main.bhs')).href, 'library.bhs');
        const second = resolver.load(pathToFileURL(path.join(tempDir, 'main.bhs')).href, 'library.bhs');
        assert.strictEqual(first.kind, 'loaded');
        assert.strictEqual(second.kind, 'loaded');
        assert.strictEqual(first.program, second.program,
            'an unchanged open include should reuse its parsed program');

        text = 'int scenario changed() { return 2; }';
        const changed = resolver.load(pathToFileURL(path.join(tempDir, 'main.bhs')).href, 'library.bhs');
        assert.strictEqual(changed.kind, 'loaded');
        assert.notStrictEqual(changed.program, first.program,
            'an edited open include should replace its parsed program');
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
}

function testCustomArrayTypeGrammar() {
    const grammarPath = path.join(__dirname, '..', 'syntaxes', 'bhs.tmLanguage.json');
    const grammar = JSON.parse(fs.readFileSync(grammarPath, 'utf8'));
    const [customArrayPattern, customScalarPattern] = grammar.repository['custom-types'].patterns;
    const arrayExpression = textMateRegExp(customArrayPattern.match);
    const scalarExpression = textMateRegExp(customScalarPattern.match);

    for (const source of [
        'First[] items)',
        'First[][] items)',
        'First[] [] items)',
        'First[][] scenario create'
    ]) {
        const match = arrayExpression.exec(source);
        assert(match, `custom array type grammar should match ${source}`);
        assert.strictEqual(match[1], 'First', `custom type name should be captured in ${source}`);
    }

    for (const source of [
        'First items[][];',
        'First values[][])',
        'First scenario create',
        'First row[], matrix[][];'
    ]) {
        const match = scalarExpression.exec(source);
        assert(match, `custom scalar type grammar should match ${source}`);
        assert.strictEqual(match[1], 'First', `custom type name should be captured in ${source}`);
    }

    assert.strictEqual(scalarExpression.exec('return item;'), null,
        'return statements must not be colored as custom type declarations');
    assert.strictEqual(scalarExpression.exec('ReTuRn item;'), null,
        'mixed-case return statements must not be colored as custom type declarations');
}

function testArrayCastGrammar() {
    const grammarPath = path.join(__dirname, '..', 'syntaxes', 'bhs.tmLanguage.json');
    const grammar = JSON.parse(fs.readFileSync(grammarPath, 'utf8'));
    const castPattern = grammar.repository.casts.patterns[0];
    const expression = textMateRegExp(castPattern.match);

    for (const source of ['(int[])value', '(int[][])value', '(int[] [])value']) {
        const match = expression.exec(source);
        assert(match, `array cast grammar should match ${source}`);
        assert.strictEqual(match[2].toLowerCase(), 'int');
    }
}

function testCaseSensitiveTriggerGrammar() {
    const grammarPath = path.join(__dirname, '..', 'syntaxes', 'bhs.tmLanguage.json');
    const grammar = JSON.parse(fs.readFileSync(grammarPath, 'utf8'));
    const [declarationPattern, keywordPattern] = grammar.repository['trigger-declarations'].patterns;
    const declarationExpression = textMateRegExp(declarationPattern.match);
    const keywordExpression = textMateRegExp(keywordPattern.match);
    const identifierPattern = grammar.repository.identifiers.patterns[0];
    const identifierExpression = textMateRegExp(identifierPattern.match);
    const topLevelPatterns = grammar.patterns.map(pattern => pattern.include);

    assert(declarationExpression.test('trigger later'),
        'lowercase trigger declarations should receive trigger scopes');
    assert(!declarationExpression.test('TrIgGeR later'),
        'mixed-case trigger identifiers must not receive trigger declaration scopes');
    assert(keywordExpression.test('trigger') && keywordExpression.test('run_once'),
        'lowercase trigger keywords should receive keyword scopes');
    assert(!keywordExpression.test('TrIgGeR') && !keywordExpression.test('RUN_ONCE'),
        'mixed-case trigger identifiers must not receive keyword scopes');
    assert(identifierExpression.test('TrIgGeR'),
        'mixed-case trigger identifiers should receive the ordinary identifier scope');
    assert(topLevelPatterns.indexOf('#trigger-declarations') < topLevelPatterns.indexOf('#identifiers'),
        'trigger patterns must run before the fallback identifier pattern');
}

function testCaseSensitiveStatementGrammar() {
    const grammarPath = path.join(__dirname, '..', 'syntaxes', 'bhs.tmLanguage.json');
    const grammar = JSON.parse(fs.readFileSync(grammarPath, 'utf8'));
    const checks = [
        ['struct-declarations', 0, 'struct Data', 'StRuCt Data'],
        ['labels', 0, 'labels', 'LaBeLs'],
        ['storage-modifiers', 0, 'static', 'StAtIc'],
        ['control-keywords', 0, 'while', 'WhIlE'],
        ['other-keywords', 0, 'include', 'InClUdE'],
        ['constants', 0, 'true', 'TrUe']
    ];

    for (const [repositoryName, patternIndex, lowercase, mixedCase] of checks) {
        const pattern = grammar.repository[repositoryName].patterns[patternIndex];
        const expression = textMateRegExp(pattern.match);
        assert(expression.test(lowercase), `${lowercase} should receive its language scope`);
        assert(!expression.test(mixedCase), `${mixedCase} should receive an identifier scope`);
    }
}

function testSnippetDefinitions() {
    const snippetsPath = path.join(__dirname, '..', 'snippets', 'bhs.json');
    const snippets = JSON.parse(fs.readFileSync(snippetsPath, 'utf8'));
    const scenario = snippets.Scenario.body.join('\n');
    const trigger = snippets['Insert trigger'].body.join('\n');
    const switchStatement = snippets['Insert switch statement'].body.join('\n');

    assert(scenario.includes('${1:// Add constant labels here') &&
        scenario.includes('${2:// Add commands that execute once'),
    'scenario label and run_once comments must use independent tab stops');
    assert(trigger.includes('${2:condition}') && trigger.includes('${3:// Some commands'),
        'trigger condition and body must use independent tab stops');
    assert(switchStatement.includes('case ${2:constant1}:') && !switchStatement.includes('case('),
        'switch snippets must use the game-supported unparenthesized case syntax');
    const structBody = snippets['Insert struct'].body;
    assert(structBody[structBody.length - 1] === '};',
        'struct snippets must include the required trailing semicolon');
    assert(snippets['Insert do while'] && snippets['Insert scenario function'],
        'common declaration and control-flow snippets should remain available');
}

function testNestedBlockCommentGrammar() {
    const grammarPath = path.join(__dirname, '..', 'syntaxes', 'bhs.tmLanguage.json');
    const grammar = JSON.parse(fs.readFileSync(grammarPath, 'utf8'));
    const blockComment = grammar.repository['block-comment'];

    assert.strictEqual(blockComment.begin, '/\\*');
    assert.strictEqual(blockComment.end, '\\*/');
    assert(blockComment.patterns.some(pattern => pattern.include === '#block-comment'),
        'block-comment grammar must recursively include itself');
}

async function testPositionalAndNestedIncludes() {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bhs-lsp-regression-'));
    try {
        fs.writeFileSync(path.join(tempDir, 'leaf.bhs'),
            'int scenario nested(int value) { return value; }', 'utf8');
        fs.writeFileSync(path.join(tempDir, 'library.bhs'),
            'include "leaf.bhs"\nint scenario imported(int value) { return value; }', 'utf8');
        fs.writeFileSync(path.join(tempDir, 'collision.bhs'),
            'struct Data { string includedValue; };', 'utf8');
        fs.writeFileSync(path.join(tempDir, 'semantic-error.bhs'),
            'struct Broken { int first; };\nstruct Broken { int second; };', 'utf8');

        const source = [
            'scenario { int before = imported(1); }',
            'include "library.bhs"',
            'scenario { int after = imported(1); int nestedAfter = nested(1); }',
            'struct Data { int mainValue; };',
            'include "collision.bhs"',
            'include "semantic-error.bhs"',
            'include "library.bhs"'
        ].join('\n');
        const mainPath = path.join(tempDir, 'main.bhs');
        const document = TextDocument.create(pathToFileURL(mainPath).href, 'bhs', 1, source);
        const signatures = new Map();
        const resolver = new IncludeResolver(() => []);
        resolver.setWorkspaceRoots([pathToFileURL(tempDir).href]);
        const validation = new ValidationService(signatures, resolver);
        const analysis = validation.analyzeDocument(document);
        const messages = analysis.diagnostics.map(diagnostic => diagnostic.message);

        assert.strictEqual(messages.filter(message =>
            message.includes("Cannot find function or script 'imported'")).length, 1,
        'include should expose imported only after its textual position');
        assert(!messages.some(message => message.includes("Cannot find function or script 'nested'")),
            'nested include function was not imported');
        assert(!messages.some(message => message.includes("Duplicate definition of struct 'Data'")),
            'an included struct should not conflict with an earlier struct in the including file');
        assert(!messages.some(message => message.includes("Duplicate definition of struct 'Broken'")),
            'semantic errors inside an included file should not be reported on the main file');
        assert.strictEqual((analysis.functionSignatures.get('imported') ?? []).length, 1,
            'including the same function twice should publish one hover signature');
        assert.strictEqual((analysis.functionSignatures.get('nested') ?? []).length, 1,
            'duplicate nested includes should publish one hover signature');
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
}

async function main() {
    testSharedTypeRelations();
    testExpressionTypeRules();
    testSymbolRecordingRecovery();
    testTopDownFunctionTooling();
    testCategoryAwareFunctionHover();
    await testImplicitAssignmentHoverAcrossScripts();
    await testBooleanKeywordAndExpressionHoverTypes();
    await testGroupedStructFieldHoverAndRecovery();
    testDocumentAnalysisStoreIsolation();
    testOpenIncludeParseCache();
    testCustomArrayTypeGrammar();
    testArrayCastGrammar();
    testCaseSensitiveTriggerGrammar();
    testCaseSensitiveStatementGrammar();
    testSnippetDefinitions();
    testNestedBlockCommentGrammar();
    await testPositionalAndNestedIncludes();
    console.log('Service regression checks passed.');
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
