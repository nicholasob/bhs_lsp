const {
    assert,
    analyzeSource,
    expectClean,
    expectDiagnostic,
    expectOnlyDiagnostic
} = require('./harness');

expectClean('multidimensional primitive array declaration is valid',
    `scenario { int[][] values; }`);
expectClean('array dimensions may follow the variable name',
    `scenario { int values[][]; int value = values[0][0]; }`);
expectClean('array dimensions may follow a parameter name',
    `int scenario inspect(int values[][]) { return values[0][0]; } ` +
    `scenario { int matrix[][]; int result = inspect(matrix); }`);
expectClean('ref array parameter retains trailing dimensions',
    `int scenario inspect(ref int values[][]) { return values[0][0]; } ` +
    `scenario { int matrix[][]; int result = inspect(matrix); }`);
expectClean('overloads distinguish trailing parameter dimensions',
    `int scenario inspect(int values[]) { return 1; } ` +
    `int scenario inspect(int values[][]) { return 2; } ` +
    `scenario { int matrix[][]; int result = inspect(matrix); }`);
expectClean('array may be a dotted function receiver',
    `int scenario inspect(int[] item, int value) { return value; } ` +
    `scenario { int[] item; int result = item.inspect(5); }`);
expectClean('array receiver dimensions select the matching overload',
    `int scenario inspect(int[] item, int value) { return 1; } ` +
    `int scenario inspect(int[][] item, int value) { return 2; } ` +
    `scenario { int[][] item; int result = item.inspect(5); }`);
expectDiagnostic('array receiver requires a compatible first parameter',
    `int scenario inspect(string item, int value) { return value; } ` +
    `scenario { int[] item; int result = item.inspect(5); }`,
    "Invalid receiver call to 'inspect'");
expectClean('each declarator retains its own trailing array dimensions',
    `scenario { int scalar, row[], matrix[][]; int value = scalar; ` +
    `int[] selectedRow = row; int[][] selectedMatrix = matrix; }`);
expectDiagnostic('trailing dimensions participate in assignment checks',
    `scenario { int row[]; int matrix[][]; row = matrix; }`,
    "explicit cast is required");
expectClean('multidimensional arrays lose one dimension per index',
    `scenario { int[][] values; int[] row = values[0]; int value = values[0][0]; }`);
expectDiagnostic('returned array value cannot be indexed',
    `int[] scenario create() { int[] result; return result; } ` +
    `scenario { int value = create()[0]; }`,
    "Array index may only be used on an array variable");
expectDiagnostic('returned array value cannot be indexed for assignment',
    `int[] scenario create() { int[] result; return result; } ` +
    `scenario { create()[0] = 5; }`,
    "Array index may only be used on an array variable");
expectClean('dot member can be read from a returned array value',
    `int[] scenario create() { int[] result; return result; } ` +
    `scenario { int result = create().length; }`);
expectClean('parentheses preserve an array variable for indexing',
    `scenario { int[] values; int value = ((values))[0]; }`);
expectClean('three-dimensional arrays retain intermediate array types',
    `scenario { int[][][] values; int[][] plane = values[0]; int[] row = values[0][0]; ` +
    `int value = values[0][0][0]; }`);
expectDiagnostic('array assignment requires the same number of dimensions',
    `scenario { int[][] values; int[] row; row = values; }`,
    "explicit cast is required");
expectClean('multidimensional primitive array is valid as a struct field',
    `struct Data { int[][] values; }; scenario { Data item; int value = item.values[0][0]; }`);
expectClean('previously declared struct is valid as a multidimensional struct field',
    `struct First { int value; }; struct Container { First values[][]; }; ` +
    `scenario { Container holder; holder.values[0][0].value = 5; }`);
expectDiagnostic('struct cannot contain a scalar field of its own type',
    `struct Node { Node next; int value; };`,
    "cannot contain a field of its own type");
expectDiagnostic('struct cannot contain an array field of its own type',
    `struct Node { Node[][] children; int value; };`,
    "cannot contain a field of its own type");
expectDiagnostic('later struct type is unavailable to an earlier struct field',
    `struct Container { First values[][]; }; struct First { int value; };`,
    "Unknown type 'First[][]'");
expectClean('array dimensions may follow a struct field name',
    `struct Data { int values[][]; }; scenario { Data item; int value = item.values[0][0]; }`);
expectDiagnostic('trailing void array struct field remains invalid',
    `struct Data { void values[][]; };`,
    "cannot have array type 'void[]'");
expectClean('comma-separated struct fields retain individual dimensions',
    `struct Data { int first[], second[][]; }; scenario { Data item; ` +
    `int[] first = item.first; int[][] second = item.second; }`);
expectDiagnostic('malformed comma-separated struct fields recover without parser non-progress',
    `struct Data { int first[], ; };`,
    'Expected an identifier');
expectClean('overloads distinguish array dimensionality',
    `int scenario inspect(int[] row) { return 1; } ` +
    `int scenario inspect(int[][] matrix) { return 2; } ` +
    `scenario { int[][] values; int result = inspect(values); }`);
expectClean('overloads distinguish scalar and multidimensional array parameters',
    `int scenario inspect(int value) { return 1; } ` +
    `int scenario inspect(int[][] matrix) { return 2; } ` +
    `scenario { int[][] values; int result = inspect(values); }`);
expectDiagnostic('array argument requires matching dimensionality',
    `int scenario inspect(int[] row) { return 1; } ` +
    `scenario { int[][] values; int result = inspect(values); }`,
    "No overload for 'inspect' matches argument types (int[][])");
expectClean('ref overload selects the exact array dimensionality',
    `int scenario inspect(ref int[] row) { return 1; } ` +
    `int scenario inspect(ref int[][] matrix) { return 2; } ` +
    `scenario { int[][] values; int result = inspect(values); }`);
expectDiagnostic('struct value cannot be used as a condition',
    `struct Data { int value; }; scenario { Data item; if (item) result = 1; }`,
    "cannot be evaluated as a boolean value");
expectDiagnostic('array value cannot be used as a condition',
    `scenario { int[] values; if (values) result = 1; }`,
    "cannot be evaluated as a boolean value");
expectClean('single unbraced if body may assign an existing variable',
    `scenario { int condition = 1; int result; if (condition) result = 1; }`);
expectDiagnostic('implicit declaration cannot be an unbraced if body',
    `scenario { int condition = 1; if (condition) result = 1; }`,
    'must be enclosed in braces');
expectDiagnostic('typed declaration cannot be an unbraced if body',
    `scenario { int condition = 1; if (condition) int result = 1; }`,
    'must be enclosed in braces');
expectClean('unbraced if and else bodies may assign an existing variable',
    `scenario { int condition = 1; int result; if (condition) result = 1; else result = 2; }`);
expectClean('unbraced if body may precede a braced else body',
    `scenario { int condition = 0; int value = 0; ` +
    `if (condition) value = 1; else { value = 2; } }`);
expectDiagnostic('typed declaration cannot be an unbraced else body',
    `scenario { int condition = 1; int result; ` +
    `if (condition) result = 1; else int alternate = 2; }`,
    'must be enclosed in braces');
expectDiagnostic('implicit declaration cannot be an unbraced else body',
    `scenario { int condition = 1; int result; ` +
    `if (condition) result = 1; else alternate = 2; }`,
    'must be enclosed in braces');
expectClean('final else body may be an unbraced executable statement',
    `scenario { int first = 0; int second = 1; ` +
    `int result; if (first) { result = 1; } else if (second) { result = 2; } else result = 3; }`);
expectClean('braced if else remains valid',
    `scenario { int condition = 1; if (condition) { result = 1; } else { result = 2; } }`);
expectClean('else if chain may connect braced branch bodies',
    `scenario { int first = 0; int second = 1; ` +
    `if (first) { result = 1; } else if (second) { result = 2; } else { result = 3; } }`);
expectClean('else if chain may use unbraced executable bodies',
    `scenario { int first = 0; int second = 1; int result; ` +
    `if (first) result = 1; else if (second) result = 2; else result = 3; }`);
expectClean('unbraced while body may assign an existing variable',
    `scenario { int i = 0; while (i < 1) i = i + 1; }`);
expectDiagnostic('implicit declaration cannot be an unbraced while body',
    `scenario { int condition = 1; while (condition) result = 1; }`,
    'must be enclosed in braces');
expectDiagnostic('typed declaration cannot be an unbraced while body',
    `scenario { int condition = 1; while (condition) int result = 1; }`,
    'must be enclosed in braces');
expectClean('unbraced for body may assign an existing variable',
    `scenario { int i; int result; for (i = 0; i < 1; i++) result = i; }`);
expectDiagnostic('implicit declaration cannot be an unbraced for body',
    `scenario { int i; for (i = 0; i < 1; i++) result = i; }`,
    'must be enclosed in braces');
expectDiagnostic('typed declaration cannot be an unbraced for body',
    `scenario { int i; for (i = 0; i < 1; i++) int result = i; }`,
    'must be enclosed in braces');
expectClean('unbraced do body may assign an existing variable',
    `scenario { int i = 0; do i = i + 1; while (i < 1); }`);
expectDiagnostic('implicit declaration cannot be an unbraced do body',
    `scenario { int condition = 0; do result = 1; while (condition); }`,
    'must be enclosed in braces');
expectDiagnostic('typed declaration cannot be an unbraced do body',
    `scenario { int condition = 0; do int result = 1; while (condition); }`,
    'must be enclosed in braces');
expectClean('for-loop initializer may be empty',
    `scenario { int i = 0; for (; i < 5; i++) { } }`);
expectDiagnostic('for-loop condition cannot be empty',
    `scenario { int i; for (i = 0; ; i++) { } }`,
    'condition clause of a for-loop cannot be empty');
expectClean('for-loop update may be empty',
    `scenario { int i; for (i = 0; i < 5; ) { } }`);
expectClean('for-loop initializer and update may both be empty',
    `scenario { int i = 0; for (; i < 5; ) { i++; } }`);
expectDiagnostic('for-loop condition remains required when update is present',
    `scenario { int i = 0; for (; ; i++) { } }`,
    'condition clause of a for-loop cannot be empty');
expectClean('for-loop with all clauses remains valid',
    `scenario { int i; for (i = 0; i < 5; i++) { } }`);
expectDiagnostic('for-loop initializer does not support comma expressions',
    `scenario { int i; int j; for (i = 0, j = 0; i < 5; i++) { } }`,
    "Expected ';' in for-clause");
expectDiagnostic('for-loop update does not support comma expressions',
    `scenario { int i; int j; for (i = 0; i < 5; i++, j++) { } }`,
    "Expected ')' after for-clause");
expectDiagnostic('modulo is invalid for float values',
    `scenario { float result = 5.5 % 2.0; }`,
    "Operator '%' is not valid for float values");
expectDiagnostic('modulo assignment is invalid for float values',
    `scenario { float value = 5.5; value %= 2.0; }`,
    "Operator '%=' is not valid for float values");
expectDiagnostic('non-void script cannot use bare return',
    `int scenario helper() { return; }`,
    "expected to return a value of 'int'");
expectClean('void script may use bare return',
    `void scenario helper() { return; }`);
expectDiagnostic('untyped script cannot use bare return',
    `scenario helper() { return; }`,
    "expected to return a value of 'int'");
expectDiagnostic('untyped script defaults its return type to int',
    `scenario helper() { return 1.5; }`,
    "script that returns 'int'");
expectClean('untyped script accepts boolean literals as integer-backed returns',
    `scenario helper() { return true; } scenario { bool value = helper(); }`);
assert.strictEqual(
    analyzeSource(`scenario helper() { return true; }`).signatures.get('helper')[0].returnType,
    'anytype',
    'untyped script signatures remain anytype'
);
expectDiagnostic('anytype cannot be an explicit script return type',
    `anytype scenario helper() { return true; }`,
    "cannot be written explicitly");
expectDiagnostic('anytype cannot be an explicit parameter type',
    `int scenario helper(anytype value) { return 1; }`,
    "cannot be written explicitly");
expectDiagnostic('untyped parameters default to int for calls',
    `int scenario helper(value) { return 1; } scenario { int result = helper("text"); }`,
    "No overload for 'helper'");
expectDiagnostic('anytype cannot be a struct field type',
    `struct Data { anytype value; };`,
    "cannot be written explicitly");
expectDiagnostic('anytype cannot be an array element type',
    `scenario { anytype[] values; }`,
    "cannot be written explicitly");
expectDiagnostic('anytype cannot be an explicit cast target',
    `scenario { int value = (anytype)5; }`,
    "cannot be used in an explicit cast");
expectClean('anytype is valid as a function identifier',
    `int scenario anytype() { return 1; } scenario { int value = anytype(); }`);
expectDiagnostic('concrete datatype remains reserved as a function identifier',
    `int scenario int() { return 1; }`,
    "reserved keyword 'int'");
expectDiagnostic('bool datatype remains reserved as a function identifier',
    `int scenario bool() { return 1; }`,
    "reserved keyword 'bool'");
expectDiagnostic('variable name cannot case-insensitively match an available struct type',
    `struct Data { int value; }; scenario { Data data; }`,
    "conflicts with struct type");
expectClean('variable may use a name distinct from its struct type',
    `struct Data { int value; }; scenario { Data dataNew; }`);
expectDiagnostic('parameter name cannot case-insensitively match an available struct type',
    `struct Data { int value; }; int scenario inspect(int data) { return data; }`,
    "conflicts with struct type");
expectClean('parameter may use a name distinct from an available struct type',
    `struct Data { int value; }; int scenario inspect(int dataNew) { return dataNew; }`);
expectDiagnostic('function name cannot case-insensitively match an available struct type',
    `struct Data { int value; }; int scenario data() { return 1; }`,
    "conflicts with struct type");
expectClean('function may use a name distinct from an available struct type',
    `struct Data { int value; }; int scenario dataNew() { return 1; }`);
expectDiagnostic('trigger name cannot case-insensitively match an available struct type',
    `struct Data { int value; }; scenario { trigger data(1) {} }`,
    "conflicts with struct type");
expectClean('trigger may use a name distinct from an available struct type',
    `struct Data { int value; }; scenario { trigger dataNew(1) {} }`);
expectDiagnostic('label name cannot case-insensitively match an available struct type',
    `struct Data { int value; }; scenario { labels { data = 1 } }`,
    "conflicts with struct type");
expectClean('field may be declared with its struct type name when not accessed',
    `struct Data { int data; }; scenario { Data value; }`);
expectDiagnostic('field access cannot case-insensitively match an available struct type',
    `struct Data { int data; }; scenario { Data value; value.data = 5; }`,
    "struct type has the same name");
expectClean('field access works when distinct from available struct type names',
    `struct Data { int dataNew; }; scenario { Data value; value.dataNew = 5; }`);
expectDiagnostic('case-insensitive duplicate struct definition is invalid',
    `struct Data { int first; }; struct data { int second; };`,
    "Duplicate definition of struct 'data' does not match the original");
expectDiagnostic('matching duplicate struct definitions are still invalid',
    `struct Data { int value; }; struct data { int value; };`,
    "Duplicate definition of struct 'data' does not match the original");
expectDiagnostic('later struct cannot case-insensitively match an available function',
    `int scenario data() { return 1; } struct Data { int value; };`,
    "conflicts with a previously declared function or script");
expectDiagnostic('later struct cannot case-insensitively match an available label',
    `scenario { labels { data = 1 } } struct Data { int value; };`,
    "conflicts with a previously declared label");
expectDiagnostic('script-body struct cannot follow a same-named label',
    `scenario {\n  labels {\n    Data = 1\n  }\n\n  struct Data { int value; };\n}`,
    "conflicts with a previously declared label");
expectDiagnostic('label still cannot follow an available same-named struct',
    `scenario { struct Data { int value; }; labels { Data = 1 } }`,
    "conflicts with struct type");
expectClean('expired scoped variable does not conflict with a later struct',
    `scenario { int data; } struct Data { int value; };`);
expectClean('expired parameter does not conflict with a later struct',
    `int scenario helper(int data) { return data; } struct Data { int value; };`);
expectDiagnostic('assignment-created variable cannot match an available struct type',
    `struct Data { int value; }; scenario { data = 5; }`,
    "conflicts with struct type");
expectDiagnostic('typed variable cannot match a previously declared trigger',
    `scenario { trigger inspect(1) {} int inspect; }`,
    "conflicts with a previously declared trigger");
expectDiagnostic('assignment-created variable cannot match a previously declared trigger',
    `scenario { trigger inspect(1) {} inspect = 5; }`,
    "conflicts with a previously declared trigger");
expectDiagnostic('label cannot match a visible variable',
    `scenario { int inspect; labels { inspect = 1 } }`,
    "conflicts with a visible variable or parameter");
expectDiagnostic('void is not a valid parameter type',
    `int scenario helper(void value) { return 1; }`,
    "cannot have type 'void'");
expectDiagnostic('void is not a valid local variable type',
    `scenario { void value; }`,
    "cannot have type 'void'");
expectDiagnostic('local qualifier is not valid for variable declarations',
    `scenario { local int value = 1; }`,
    "'local' qualifier is not supported");
expectClean('void is a valid struct field type',
    `struct Data { void value; };`);
expectDiagnostic('void array is not a valid struct field type',
    `struct Data { void[] values; };`,
    "cannot have array type 'void[]'");
expectClean('void struct field value is integer-backed',
    `struct Data { void value; }; scenario { Data item; int result = item.value; }`);
expectClean('void struct field selects an int overload',
    `struct Data { void value; }; ` +
    `int scenario inspect(int value) { return 1; } ` +
    `int scenario inspect(string value) { return 2; } ` +
    `scenario { Data item; int result = inspect(item.value); }`);
expectDiagnostic('integer-backed void struct field cannot bind to ref string',
    `struct Data { void value; }; ` +
    `int scenario set_string(ref string value) { value = "x"; return 1; } ` +
    `scenario { Data item; set_string(item.value); }`,
    "No overload for 'set_string' matches argument types (int)");
expectDiagnostic('unterminated block comment is rejected',
    `scenario {} /* unterminated`,
    "Unterminated block comment");
expectClean('nested block comments are valid',
    `scenario { int value = 1; /* outer /* inner */ outer */ int result = value; }`);
expectClean('deeply nested block comments are valid',
    `scenario { /* first /* second /* third */ second */ first */ int value = 1; }`);
expectDiagnostic('unterminated nested block comment is rejected',
    `scenario { /* outer /* inner */`,
    "Unterminated block comment");
expectDiagnostic('struct variable rejects assignment from int',
    `struct Data { int value; }; scenario { Data item; item = 5; }`,
    "Cannot convert");
expectClean('struct variable accepts assignment from the same struct type',
    `struct Data { int value; }; scenario { Data first; Data second; first = second; }`);
expectClean('explicit cast to a previously declared struct type is valid',
    `struct Data { int value; }; scenario { Data first; Data second = (Data)first; }`);
expectDiagnostic('explicit cast cannot convert between structurally identical named structs',
    `struct First { int value; }; struct Second { int value; }; ` +
    `First scenario create() { Second result; return (First)result; }`,
    "struct casts require the same declared type");
expectDiagnostic('explicit cast cannot convert between recursively identical named structs',
    `struct InnerFirst { int value; }; struct InnerSecond { int value; }; ` +
    `struct First { InnerFirst child; }; struct Second { InnerSecond child; }; ` +
    `First scenario create() { Second result; return (First)result; }`,
    "struct casts require the same declared type");
expectDiagnostic('explicit cast cannot convert a primitive to a struct',
    `struct First { int value; }; scenario { First result = (First)5; }`,
    "struct casts require the same declared type");
expectDiagnostic('explicit cast cannot convert a struct to a primitive',
    `struct First { int value; }; scenario { First source; int result = (int)source; }`,
    "struct casts require the same declared type");
expectClean('explicit cast to an array type is valid',
    `scenario { int[] first; int[] second = (int[])first; }`);
expectDiagnostic('explicit cast cannot add an array dimension',
    `scenario { int[] first; int[][] second = (int[][])first; }`,
    "array casts must preserve dimensionality");
expectDiagnostic('explicit cast cannot remove an array dimension',
    `scenario { int[][] first; int[] second = (int[])first; }`,
    "array casts must preserve dimensionality");
expectDiagnostic('explicit cast cannot convert a scalar to an array',
    `scenario { int value; int[] result = (int[])value; }`,
    "array casts must preserve dimensionality");
expectDiagnostic('explicit cast cannot convert an array to a scalar',
    `scenario { int[] values; int result = (int)values; }`,
    "array casts must preserve dimensionality");
expectClean('explicit cast supports arrays of a previously declared struct',
    `struct Data { int value; }; scenario { Data[] first; Data[] second = (Data[])first; }`);
expectClean('parenthesized value remains an expression when it is not a struct type',
    `scenario { int value = 1; int result = (value) + 1; }`);
expectDiagnostic('cast cannot use a struct type declared later',
    `scenario { Data first; Data second = (Data)first; } struct Data { int value; };`,
    "Missing operator between operands");
expectDiagnostic('matching duplicate struct field names are case-sensitive',
    `struct Data { int value; }; struct data { int Value; };`,
    "does not match the original");
expectDiagnostic('empty structs are invalid',
    `struct Empty { }; scenario { Empty value; }`,
    "must declare at least one field");
expectClean('struct declarations are valid inside a script block',
    `scenario { struct Data { int value; }; Data item; item.value = 5; }`);
expectClean('local struct types are inherited by nested executable blocks',
    `scenario { struct Data { int value; }; if (1) { Data item; item.value = 5; } }`);
expectDiagnostic('local struct types are unavailable before their declaration',
    `scenario { Data before; struct Data { int value; }; }`,
    "Unknown type 'Data'");
expectClean('struct types declared in a script remain available to later scripts',
    `scenario { struct Data { int value; }; Data item; } scenario { Data item; }`);
expectDiagnostic('later scripts cannot redeclare a struct introduced in an earlier script',
    `scenario { struct Data { int first; }; Data item; } ` +
    `scenario { struct Data { string second; }; Data item; }`,
    "Duplicate definition of struct 'Data'");
expectClean('struct types declared in nested blocks remain available afterward',
    `scenario { if (1) { struct Data { int value; }; } Data item; item.value = 5; }`);
expectClean('struct types declared in triggers remain available afterward',
    `scenario { trigger later(1) { struct Data { int value; }; } Data item; item.value = 5; }`);
expectDiagnostic('struct declaration conflicts with an earlier trigger in the same script',
    `scenario { trigger Data(1) { } struct Data { int value; }; }`,
    "conflicts with a previously declared trigger");
expectDiagnostic('struct inside a trigger cannot match that trigger name',
    `scenario { trigger Data(1) { struct Data { int value; }; } }`,
    "conflicts with a previously declared trigger");
expectClean('trigger names from an earlier script do not conflict with a later struct',
    `scenario { trigger Data(1) { } } struct Data { int value; };`);
expectDiagnostic('struct declaration conflicts with an earlier visible local variable',
    `scenario { int Data; struct Data { int value; }; }`,
    "conflicts with a visible variable or parameter");
expectDiagnostic('struct declaration conflicts with an earlier parameter',
    `int scenario helper(int Data) { struct Data { int value; }; return 1; }`,
    "conflicts with a visible variable or parameter");
expectDiagnostic('struct declaration conflicts with an earlier assignment-created variable',
    `scenario { Data = 1; struct Data { int value; }; }`,
    "conflicts with a visible variable or parameter");
expectClean('expired nested local does not conflict with a later struct in the script',
    `scenario { if (1) { int Data; } struct Data { int value; }; Data item; }`);
expectClean('anytype may be a contextual struct name',
    `struct anytype { int value; }; scenario { anytype data; data.value = 5; }`);
expectClean('anytype struct parameter accepts the matching struct',
    `struct anytype { int value; }; ` +
    `int scenario inspect(anytype item) { return item.value; } ` +
    `scenario { anytype item; int result = inspect(item); }`);
expectDiagnostic('anytype struct parameter rejects an int argument',
    `struct anytype { int value; }; ` +
    `int scenario inspect(anytype item) { return item.value; } ` +
    `scenario { int result = inspect(5); }`,
    "No overload for 'inspect'");
expectClean('builtin anytype parameter remains a wildcard',
    `scenario { wildcard_builtin(5); wildcard_builtin("text"); }`, [{
        name: 'wildcard_builtin',
        paramNames: ['value'],
        paramTypes: ['anytype'],
        returnType: 'void'
    }]);
expectClean('anytype may be a struct field identifier',
    `struct Data { int anytype; }; scenario { Data dataNew; dataNew.anytype = 5; }`);
expectClean('real may be a function identifier in a standalone call',
    `int scenario real() { return 1; } scenario { real(); }`);
expectClean('real may be a variable and parameter identifier',
    `int scenario helper(int real) { return real; } scenario { int real = helper(5); }`);
expectClean('real may be a struct field identifier',
    `struct Data { int real; }; scenario { Data value; value.real = 5; }`);
expectDiagnostic('real remains invalid as an undeclared source type',
    `scenario { real value; }`,
    "Unknown type 'real'");
expectDiagnostic('struct type is unavailable before declaration',
    `scenario { Group g; g.x = 5; } struct Group { int x; };`,
    "Unknown type 'Group'");
expectClean('struct type is available after declaration',
    `struct Group { int x; }; scenario { Group g; g.x = 5; }`);
expectDiagnostic('label is unavailable before its declaration',
    `scenario { int result = status; labels { status = 1 } }`,
    "Cannot find name 'status'");
expectClean('label is available after its declaration',
    `scenario { labels { status = 1 } int result = status; }`);

