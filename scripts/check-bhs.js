#!/usr/bin/env node
/*
 * Command-line BHS validator — runs the language server's validation pipeline
 * over a .bhs file (or an inline snippet) and prints the diagnostics, without
 * launching VS Code. Build first with `npm run compile` (or `tsc -b`).
 *
 * Usage:
 *   node scripts/check-bhs.js path/to/file.bhs
 *   node scripts/check-bhs.js -e "scenario { run_once { int x = 5 } }"
 */

const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'server', 'out');
let TextDocument, createBuiltinFunctionSignatures, ValidationService, IncludeResolver;
try {
    ({ TextDocument } = require('vscode-languageserver-textdocument'));
    ({ createBuiltinFunctionSignatures } = require(path.join(OUT, 'catalog/builtinCatalog')));
    ({ ValidationService } = require(path.join(OUT, 'core/validator/validationService')));
    ({ IncludeResolver } = require(path.join(OUT, 'core/includeResolver')));
} catch (e) {
    console.error('Could not load the built server. Run `npm run compile` first.\n', e.message);
    process.exit(2);
}

const args = process.argv.slice(2);
let source, label, fileForUri;
if (args[0] === '-e') {
    source = args.slice(1).join(' ');
    label = '<inline>';
    fileForUri = path.join(process.cwd(), 'inline.bhs');
} else if (args[0]) {
    fileForUri = path.resolve(args[0]);
    source = fs.readFileSync(fileForUri, 'utf8');
    label = args[0];
} else {
    console.error('Usage: node scripts/check-bhs.js <file.bhs> | -e "<code>"');
    process.exit(2);
}

(async () => {
    const service = new ValidationService(
        createBuiltinFunctionSignatures(),
        new IncludeResolver(() => [])   // includes resolve from disk relative to the file
    );
    const uri = 'file:///' + fileForUri.replace(/\\/g, '/');
    const doc = TextDocument.create(uri, 'bhs', 1, source);
    const diags = await service.validateDocument(doc);

    if (diags.length === 0) {
        console.log(`✓ ${label}: no problems`);
        return;
    }
    console.log(`${label}: ${diags.length} problem(s)`);
    for (const d of diags) {
        const sev = d.severity === 1 ? 'error' : d.severity === 2 ? 'warning' : d.severity === 3 ? 'info' : 'hint';
        const { line, character } = d.range.start;
        console.log(`  ${line + 1}:${character + 1}\t${sev}\t${d.message}`);
    }
    process.exitCode = diags.some(d => d.severity === 1) ? 1 : 0;
})();
