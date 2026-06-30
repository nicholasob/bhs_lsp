const {
    assert,
    analyzeSource,
    expectClean,
    expectDiagnostic,
    expectOnlyDiagnostic
} = require('./harness');

const struct = 'struct Group { int x; };';
const setter = 'int scenario set_int(ref int value) { value = 5; return value; }';

// Language-wide invariants belong near the harness rather than beside a single
// semantic edge case. Syntax recognition and identifier reservation have
// separate case rules in BHS.
expectClean('script categories and primitive types remain case-insensitive',
    `ScEnArIo { InT Value = 1; }`);
expectDiagnostic('statement syntax and boolean literals are case-sensitive',
    `ScEnArIo { StAtIc InT Value = 1; ` +
    `RuN_OnCe { IF (TrUe) { VALUE += 1; } ElSe { VALUE = 0; } } ` +
    `TrIgGeR Tick (VaLuE > 0) { WhIlE (FaLsE) { BrEaK; } } }`,
    'Missing semicolon');
expectClean('lowercase statement syntax and boolean literals parse consistently',
    `ScEnArIo { static InT Value = 1; ` +
    `run_once { if (true) { VALUE += 1; } else { VALUE = 0; } } ` +
    `trigger Tick (VaLuE > 0) { while (false) { break; } } }`);
const mixedCaseSyntax = [
    ['static qualifier', `scenario { StAtIc int value = 1; }`, 'Missing semicolon'],
    ['run_once statement', `scenario { RuN_OnCe { } }`, "Cannot find name 'RuN_OnCe'"],
    ['if statement', `scenario { IF (true) { } }`, "Cannot find function or script 'IF'"],
    ['true literal', `scenario { int value = TrUe; }`, "Cannot find name 'TrUe'"],
    ['else clause', `scenario { if (true) { } ElSe { } }`, "Cannot find name 'ElSe'"],
    ['trigger statement', `scenario { TrIgGeR Tick(1) { } }`, "Cannot find name 'TrIgGeR'"],
    ['while statement', `scenario { WhIlE(false) { } }`, 'Expected an expression'],
    ['false literal', `scenario { int value = FaLsE; }`, "Cannot find name 'FaLsE'"],
    ['break statement', `scenario { while (false) { BrEaK; } }`, "Cannot find name 'BrEaK'"]
];
for (const [name, source, diagnostic] of mixedCaseSyntax) {
    expectDiagnostic(`mixed-case ${name} is not syntax`, source, diagnostic);
}
const caseInsensitiveReserved = [
    ['int', 'INT'], ['float', 'FLOAT'], ['string', 'STRING'], ['bool', 'BOOL'], ['void', 'VOID'],
    ['scenario', 'SCENARIO'], ['conquest', 'CONQUEST'], ['ai', 'AI'],
    ['for', 'FOR'], ['while', 'WHILE'], ['do', 'DO'], ['switch', 'SWITCH'], ['case', 'CASE']
];
for (const [lower, upper] of caseInsensitiveReserved) {
    expectDiagnostic(`${lower} is reserved as a lowercase identifier`,
        `scenario { int ${lower} = 1; }`, "Cannot use reserved keyword");
    expectDiagnostic(`${upper} is reserved as an uppercase identifier`,
        `scenario { int ${upper} = 1; }`, "Cannot use reserved keyword");
}

const caseSensitiveReserved = [
    ['struct', 'StRuCt'], ['static', 'StAtIc'], ['ref', 'ReF'],
    ['if', 'If'], ['else', 'ElSe'], ['default', 'DeFaUlT'], ['break', 'BrEaK'],
    ['continue', 'CoNtInUe'], ['return', 'ReTuRn'], ['trigger', 'TrIgGeR'],
    ['run_once', 'RuN_OnCe'], ['labels', 'LaBeLs'], ['true', 'TrUe'], ['false', 'FaLsE']
];
for (const [lower, mixed] of caseSensitiveReserved) {
    expectDiagnostic(`${lower} keyword spelling is reserved`,
        `scenario { int ${lower} = 1; }`, "Cannot use reserved keyword");
    expectClean(`${mixed} may be used as an identifier`,
        `scenario { int ${mixed} = 1; }`);
}

for (const name of ['local', 'include', 'anytype', 'real']) {
    expectClean(`${name} is contextual or non-reserved as an identifier`,
        `scenario { int ${name} = 1; }`);
}
expectOnlyDiagnostic('invalid switch region is diagnosed once',
    `scenario { int value = 1; switch (value) { value = 2; case 1: break; } }`,
    "Expected 'case' or 'default' in switch body");

expectClean('local struct field assignment', `${struct} scenario { static Group g; g.x = 5; }`);
expectClean('struct declaration requires and accepts a trailing semicolon',
    `struct Node { int value; };`);
expectDiagnostic('struct declaration without trailing semicolon is invalid',
    `struct Node { int value; }`,
    "Missing semicolon at end of statement");
expectClean('value struct parameter field assignment',
    `${struct} int scenario update(Group g) { g.x = 5; return g.x; }`);
expectClean('value struct parameter field compound assignment',
    `${struct} int scenario update(Group g) { g.x += 5; return g.x; }`);
expectClean('ref struct parameter field literal assignment',
    `${struct} int scenario update(ref Group g) { g.x = 5; return g.x; }`);
expectClean('ref struct parameter field assignment from differently named parameter',
    `${struct} int scenario update(ref Group g, int value) { g.x = value; return g.x; }`);
expectDiagnostic('ref struct parameter field assignment from parameter',
    `${struct} int scenario update(ref Group g, int x) { g.x = x; return g.x; }`,
    "visible variable has the same name");
expectDiagnostic('parenthesized same-name parameter assignment',
    `${struct} int scenario update(ref Group g, int x) { g.x = (x); return g.x; }`,
    "visible variable has the same name");
expectDiagnostic('same-name parameter blocks unrelated expression assignment',
    `${struct} int scenario update(ref Group g, int x) { g.x = 5 + 5; return g.x; }`,
    "visible variable has the same name");
expectDiagnostic('same-name parameter blocks expression using that parameter',
    `${struct} int scenario update(ref Group g, int x) { g.x = x + 5; return g.x; }`,
    "visible variable has the same name");
expectClean('differently named parameter permits unrelated expression assignment',
    `${struct} int scenario update(ref Group g, int z) { g.x = 5 + 5; return g.x; }`);
expectDiagnostic('value struct parameter field assignment from parameter',
    `${struct} int scenario update(Group g, int x) { g.x = x; return g.x; }`,
    "visible variable has the same name");
expectDiagnostic('ref struct parameter field compound assignment',
    `${struct} int scenario update(ref Group g, int x) { g.x += 5; return g.x; }`,
    "visible variable has the same name");
expectClean('ref struct parameter field compound assignment without collision',
    `${struct} int scenario update(ref Group g, int z) { g.x += z; return g.x; }`);
expectDiagnostic('local variable collides with assigned field',
    `${struct} scenario { int x; Group g; g.x = 5; }`,
    "visible variable has the same name");
expectClean('different local variable does not collide with assigned field',
    `${struct} scenario { int z; Group g; g.x = 5; }`);
expectClean('later local variable does not collide with earlier field access',
    `${struct} scenario { Group g; g.x = 5; int x; }`);
expectClean('declarator does not collide inside its own initializer',
    `${struct} scenario { Group g; int x = g.x; }`);
expectDiagnostic('earlier declarator collides with later initializer',
    `${struct} scenario { Group g; int x, result = g.x; }`,
    "visible variable has the same name");
expectClean('later declarator does not collide with earlier initializer',
    `${struct} scenario { Group g; int result = g.x, x; }`);
expectDiagnostic('earlier local variable collides with later field access',
    `${struct} scenario { Group g; int x; g.x = 5; }`,
    "visible variable has the same name");
expectDiagnostic('local variable collides with read field',
    `${struct} scenario { int x; Group g; int result = g.x; }`,
    "visible variable has the same name");
expectDiagnostic('local variable collides with array dot member',
    `scenario { int length; int[] values; int result = values.length; }`,
    "visible variable has the same name");
expectClean('different local variable does not collide with array dot member',
    `scenario { int size; int[] values; int result = values.length; }`);
expectClean('struct field may match builtin function name',
    `struct Group { int native_function; }; ` +
    `scenario { Group g; g.native_function = 5; }`, [{
        name: 'native_function',
        paramNames: [],
        paramTypes: [],
        returnType: 'int'
    }]);
expectDiagnostic('bare struct field cannot match available user function name',
    `int scenario inspect(int value) { return value; } ` +
    `struct Group { int inspect; }; scenario { Group g; int result = g.inspect; }`,
    "Cannot use function or script name 'inspect'");
expectDiagnostic('local struct field increment',
    `${struct} scenario { static Group g; g.x++; }`,
    'dotted members are not incrementable');
expectClean('local struct field as ref argument',
    `${struct} ${setter} scenario { static Group g; int result = set_int(g.x); }`);
expectClean('value struct parameter field as ref argument',
    `${struct} ${setter} int scenario update(Group g) { return set_int(g.x); }`);
expectClean('ref struct parameter field as ref argument',
    `${struct} ${setter} int scenario update(ref Group g) { return set_int(g.x); }`);
expectDiagnostic('array element as ref argument',
    `${setter} scenario { static int[] values; int result = set_int(values[0]); }`,
    "No overload for 'set_int'");
expectDiagnostic('local variable collides with dotted function call',
    `${struct} int scenario inspect(Group g) { return g.x; } ` +
    `scenario { int inspect; Group g; int result = g.inspect(); }`,
    "conflicts with a previously declared function or script");
expectDiagnostic('local variable collides with ordinary function call',
    `int scenario inspect(int value) { return value; } ` +
    `scenario { int inspect; int result = inspect(5); }`,
    "conflicts with a previously declared function or script");
expectDiagnostic('later local declaration conflicts with earlier dotted function',
    `${struct} int scenario inspect(Group g) { return g.x; } ` +
    `scenario { Group g; int result = g.inspect(); int inspect; }`,
    "conflicts with a previously declared function or script");
expectDiagnostic('later local declaration conflicts with earlier ordinary function',
    `int scenario inspect(int value) { return value; } ` +
    `scenario { int result = inspect(5); int inspect; }`,
    "conflicts with a previously declared function or script");
expectClean('different local variable does not collide with dotted function call',
    `${struct} int scenario inspect(Group g) { return g.x; } ` +
    `scenario { int other; Group g; int result = g.inspect(); }`);
expectDiagnostic('typed variable cannot reuse earlier user function name',
    `int scenario inspect(int value) { return value; } scenario { int inspect; }`,
    "conflicts with a previously declared function or script");
expectClean('typed variable may precede same-named user function',
    `scenario { int inspect; } int scenario inspect(int value) { return value; }`);
expectDiagnostic('implicit variable cannot reuse earlier user function name',
    `int scenario inspect(int value) { return value; } scenario { inspect = 5; }`,
    "conflicts with a previously declared function or script");
expectDiagnostic('parameter cannot reuse earlier user function name',
    `int scenario inspect(int value) { return value; } int scenario relay(int inspect) { return 1; }`,
    "conflicts with a previously declared function or script");
expectClean('parameter may match its own function name',
    `int scenario inspect(int inspect) { return inspect; }`);
expectDiagnostic('overload parameter cannot match already available function name',
    `int scenario inspect(int inspect) { return inspect; } ` +
    `string scenario inspect(string inspect) { return inspect; }`,
    "conflicts with a previously declared function or script");
expectDiagnostic('trigger cannot reuse earlier user function name',
    `int scenario inspect(int value) { return value; } ` +
    `scenario { trigger inspect(1) { } }`,
    "conflicts with a previously declared function or script");
expectClean('trigger may precede same-named user function',
    `scenario { trigger inspect(1) { } } ` +
    `int scenario inspect(int value) { return value; }`);
expectDiagnostic('trigger cannot reuse earlier visible variable name',
    `scenario { int inspect; trigger inspect(1) { } }`,
    "conflicts with a visible variable or parameter");
expectDiagnostic('variable cannot reuse earlier trigger name',
    `scenario { trigger inspect(1) { } int inspect; }`,
    "conflicts with a previously declared trigger");
expectDiagnostic('trigger cannot reuse earlier label name',
    `scenario { labels { inspect = 1 } trigger inspect(1) { } }`,
    "conflicts with a previously declared label");
expectDiagnostic('label cannot reuse earlier trigger name',
    `scenario { trigger inspect(1) { } labels { inspect = 1 } }`,
    "conflicts with a previously declared trigger");
expectDiagnostic('label cannot reuse earlier user function name',
    `int scenario inspect(int value) { return value; } scenario { labels { inspect = 1 } }`,
    "conflicts with a previously declared function or script");
expectDiagnostic('user function cannot reuse earlier global label name',
    `scenario { labels { inspect = 1 } } ` +
    `int scenario inspect(int value) { return value; }`,
    "conflicts with a label of the same name");
expectClean('scoped variable may precede same-named user function',
    `scenario { int inspect = 1; } ` +
    `int scenario inspect(int value) { return value; }`);
expectClean('run-once variable may precede same-named user function',
    `scenario { run_once { int inspect = 5; } } ` +
    `int scenario inspect(int value) { return value; }`);
expectDiagnostic('label blocks same-named user function call',
    `int scenario inspect(int value) { return value; } ` +
    `scenario { labels { inspect = 1 } int result = inspect(5); }`,
    "conflicts with a previously declared function or script");
expectClean('typed variable may reuse builtin function name',
    `scenario { int native_function; }`, [{
        name: 'native_function',
        paramNames: [],
        paramTypes: [],
        returnType: 'int'
    }]);
const nativeFunction = [{
    name: 'native_function',
    paramNames: [],
    paramTypes: [],
    returnType: 'int'
}];
expectDiagnostic('visible variable blocks builtin function call',
    `scenario { int native_function; int result = native_function(); }`,
    "visible value or label has the same name",
    nativeFunction);
expectClean('builtin-name variable in separate script does not block call',
    `int scenario first() { int native_function; return 1; } ` +
    `int scenario second() { return native_function(); }`,
    nativeFunction);
expectDiagnostic('later overload is not callable through earlier overload name',
    `int scenario convert(int value) { return value; } ` +
    `scenario { string result = convert("text"); } ` +
    `string scenario convert(string value) { return value; }`,
    "No overload for 'convert'");
expectClean('forward-declared overload is callable before its definition',
    `int scenario convert(int value) { return value; } ` +
    `string scenario convert(string value); ` +
    `scenario { string result = convert("text"); } ` +
    `string scenario convert(string value) { return value; }`);
expectClean('matching prototype and definition share one declaration identity',
    `int scenario helper(int value); ` +
    `int scenario helper(int value) { return value; } ` +
    `scenario { int result = helper(1); }`);
expectDiagnostic('parameter lists reject a trailing comma',
    `int scenario helper(int value,) { return value; }`,
    "Trailing commas are not allowed in parameter lists");
expectDiagnostic('static is not a valid parameter qualifier',
    `int scenario helper(static int value) { return value; }`,
    "only 'ref' is supported");
expectDiagnostic('local is not a valid parameter qualifier',
    `int scenario helper(local int value) { return value; }`,
    "only 'ref' is supported");
expectDiagnostic('named script definitions reject a trailing semicolon',
    `int scenario helper() { return 1; }; scenario { int result = helper(); }`,
    "Script definitions cannot be followed by a semicolon");
expectDiagnostic('anonymous script definitions reject a trailing semicolon',
    `scenario { int value = 1; };`,
    "Script definitions cannot be followed by a semicolon");
expectDiagnostic('prototype constrains the return type of its definition',
    `int scenario helper(int value); ` +
    `string scenario helper(int value) { return "text"; }`,
    "differs only in return type");
assert.strictEqual(
    analyzeSource(
        `int scenario helper(int value); ` +
        `string scenario helper(int value) { return "text"; }`
    ).signatures.get('helper').length,
    1,
    'a return-only mismatch must not be published as a valid overload');
expectClean('value and ref parameter overloads are distinct',
    `int scenario helper(int value) { return value; } ` +
    `int scenario helper(ref int value) { return value; }`);
expectClean('same-typed declarations with different parameter names are distinct',
    `int scenario helper(int value) { return value; } ` +
    `int scenario helper(int other) { return other; }`);
expectDiagnostic('same-typed overloads with different parameter names are ambiguous when called',
    `int scenario helper(int value) { return 1; } ` +
    `int scenario helper(int other) { return 2; } ` +
    `scenario { int result = helper(5); }`,
    "Ambiguous call to 'helper'");
expectDiagnostic('function names and parameter names are case-insensitive for duplicate identity',
    `int scenario Inspect(int value) { return value; } ` +
    `int scenario inspect(int value) { return value; }`,
    "same parameters is already declared");
expectClean('identical declarations in different script categories may coexist',
    `int scenario helper(int value) { return value; } ` +
    `int conquest helper(int value) { return value; }`);
expectClean('calls prefer overloads from the current script category',
    `string scenario choose(int value) { return "scenario"; } ` +
    `int conquest choose(int value) { return value; } ` +
    `string scenario call_scenario() { return choose(1); } ` +
    `int conquest call_conquest() { return choose(1); }`);
expectDiagnostic('calls cannot fall back to another script category',
    `int scenario helper(int value) { return value; } ` +
    `int conquest caller() { return helper(1); }`,
    "Cannot find function or script 'helper'");
expectDiagnostic('return type alone cannot distinguish overloads',
    `int scenario helper(int value) { return value; } ` +
    `string scenario helper(int value) { return "text"; }`,
    "differs only in return type");
expectClean('function calls resolve case-insensitively',
    `int scenario Inspect(int value) { return value; } scenario { int result = inspect(5); }`);
expectClean('later same-typed overload does not affect an earlier call',
    `int scenario helper(int value) { return value; } ` +
    `scenario { int result = helper(5); } ` +
    `int scenario helper(int other) { return other; }`);
expectDiagnostic('prototype with a different parameter name creates an ambiguous overload',
    `int scenario helper(int value); ` +
    `int scenario helper(int other) { return other; } ` +
    `scenario { int result = helper(5); }`,
    "exactly match 2 overloads");
expectDiagnostic('value and ref exact matches are ambiguous for a writable argument',
    `int scenario helper(int value) { return 1; } ` +
    `int scenario helper(ref int value) { return 2; } ` +
    `scenario { int value = 5; int result = helper(value); }`,
    "exactly match 2 overloads");
expectClean('literal argument excludes a ref overload',
    `int scenario helper(int value) { return 1; } ` +
    `int scenario helper(ref int value) { return 2; } ` +
    `scenario { int result = helper(5); }`);
