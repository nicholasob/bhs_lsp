#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { TextDocument } = require('vscode-languageserver-textdocument');
const { createBuiltinFunctionSignatures } = require('../server/out/catalog/builtinCatalog');
const { IncludeResolver } = require('../server/out/core/includeResolver');
const { ValidationService } = require('../server/out/core/validator/validationService');

const catalogPath = path.join(__dirname, '..', 'docs', 'game-compile-error-cases.md');
const markdown = fs.readFileSync(catalogPath, 'utf8');
const fragments = Array.from(markdown.matchAll(/```text\r?\n([\s\S]*?)\r?\n```/g), match => match[1]);
const snippets = Array.from(markdown.matchAll(/```bhs\r?\n([\s\S]*?)\r?\n```/g), match => match[1]);

assert(snippets.length > 0, 'The game error catalog contains no BHS snippets.');
assert.strictEqual(fragments.length, snippets.length,
    'Every game error snippet must have one expected diagnostic fragment.');

const validation = new ValidationService(
    createBuiltinFunctionSignatures(),
    new IncludeResolver(() => [])
);

const failures = [];
for (const [index, source] of snippets.entries()) {
    const document = TextDocument.create(
        `file:///game-error-${index + 1}.bhs`,
        'bhs',
        1,
        source
    );
    const diagnostics = validation.validateDocument(document);
    if (!diagnostics.some(item => item.message.includes(fragments[index]))) {
        failures.push({
            index: index + 1,
            expected: fragments[index],
            diagnostics: diagnostics.map(item => item.message)
        });
    }
}

assert.deepStrictEqual(failures, [], `Catalog validation failures: ${JSON.stringify(failures, null, 2)}`);
console.log(`Verified ${snippets.length} game compile-error cases with the production validator.`);
