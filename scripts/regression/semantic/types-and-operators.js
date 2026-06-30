const {
    assert,
    analyzeSource,
    expectClean,
    expectDiagnostic,
    expectOnlyDiagnostic
} = require('./harness');

expectClean('script can return a previously declared struct type',
    `struct Data { int value; }; Data scenario create() { Data result; return result; } ` +
    `scenario { Data item = create(); }`);
expectClean('script can return a one-dimensional array',
    `int[] scenario create() { int[] result; return result; } ` +
    `scenario { int[] values = create(); }`);
expectClean('script can return a multidimensional array',
    `int[][] scenario create() { int[][] result; return result; } ` +
    `scenario { int[][] values = create(); }`);
expectDiagnostic('array return dimensions must match',
    `int[][] scenario create() { int[] result; return result; }`,
    "to 'int[][]'");
expectDiagnostic('struct-returning script cannot have an empty body',
    `struct Data { int value; }; Data scenario create() { }`,
    "aggregate-returning scripts require a terminal return statement");
expectDiagnostic('array-returning script cannot have an empty body',
    `int[] scenario create() { }`,
    "aggregate-returning scripts require a terminal return statement");
expectDiagnostic('multidimensional-array-returning script cannot have an empty body',
    `int[][] scenario create() { }`,
    "aggregate-returning scripts require a terminal return statement");
expectDiagnostic('aggregate return in only one branch still permits fallthrough',
    `struct Data { int value; }; Data scenario create(int condition) { ` +
    `if (condition) { Data item; return item; } }`,
    "aggregate-returning scripts require a terminal return statement");
expectDiagnostic('nested returns in both if branches do not satisfy terminal return rule',
    `struct Data { int value; }; Data scenario create(int condition) { ` +
    `Data first; Data second; if (condition) { return first; } else { return second; } }`,
    "aggregate-returning scripts require a terminal return statement");
expectClean('terminal aggregate return satisfies the syntactic return rule',
    `struct Data { int value; }; Data scenario create(int condition) { Data result; ` +
    `if (condition) { result = result; } return result; }`);
expectDiagnostic('identical struct layouts do not distinguish overload signatures',
    `struct First { int value; }; struct Second { int value; }; ` +
    `int scenario inspect(First item) { return 1; } ` +
    `int scenario inspect(Second item) { return 2; }`,
    "Function 'inspect' with the same parameters is already declared");
expectDiagnostic('recursively identical struct layouts do not distinguish overload signatures',
    `struct InnerFirst { int value; }; struct InnerSecond { int value; }; ` +
    `struct First { InnerFirst child; }; struct Second { InnerSecond child; }; ` +
    `int scenario inspect(First item) { return 1; } ` +
    `int scenario inspect(Second item) { return 2; }`,
    "Function 'inspect' with the same parameters is already declared");
expectClean('nested struct layout differences distinguish overload signatures',
    `struct InnerFirst { int value; }; struct InnerSecond { int value; int extra; }; ` +
    `struct First { InnerFirst child; }; struct Second { InnerSecond child; }; ` +
    `int scenario inspect(First item) { return 1; } ` +
    `int scenario inspect(Second item) { return 2; }`);
expectDiagnostic('void and int fields have the same overload layout identity',
    `struct First { void value; }; struct Second { int value; }; ` +
    `int scenario inspect(First item) { return 1; } ` +
    `int scenario inspect(Second item) { return 2; }`,
    "Function 'inspect' with the same parameters is already declared");
assert.strictEqual(
    analyzeSource(
        `struct First { int value; }; struct Second { int value; }; ` +
        `int scenario inspect(First item) { return 1; } ` +
        `int scenario inspect(Second item) { return 2; }`
    ).signatures.get('inspect').length,
    1,
    'structurally duplicate overloads should produce one shared hover signature');
expectClean('different struct layouts distinguish overload signatures',
    `struct First { int value; }; struct Second { int value; int test; }; ` +
    `First scenario create() { First item; return item; } ` +
    `int scenario inspect(First item) { return 1; } ` +
    `int scenario inspect(Second item) { return 2; } ` +
    `scenario { int result = inspect(create()); }`);
expectClean('different struct field names distinguish overload signatures',
    `struct First { int value; }; struct Second { int vaeue; }; ` +
    `First scenario create() { First item; return item; } ` +
    `int scenario inspect(First item) { return 1; } ` +
    `int scenario inspect(Second item) { return 2; } ` +
    `scenario { int result = inspect(create()); }`);
expectClean('arrays preserve nominal struct element types in overload signatures',
    `struct First { int value; }; struct Second { int value; }; ` +
    `int scenario inspect(First[] items) { return 1; } ` +
    `int scenario inspect(Second[] items) { return 2; }`);
expectClean('parentheses preserve a writable ref variable',
    `int scenario set(ref int value) { value = 5; return value; } ` +
    `scenario { int value; int result = set((value)); }`);
expectClean('parentheses preserve an ordinary value argument',
    `int scenario set(int value) { value = 5; return value; } ` +
    `scenario { int value; int result = set((value)); }`);
expectClean('nested parentheses preserve a writable ref field',
    `struct Data { int code; }; int scenario set(ref int value) { value = 5; return value; } ` +
    `scenario { Data item; int result = set(((item.code))); }`);
expectDiagnostic('parentheses do not make a computed value writable for ref',
    `int scenario set(ref int value) { value = 5; return value; } ` +
    `scenario { int first; int second; int result = set((first + second)); }`,
    "No overload for 'set'");
expectDiagnostic('script cannot return a struct type declared later',
    `Data scenario create() { Data result; return result; } struct Data { int value; };`,
    "Unknown type 'Data'");
expectDiagnostic('struct-returning script validates its returned value',
    `struct Data { int value; }; Data scenario create() { return 5; }`,
    "to 'Data'");
expectDiagnostic('binary expression is not an assignment target',
    `scenario { int first = 1; int second = 2; (first + second) = 5; }`,
    "must be a writable variable, field, or array element");
expectDiagnostic('boolean expressions do not implicitly convert to string',
    `scenario { string value = !1; }`,
    "type 'bool' to 'string'");
expectClean('boolean keyword uses integer-to-string conversion for arguments',
    `int scenario inspect(string value) { return 1; } scenario { int result = inspect(true); }`);
expectDiagnostic('boolean expression does not implicitly convert for string arguments',
    `int scenario inspect(string value) { return 1; } scenario { int result = inspect(!1); }`,
    "No overload for 'inspect' matches argument types (bool)");
expectClean('boolean keyword uses integer-to-string conversion in returns',
    `string scenario inspect() { return true; }`);
expectDiagnostic('boolean expression does not implicitly convert in string returns',
    `string scenario inspect() { return !1; }`,
    "type 'bool'");
expectDiagnostic('boolean keyword is ambiguous between integer and boolean overloads',
    `int scenario inspect(int value) { return 1; } int scenario inspect(bool value) { return 2; } ` +
    `scenario { int result = inspect(true); }`,
    "exactly match 2 overloads");
expectDiagnostic('integer argument is ambiguous between integer and boolean overloads',
    `int scenario inspect(int value) { return 1; } int scenario inspect(bool value) { return 2; } ` +
    `scenario { int result = inspect(1); }`,
    "exactly match 2 overloads");
expectClean('boolean expression selects only a boolean overload',
    `int scenario inspect(int value) { return 1; } int scenario inspect(bool value) { return 2; } ` +
    `scenario { int result = inspect(!1); }`);
expectClean('struct values support equality comparisons',
    `struct Data { int value; }; scenario { Data first; Data second; ` +
    `bool equal = first == second; bool different = first != second; }`);
expectDiagnostic('struct equality rejects a scalar operand',
    `struct Data { int value; }; scenario { Data item; bool result = item == 0; }`,
    "requires matching aggregate operand types");
expectDiagnostic('struct equality requires the same nominal struct type',
    `struct First { int value; }; struct Second { int value; }; ` +
    `scenario { First first; Second second; bool result = first == second; }`,
    "requires matching aggregate operand types");
expectDiagnostic('struct equality rejects an array operand',
    `struct Data { int value; }; scenario { Data item; Data[] items; ` +
    `bool result = item != items; }`,
    "requires matching aggregate operand types");
expectClean('array values support equality comparisons',
    `scenario { int[] first; int[] second; ` +
    `bool equal = first == second; bool different = first != second; }`);
expectDiagnostic('array values do not support relational comparisons',
    `scenario { int[] first; int[] second; bool result = first < second; }`,
    "not valid for aggregate operands");
expectDiagnostic('multidimensional arrays do not support relational comparisons',
    `scenario { int[][] first; int[][] second; bool result = first >= second; }`,
    "not valid for aggregate operands");
expectDiagnostic('struct values do not support relational comparisons',
    `struct Data { int value; }; scenario { Data first; Data second; ` +
    `bool result = first < second; }`,
    "not valid for aggregate operands");
expectDiagnostic('nested struct values do not support relational comparisons',
    `struct Inner { int value; }; struct Outer { Inner child; }; ` +
    `scenario { Outer first; Outer second; bool result = first >= second; }`,
    "not valid for aggregate operands");
expectDiagnostic('array equality requires matching dimensions',
    `scenario { int[] first; int[][] second; bool result = first == second; }`,
    "requires matching aggregate operand types");
expectDiagnostic('array inequality requires matching element types',
    `scenario { int[] first; float[] second; bool result = first != second; }`,
    "requires matching aggregate operand types");
expectDiagnostic('array equality rejects a scalar operand',
    `scenario { int[] values; bool result = values == 0; }`,
    "requires matching aggregate operand types");
expectClean('adjacent string literals concatenate at compile time',
    `scenario { string value = "first" "second"; }`);
expectClean('multiple adjacent string literals form one expression',
    `scenario { string value = "first" " " "second"; }`);
expectClean('adjacent string literal is a string function argument',
    `int scenario inspect(string value) { return 1; } ` +
    `scenario { int result = inspect("first" "second"); }`);
expectDiagnostic('adjacent and combined switch strings are duplicate constants',
    `scenario { string value = "firstsecond"; switch (value) { ` +
    `case "first" "second": break; case "firstsecond": break; } }`,
    "Duplicate case statement");
expectDiagnostic('string concatenation rejects struct values',
    `struct Data { int value; }; scenario { Data item; string result = "item=" + item; }`,
    "not valid for aggregate or void operands");
expectDiagnostic('addition rejects a struct in either operand position',
    `struct Data { int value; }; scenario { Data item; first = item + 1; second = 1 + item; }`,
    "not valid for aggregate or void operands");
expectDiagnostic('addition rejects an array in either operand position',
    `scenario { int[] values; first = values + 1; second = "x" + values; }`,
    "not valid for aggregate or void operands");
expectDiagnostic('addition rejects void in either operand position',
    `void scenario nothing() { } scenario { first = nothing() + 1; second = "x" + nothing(); }`,
    "not valid for aggregate or void operands");
expectDiagnostic('subtraction rejects aggregate operands',
    `struct Data { int value; }; scenario { Data item; result = item - 1; }`,
    "Operator '-' is not valid for aggregate or void operands");
expectDiagnostic('multiplication rejects aggregate operands',
    `scenario { int[] values; result = 1 * values; }`,
    "Operator '*' is not valid for aggregate or void operands");
expectDiagnostic('division rejects void operands',
    `void scenario nothing() { } scenario { result = nothing() / 1; }`,
    "Operator '/' is not valid for aggregate or void operands");
expectDiagnostic('power rejects aggregate operands',
    `struct Data { int value; }; scenario { Data item; result = 1 ^ item; }`,
    "Operator '^' is not valid for aggregate or void operands");
expectDiagnostic('modulo rejects aggregate operands',
    `scenario { int[] values; result = values % 1; }`,
    "Operator '%' is not valid for aggregate or void operands");
expectDiagnostic('string plus-equals rejects struct values',
    `struct Data { int value; }; scenario { Data item; string result; result += item; }`,
    "not valid for aggregate or void operands");
expectDiagnostic('string plus-equals rejects array values',
    `scenario { int[] values; string result; result += values; }`,
    "not valid for aggregate or void operands");
expectDiagnostic('string plus-equals rejects void values',
    `void scenario nothing() { } scenario { string result; result += nothing(); }`,
    "not valid for aggregate or void operands");
expectDiagnostic('compound addition rejects struct sources for scalar targets',
    `struct Data { int value; }; scenario { int result = 1; Data item; result += item; }`,
    "not valid for aggregate or void operands");
expectDiagnostic('compound arithmetic rejects array sources for scalar targets',
    `scenario { int result = 1; int[] values; result *= values; }`,
    "not valid for aggregate or void operands");
expectDiagnostic('compound arithmetic rejects scalar sources for struct targets',
    `struct Data { int value; }; scenario { Data item; item -= 1; }`,
    "not valid for aggregate or void operands");
expectDiagnostic('compound arithmetic rejects scalar sources for array targets',
    `scenario { int[] values; values /= 1; }`,
    "not valid for aggregate or void operands");
expectDiagnostic('compound power rejects aggregate operands',
    `struct Data { int value; }; scenario { int result = 1; Data item; result ^= item; }`,
    "not valid for aggregate or void operands");
expectDiagnostic('compound shifts reject aggregate operands',
    `scenario { int result = 1; int[] values; result <<= values; }`,
    "not valid for aggregate or void operands");
expectDiagnostic('compound operators reject void operands',
    `void scenario nothing() { } scenario { int result = 1; result += nothing(); }`,
    "not valid for aggregate or void operands");
expectClean('character literal remains valid in switch case',
    `scenario { int value = 65; switch (value) { case 'A': break; } }`);
expectDiagnostic('character and integer cases compare by character code',
    `scenario { int value = 65; switch (value) { case 'A': break; case 65: break; } }`,
    "Duplicate case statement '65'");
expectClean('escaped zero character is distinct from numeric zero',
    `scenario { int value = 0; switch (value) { case '\\0': break; case 0: break; } }`);
expectClean('escaped b character is distinct from numeric backspace code',
    `scenario { int value = 8; switch (value) { case '\\b': break; case 8: break; } }`);
expectClean('matching string literal remains valid in switch case',
    `scenario { string value = "first"; switch (value) { case "first": break; } }`);
expectClean('matching float literal remains valid in switch case',
    `scenario { float value = 1.5; switch (value) { case 1.5: break; } }`);
expectClean('boolean literal is valid under an integer switch',
    `scenario { int value = 1; switch (value) { case true: break; } }`);
expectClean('integer literal is valid under a boolean switch',
    `scenario { bool value = true; switch (value) { case 1: break; } }`);
expectDiagnostic('true and one are duplicate boolean-switch cases',
    `scenario { bool value = true; switch (value) { case true: break; case 1: break; } }`,
    "Duplicate case statement '1'");
expectDiagnostic('true and one are duplicate integer cases',
    `scenario { int value = 1; switch (value) { case true: break; case 1: break; } }`,
    "Duplicate case statement '1'");
expectDiagnostic('false and zero are duplicate integer cases',
    `scenario { int value = 0; switch (value) { case false: break; case 0: break; } }`,
    "Duplicate case statement '0'");
expectDiagnostic('boolean label and integer literal compare by integer value',
    `scenario { labels { truth = true } int value = 1; ` +
    `switch (value) { case truth: break; case 1: break; } }`,
    "Duplicate case statement '1'");
expectDiagnostic('implicit label continues a preceding explicit integer value',
    `scenario { labels { first = 5, second } int value = 6; ` +
    `switch (value) { case second: break; case 6: break; } }`,
    "Duplicate case statement '6'");
expectDiagnostic('implicit label sequence continues across multiple entries',
    `scenario { labels { first = 5, second, third } int value = 7; ` +
    `switch (value) { case third: break; case 7: break; } }`,
    "Duplicate case statement '7'");
expectClean('implicit label continues a preceding explicit float value',
    `scenario { labels { first = 1.5, second } float value = 2.5; ` +
    `switch (value) { case second: break; } }`);
expectDiagnostic('implicit label continues a boolean value as an integer',
    `scenario { labels { first = true, second } int value = 2; ` +
    `switch (value) { case second: break; case 2: break; } }`,
    "Duplicate case statement '2'");
expectDiagnostic('implicit label continues a character value as an integer',
    `scenario { labels { first = 'A', second } int value = 66; ` +
    `switch (value) { case second: break; case 66: break; } }`,
    "Duplicate case statement '66'");
expectClean('leading unassigned label does not default to zero',
    `scenario { labels { target } int value = 0; ` +
    `switch (value) { case target: break; case 0: break; } }`);
expectClean('trailing-dot float literal is valid',
    `scenario { float value = 1.; switch (value) { case 1.: break; } }`);
expectClean('scientific notation is a valid float literal',
    `scenario { float value = 1e3; }`);
expectClean('scientific notation supports decimal mantissa and signed exponent',
    `scenario { float first = 1.5E-2; float second = .5e+2; }`);
expectClean('hexadecimal notation is a valid integer literal',
    `scenario { int lower = 0x10; int upper = 0X2A; }`);
expectClean('hexadecimal digits containing E remain integer literals',
    `scenario { int value = 0xFE; }`);
expectDiagnostic('equivalent hexadecimal and decimal switch cases are duplicates',
    `scenario { int value = 16; switch (value) { case 0x10: break; case 16: break; } }`,
    "Duplicate case statement '16'");
