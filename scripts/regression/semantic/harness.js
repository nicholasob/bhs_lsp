const assert = require('assert');
const { tokenize } = require('../../../server/out/core/ast/lexer');
const { parse } = require('../../../server/out/core/ast/parser');
const { Analyzer } = require('../../../server/out/core/ast/analyzer');
const { ScopeManager } = require('../../../server/out/core/scopeManager');

function analyzeSource(source, builtinSignatures = []) {
    const signatures = new Map();
    for (const signature of builtinSignatures) {
        signatures.set(signature.name.toLowerCase(), [signature]);
    }
    const lexed = tokenize(source);
    const parsed = parse(lexed.tokens);
    const analyzer = new Analyzer(
        signatures,
        new ScopeManager(),
        new Set(signatures.keys()),
        new Set(),
        [],
        false
    );
    const diagnostics = [...lexed.diagnostics, ...parsed.diagnostics, ...analyzer.analyze(parsed.program)]
        .map(diagnostic => diagnostic.message);
    return { diagnostics, signatures };
}

function diagnosticsFor(source, builtinSignatures = []) {
    return analyzeSource(source, builtinSignatures).diagnostics;
}

function expectClean(name, source, builtinSignatures = []) {
    assert.deepStrictEqual(diagnosticsFor(source, builtinSignatures), [], name);
}

function expectDiagnostic(name, source, fragment, builtinSignatures = []) {
    const diagnostics = diagnosticsFor(source, builtinSignatures);
    assert(
        diagnostics.some(message => message.includes(fragment)),
        `${name}: expected diagnostic containing ${JSON.stringify(fragment)}, got ${JSON.stringify(diagnostics)}`
    );
}

function expectOnlyDiagnostic(name, source, fragment, builtinSignatures = []) {
    const diagnostics = diagnosticsFor(source, builtinSignatures);
    assert.strictEqual(
        diagnostics.length,
        1,
        `${name}: expected exactly one diagnostic, got ${JSON.stringify(diagnostics)}`
    );
    assert(
        diagnostics[0].includes(fragment),
        `${name}: expected diagnostic containing ${JSON.stringify(fragment)}, got ${JSON.stringify(diagnostics)}`
    );
}

module.exports = {
    analyzeSource,
    assert,
    expectClean,
    expectDiagnostic,
    expectOnlyDiagnostic
};
