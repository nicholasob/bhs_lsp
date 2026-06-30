#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const HARNESS_PATH = require.resolve('./regression/semantic/harness');
const OUTPUT_PATH = path.join(ROOT, 'docs', 'game-compile-error-cases.md');
const SUITES = [
    ['Declarations And Calls', './regression/semantic/declarations-and-calls'],
    ['Control Flow And Operators', './regression/semantic/control-and-operators'],
    ['Types And Operators', './regression/semantic/types-and-operators'],
    ['Arrays And Declarations', './regression/semantic/arrays-and-declarations']
];

const harness = require(HARNESS_PATH);
const originalExpectDiagnostic = harness.expectDiagnostic;
const originalExpectOnlyDiagnostic = harness.expectOnlyDiagnostic;
const sections = new Map();
let currentSection = '';
let excludedSyntheticCases = 0;

function recordCase(name, source, fragment, builtinSignatures, exact) {
    if (builtinSignatures.length) {
        excludedSyntheticCases++;
        return;
    }
    const cases = sections.get(currentSection) ?? [];
    cases.push({ name, source: source.trim(), fragment, exact });
    sections.set(currentSection, cases);
}

harness.expectDiagnostic = (name, source, fragment, builtinSignatures = []) => {
    originalExpectDiagnostic(name, source, fragment, builtinSignatures);
    recordCase(name, source, fragment, builtinSignatures, false);
};

harness.expectOnlyDiagnostic = (name, source, fragment, builtinSignatures = []) => {
    originalExpectOnlyDiagnostic(name, source, fragment, builtinSignatures);
    recordCase(name, source, fragment, builtinSignatures, true);
};

for (const [section, modulePath] of SUITES) {
    currentSection = section;
    require(modulePath);
}

const total = Array.from(sections.values())
    .reduce((count, cases) => count + cases.length, 0);
const lines = [
    '# BHS Game Compile-Error Cases',
    '',
    `Generated from the executable semantic regression corpus. Total: **${total}** standalone cases.`,
    '',
    'Run every snippet independently. Each is expected to fail compilation and produce an LSP diagnostic.',
    '',
    `Synthetic built-in fixtures excluded because they cannot be compiled directly in game: **${excludedSyntheticCases}**.`,
    ''
];

let caseNumber = 1;
for (const [section, cases] of sections) {
    lines.push(`## ${section}`, '');
    for (const testCase of cases) {
        lines.push(
            `### ${caseNumber}. ${testCase.name}`,
            '',
            testCase.exact
                ? '**Expected:** Exactly one LSP diagnostic containing:'
                : '**Expected:** At least one LSP diagnostic containing:',
            '',
            '```text',
            testCase.fragment,
            '```',
            '',
            '```bhs',
            testCase.source,
            '```',
            ''
        );
        caseNumber++;
    }
}

fs.writeFileSync(OUTPUT_PATH, lines.join('\n'), 'utf8');
console.log(`Wrote ${total} compile-error cases to ${path.relative(ROOT, OUTPUT_PATH)}.`);
