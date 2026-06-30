const {
    assert,
    analyzeSource,
    expectClean,
    expectDiagnostic,
    expectOnlyDiagnostic
} = require('./harness');

expectDiagnostic('ternary type comes from string false branch',
    `scenario { int condition = 1; result = condition ? 5 : "text"; int value = result; }`,
    "explicit cast is required");
expectClean('ternary type comes from int false branch',
    `scenario { int condition = 1; result = condition ? "text" : 5; int value = result; }`);
expectClean('int ternary result converts implicitly to string',
    `scenario { int condition = 1; result = condition ? "text" : 5; string value = result; }`);
expectDiagnostic('float ternary condition is invalid',
    `scenario { float condition = 1.5; int result = condition ? 1 : 0; }`,
    "cannot be evaluated as a boolean value");
expectClean('int ternary condition is valid',
    `scenario { int condition = 1; int result = condition ? 1 : 0; }`);
expectClean('same trigger name is allowed in separate scenario blocks',
    `scenario { trigger later(1) { } } scenario { trigger later(1) { } }`);
expectDiagnostic('same trigger name remains invalid within one scenario block',
    `scenario { trigger later(1) { } trigger later(1) { } }`,
    "Duplicate trigger name 'later'");
expectDiagnostic('duplicate switch case is invalid',
    `scenario { int value = 1; switch (value) { case 1: break; case 1: break; } }`,
    "Duplicate case statement '1'");
expectClean('distinct switch cases remain valid',
    `scenario { int value = 1; switch (value) { case 1: break; case 2: break; } }`);
expectClean('separate switch cases have separate variable scopes',
    `scenario { int value = 1; switch (value) { ` +
    `case 1: int result = 1; break; case 2: int result = 2; break; } }`);
expectDiagnostic('struct declarations are invalid directly inside switch cases',
    `scenario { switch (1) { case 1: struct Data { int value; }; break; } }`,
    "Struct declarations are not valid directly inside switch cases");
expectDiagnostic('invalid switch-case struct does not become available after the switch',
    `scenario { switch (1) { case 1: struct Data { int value; }; break; } Data item; }`,
    "Unknown type 'Data'");
expectDiagnostic('same switch case rejects duplicate local variable',
    `scenario { int value = 1; switch (value) { ` +
    `case 1: int result = 1; int result = 2; break; } }`,
    "already declared");
expectDiagnostic('string case is invalid for int switch',
    `scenario { int value = 1; switch (value) { case "1": break; } }`,
    "explicit cast is required");
expectClean('int case is valid for int switch',
    `scenario { int value = 1; switch (value) { case 1: break; } }`);
expectDiagnostic('unary plus is invalid in switch case',
    `scenario { int value = 1; switch (value) { case +1: break; } }`,
    "Unary operator '+' is not valid");
expectDiagnostic('unary minus is invalid in switch case',
    `scenario { int value = 1; switch (value) { case -1: break; } }`,
    "Unary operator '-' is not valid");
expectDiagnostic('logical not is invalid in switch case',
    `scenario { int value = 1; switch (value) { case !1: break; } }`,
    "Unary operator '!' is not valid");
expectDiagnostic('binary expression is invalid in switch case',
    `scenario { int value = 2; switch (value) { case 1 + 1: break; } }`,
    "Binary operator '+' is not valid");
expectDiagnostic('parenthesized expression is invalid in switch case',
    `scenario { int value = 1; switch (value) { case (1): break; } }`,
    'Parenthesized expressions are not valid');
expectDiagnostic('leading-zero integer case duplicates normalized value',
    `scenario { int value = 1; switch (value) { case 1: break; case 01: break; } }`,
    "Duplicate case statement '1'");
expectDiagnostic('switch cannot contain multiple defaults',
    `scenario { int value = 1; switch (value) { default: break; default: break; } }`,
    "more than one default case");
expectDiagnostic('default must be the final switch section',
    `scenario { int value = 1; switch (value) { default: break; case 1: break; } }`,
    'cannot appear after default');
expectDiagnostic('label cases compare by resolved value',
    `scenario { labels { first = 1, second = 1 } int value = 1; ` +
    `switch (value) { case first: break; case second: break; } }`,
    "Duplicate case statement '1'");
expectDiagnostic('int case is invalid for float switch without cast',
    `scenario { float value = 1.0; switch (value) { case 1: break; } }`,
    "explicit cast is required");
expectDiagnostic('cast expression is invalid in switch case',
    `scenario { float value = 1.0; switch (value) { case (float)1: break; } }`,
    'Cast expressions are not valid');
expectDiagnostic('function call is invalid in switch case',
    `int scenario constant() { return 1; } ` +
    `scenario { int value = 1; switch (value) { case constant(): break; } }`,
    'Function calls are not valid');
expectDiagnostic('ternary expression is invalid in switch case',
    `scenario { int condition = 1; int value = 1; ` +
    `switch (value) { case condition ? 1 : 2: break; } }`,
    'Ternary expressions are not valid');
expectDiagnostic('struct field is invalid in switch case',
    `struct Data { int code; }; scenario { Data item; int value = 1; ` +
    `switch (value) { case item.code: break; } }`,
    'Runtime storage values are not valid');
expectDiagnostic('array element is invalid in switch case',
    `scenario { int[] values; int value = 1; ` +
    `switch (value) { case values[0]: break; } }`,
    'Runtime storage values are not valid');
expectDiagnostic('ordinary variable is invalid in switch case',
    `scenario { int expected = 1; int value = 1; ` +
    `switch (value) { case expected: break; } }`,
    "must refer to a label constant");
expectClean('label identifier remains valid in switch case',
    `scenario { labels { expected = 1 } int value = 1; ` +
    `switch (value) { case expected: break; } }`);
expectDiagnostic('negative number is invalid as a label value',
    `scenario { labels { negative = -1 } }`,
    'Label values must be a constant literal');
expectDiagnostic('unary plus number is invalid as a label value',
    `scenario { labels { positive = +1 } }`,
    'Label values must be a constant literal');
expectClean('negative integer initializer remains valid',
    `scenario { int value = -1; }`);
expectDiagnostic('unary plus is invalid in an integer initializer',
    `scenario { int value = +1; }`,
    "Unary operator '+' is not valid in an expression");
expectDiagnostic('unary minus is invalid for string values',
    `scenario { result = -"text"; }`,
    "Operator '-' is not valid for type 'string'");
expectClean('unary minus preserves boolean type',
    `scenario { bool result = -true; }`);
expectClean('logical not accepts string values',
    `scenario { result = !"text"; }`);
expectClean('logical not accepts every scalar type',
    `scenario { int i = 1; float f = 1.0; string s = "1"; bool b = true; ` +
    `first = !i; second = !f; third = !s; fourth = !b; }`);
expectDiagnostic('logical not rejects struct values',
    `struct Data { int value; }; scenario { Data item; bool result = !item; }`,
    "Operator '!' is not valid for type 'Data'");
expectDiagnostic('logical not rejects array values',
    `scenario { int[] values; bool result = !values; }`,
    "Operator '!' is not valid for type 'int[]'");
expectDiagnostic('logical not rejects void values',
    `void scenario nothing() { } scenario { bool result = !nothing(); }`,
    "Operator '!' is not valid for type 'void'");
expectClean('logical and accepts float operands',
    `scenario { result = 1.5 && 1; }`);
expectClean('logical and accepts string operands',
    `scenario { result = "text" && 1; }`);
expectClean('logical or accepts mixed string and float operands',
    `scenario { bool result = "text" || 1.5; }`);
expectClean('boolean values participate in arithmetic',
    `scenario { result = true + 1; }`);
expectClean('mixed numeric division promotes the result to float',
    `scenario { float first = 5 / 2.0; float second = 5.0 / 2; }`);
expectClean('mixed numeric arithmetic promotes results to float',
    `scenario { float sum = 1 + 2.0; float difference = 2.0 - 1; ` +
    `float product = 2 * 1.5; float power = 2.0 ^ 3; }`);
expectClean('integer shift operators are valid',
    `scenario { int left = 1 << 2; int right = 8 >> 1; }`);
expectClean('binary bitwise and and or operators are valid',
    `scenario { andResult = 5 & 3; orResult = 5 | 2; }`);
expectClean('binary and and or produce boolean results',
    `scenario { bool andResult = 5 & 3; bool orResult = 5 | 2; }`);
expectClean('binary and and or accept every scalar operand pairing',
    `scenario { int i = 2; float f = 2.0; string s = "2"; bool b = true; ` +
    `ii = i & i; iff = i & f; iss = i & s; ib = i & b; ` +
    `fi = f & i; ff = f & f; fs = f & s; fb = f & b; ` +
    `si = s & i; sf = s & f; ss = s & s; sb = s & b; ` +
    `bi = b & i; bf = b & f; bs = b & s; bb = b & b; ` +
    `oii = i | i; oif = i | f; ois = i | s; oib = i | b; ` +
    `ofi = f | i; off = f | f; ofs = f | s; ofb = f | b; ` +
    `osi = s | i; osf = s | f; oss = s | s; osb = s | b; ` +
    `obi = b | i; obf = b | f; obs = b | s; obb = b | b; }`);
expectClean('comparisons accept boolean and integer pairings in both directions',
    `scenario { bool b = true; bool first = b < 1; bool second = 1 >= b; }`);
expectDiagnostic('comparisons reject boolean and float pairings',
    `scenario { bool b = true; bool result = b < 1.0; }`,
    'explicit cast is required');
expectDiagnostic('comparisons reject float and boolean pairings',
    `scenario { bool b = true; bool result = 1.0 < b; }`,
    'explicit cast is required');
expectDiagnostic('comparisons reject boolean and string pairings',
    `scenario { bool b = true; bool result = b == "1"; }`,
    'explicit cast is required');
expectDiagnostic('comparisons reject string and boolean pairings',
    `scenario { bool b = true; bool result = "1" != b; }`,
    'explicit cast is required');
expectDiagnostic('non-additive arithmetic rejects boolean and float pairings',
    `scenario { bool b = true; result = b - 1.0; }`,
    'explicit cast is required');
expectDiagnostic('non-additive arithmetic rejects float and boolean pairings',
    `scenario { bool b = true; result = 1.0 * b; }`,
    'explicit cast is required');
expectClean('addition accepts boolean with integer and boolean operands',
    `scenario { bool b = true; bool c = false; first = b + 1; second = 1 + b; third = b + c; }`);
expectDiagnostic('addition rejects boolean and float pairings',
    `scenario { bool b = true; result = b + 1.0; }`,
    'explicit cast is required');
expectDiagnostic('addition rejects float and boolean pairings',
    `scenario { bool b = true; result = 1.0 + b; }`,
    'explicit cast is required');
expectDiagnostic('addition rejects boolean and string pairings',
    `scenario { bool b = true; result = b + "1"; }`,
    'explicit cast is required');
expectDiagnostic('addition rejects string and boolean pairings',
    `scenario { bool b = true; result = "1" + b; }`,
    'explicit cast is required');
expectDiagnostic('binary and result cannot be assigned to int',
    `scenario { int result = 5 & 3; }`,
    'explicit cast is required');
expectDiagnostic('binary or result cannot be assigned to float',
    `scenario { float result = 5 | 2; }`,
    'explicit cast is required');
expectDiagnostic('binary and result cannot be assigned to string',
    `scenario { string result = 5 & 3; }`,
    "type 'bool' to 'string'");
expectDiagnostic('bitwise complement remains unsupported',
    `scenario { int result = ~5; }`,
    'Unknown symbol "~"');
expectDiagnostic('compound bitwise and remains unsupported',
    `scenario { int value = 5; value &= 3; }`,
    "Expected an expression");
expectDiagnostic('compound bitwise or remains unsupported',
    `scenario { int value = 5; value |= 2; }`,
    "Expected an expression");
expectClean('shift operators may be chained',
    `scenario { int value = 16 >> 1 >> 1; }`);
expectClean('compound shift assignment operators are valid',
    `scenario { int left = 1; int right = 8; left <<= 2; right >>= 1; }`);
expectDiagnostic('compound shift rejects a float target',
    `scenario { float value = 1.0; value <<= 2; }`,
    "Operator '<<=' is not valid for float values");
expectDiagnostic('compound shift rejects a float operand',
    `scenario { int value = 1; value >>= 2.0; }`,
    "Operator '>>=' is not valid for float values");
expectClean('binary shifts accept every scalar operand pairing',
    `scenario { int i = 2; float f = 2.0; string s = "2"; bool b = true; ` +
    `ii = i << i; iff = i << f; iss = i << s; ib = i << b; ` +
    `fi = f << i; ff = f << f; fs = f << s; fb = f << b; ` +
    `si = s << i; sf = s << f; ss = s << s; sb = s << b; ` +
    `bi = b << i; bf = b << f; bs = b << s; bb = b << b; ` +
    `rii = i >> i; rif = i >> f; ris = i >> s; rib = i >> b; ` +
    `rfi = f >> i; rff = f >> f; rfs = f >> s; rfb = f >> b; ` +
    `rsi = s >> i; rsf = s >> f; rss = s >> s; rsb = s >> b; ` +
    `rbi = b >> i; rbf = b >> f; rbs = b >> s; rbb = b >> b; }`);
expectClean('shift accepts a float left operand with an integer shift count',
    `scenario { float value = 4.0 << 1; }`);
expectClean('explicit casts remain valid in binary shifts',
    `scenario { int i = 2; float f = 2.0; ` +
    `first = (float)i << f; second = i << (int)f; ` +
    `third = f << (float)i; fourth = (int)f << i; }`);
expectDiagnostic('shift rejects void as its left operand',
    `void scenario nothing() { } scenario { result = nothing() << 1; }`,
    'cannot use a void value as its left operand');
expectClean('shift currently permits void as its right operand',
    `void scenario nothing() { } scenario { result = 1 >> nothing(); }`);
expectClean('compound shift accepts boolean targets with assignable operands',
    `scenario { bool first = true; bool second = true; first <<= 1; second <<= true; }`);
expectDiagnostic('compound shift rejects boolean operand for integer target',
    `scenario { int value = 1; bool operand = true; value <<= operand; }`,
    'explicit cast is required');
expectDiagnostic('compound shift rejects string targets',
    `scenario { string value = "1"; value <<= 1; }`,
    "Operator '<<=' is not valid for string values");
expectClean('addition binds more tightly than shift operators',
    `scenario { int value = 1 << 2 + 1; }`);
expectClean('string concatenation retains numeric conversion behavior',
    `scenario { string result = "value=" + 5; }`);
expectClean('string plus-equals accepts numeric and string operands',
    `scenario { string value = "1"; value += 2; value += 2.0; value += "2"; }`);
expectDiagnostic('string plus-equals rejects boolean operands',
    `scenario { string value = "1"; bool operand = true; value += operand; }`,
    "type 'bool' to 'string'");
expectClean('boolean keywords use integer-to-string conversion',
    `scenario { string first = true; string second = false; string third = "1"; third += true; }`);
expectClean('parenthesized boolean keywords remain integer-backed',
    `scenario { int first = (true); float second = (false); string third = (true); }`);
expectDiagnostic('conditional expression is not an assignment target',
    `scenario { int first; int second; int condition = 1; ` +
    `(condition ? first : second) = 5; }`,
    "must be a writable variable, field, or array element");
expectDiagnostic('field cannot be accessed through a conditional struct value',
    `struct Data { int code; }; scenario { Data first; Data second; int condition = 1; ` +
    `(condition ? first : second).code = 5; }`,
    "must be a struct variable");
expectClean('parentheses preserve a struct receiver for field access',
    `struct Data { int code; }; scenario { Data item; int result = ((item)).code; }`);
expectClean('conditional expression remains readable as an rvalue',
    `scenario { int first = 1; int second = 2; int condition = 1; ` +
    `int result = condition ? first : second; }`);
expectDiagnostic('parenthesized variable is not an assignment target',
    `scenario { int value; (value) = 5; }`,
    "must be a writable variable, field, or array element");
expectDiagnostic('parenthesized variable is not a compound-assignment target',
    `scenario { int value = 1; ((value)) += 1; }`,
    "must be a writable variable, field, or array element");
expectClean('direct variable remains writable',
    `scenario { int value; value = 1; }`);
expectClean('direct struct field remains writable',
    `struct Data { int code; }; scenario { Data item; item.code = 2; }`);
expectClean('direct array element remains writable',
    `scenario { int[] values; values[0] = 3; }`);
