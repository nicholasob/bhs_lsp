# BHS Game Compile-Success Cases

Generated from the executable semantic regression corpus. Total: **194** standalone cases.

Run every snippet independently. Combining snippets can introduce duplicate-name and scope conflicts.

Synthetic built-in fixtures excluded because they cannot be compiled directly in game: **4**.

## Declarations And Calls

### 1. script categories and primitive types remain case-insensitive

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
ScEnArIo { InT Value = 1; }
```

### 2. lowercase statement syntax and boolean literals parse consistently

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
ScEnArIo { static InT Value = 1; run_once { if (true) { VALUE += 1; } else { VALUE = 0; } } trigger Tick (VaLuE > 0) { while (false) { break; } } }
```

### 3. StRuCt may be used as an identifier

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int StRuCt = 1; }
```

### 4. StAtIc may be used as an identifier

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int StAtIc = 1; }
```

### 5. ReF may be used as an identifier

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int ReF = 1; }
```

### 6. If may be used as an identifier

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int If = 1; }
```

### 7. ElSe may be used as an identifier

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int ElSe = 1; }
```

### 8. DeFaUlT may be used as an identifier

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int DeFaUlT = 1; }
```

### 9. BrEaK may be used as an identifier

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int BrEaK = 1; }
```

### 10. CoNtInUe may be used as an identifier

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int CoNtInUe = 1; }
```

### 11. ReTuRn may be used as an identifier

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int ReTuRn = 1; }
```

### 12. TrIgGeR may be used as an identifier

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int TrIgGeR = 1; }
```

### 13. RuN_OnCe may be used as an identifier

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int RuN_OnCe = 1; }
```

### 14. LaBeLs may be used as an identifier

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int LaBeLs = 1; }
```

### 15. TrUe may be used as an identifier

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int TrUe = 1; }
```

### 16. FaLsE may be used as an identifier

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int FaLsE = 1; }
```

### 17. local is contextual or non-reserved as an identifier

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int local = 1; }
```

### 18. include is contextual or non-reserved as an identifier

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int include = 1; }
```

### 19. anytype is contextual or non-reserved as an identifier

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int anytype = 1; }
```

### 20. real is contextual or non-reserved as an identifier

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int real = 1; }
```

### 21. local struct field assignment

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Group { int x; }; scenario { static Group g; g.x = 5; }
```

### 22. struct declaration requires and accepts a trailing semicolon

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Node { int value; };
```

### 23. value struct parameter field assignment

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Group { int x; }; int scenario update(Group g) { g.x = 5; return g.x; }
```

### 24. value struct parameter field compound assignment

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Group { int x; }; int scenario update(Group g) { g.x += 5; return g.x; }
```

### 25. ref struct parameter field literal assignment

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Group { int x; }; int scenario update(ref Group g) { g.x = 5; return g.x; }
```

### 26. ref struct parameter field assignment from differently named parameter

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Group { int x; }; int scenario update(ref Group g, int value) { g.x = value; return g.x; }
```

### 27. differently named parameter permits unrelated expression assignment

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Group { int x; }; int scenario update(ref Group g, int z) { g.x = 5 + 5; return g.x; }
```

### 28. ref struct parameter field compound assignment without collision

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Group { int x; }; int scenario update(ref Group g, int z) { g.x += z; return g.x; }
```

### 29. different local variable does not collide with assigned field

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Group { int x; }; scenario { int z; Group g; g.x = 5; }
```

### 30. later local variable does not collide with earlier field access

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Group { int x; }; scenario { Group g; g.x = 5; int x; }
```

### 31. declarator does not collide inside its own initializer

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Group { int x; }; scenario { Group g; int x = g.x; }
```

### 32. later declarator does not collide with earlier initializer

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Group { int x; }; scenario { Group g; int result = g.x, x; }
```

### 33. different local variable does not collide with array dot member

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int size; int[] values; int result = values.length; }
```

### 34. local struct field as ref argument

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Group { int x; }; int scenario set_int(ref int value) { value = 5; return value; } scenario { static Group g; int result = set_int(g.x); }
```

### 35. value struct parameter field as ref argument

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Group { int x; }; int scenario set_int(ref int value) { value = 5; return value; } int scenario update(Group g) { return set_int(g.x); }
```

### 36. ref struct parameter field as ref argument

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Group { int x; }; int scenario set_int(ref int value) { value = 5; return value; } int scenario update(ref Group g) { return set_int(g.x); }
```

### 37. different local variable does not collide with dotted function call

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Group { int x; }; int scenario inspect(Group g) { return g.x; } scenario { int other; Group g; int result = g.inspect(); }
```

### 38. typed variable may precede same-named user function

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int inspect; } int scenario inspect(int value) { return value; }
```

### 39. parameter may match its own function name

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
int scenario inspect(int inspect) { return inspect; }
```

### 40. trigger may precede same-named user function

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { trigger inspect(1) { } } int scenario inspect(int value) { return value; }
```

### 41. scoped variable may precede same-named user function

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int inspect = 1; } int scenario inspect(int value) { return value; }
```

### 42. run-once variable may precede same-named user function

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { run_once { int inspect = 5; } } int scenario inspect(int value) { return value; }
```

### 43. forward-declared overload is callable before its definition

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
int scenario convert(int value) { return value; } string scenario convert(string value); scenario { string result = convert("text"); } string scenario convert(string value) { return value; }
```

### 44. matching prototype and definition share one declaration identity

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
int scenario helper(int value); int scenario helper(int value) { return value; } scenario { int result = helper(1); }
```

### 45. value and ref parameter overloads are distinct

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
int scenario helper(int value) { return value; } int scenario helper(ref int value) { return value; }
```

### 46. same-typed declarations with different parameter names are distinct

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
int scenario helper(int value) { return value; } int scenario helper(int other) { return other; }
```

### 47. identical declarations in different script categories may coexist

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
int scenario helper(int value) { return value; } int conquest helper(int value) { return value; }
```

### 48. calls prefer overloads from the current script category

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
string scenario choose(int value) { return "scenario"; } int conquest choose(int value) { return value; } string scenario call_scenario() { return choose(1); } int conquest call_conquest() { return choose(1); }
```

### 49. function calls resolve case-insensitively

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
int scenario Inspect(int value) { return value; } scenario { int result = inspect(5); }
```

### 50. later same-typed overload does not affect an earlier call

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
int scenario helper(int value) { return value; } scenario { int result = helper(5); } int scenario helper(int other) { return other; }
```

### 51. literal argument excludes a ref overload

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
int scenario helper(int value) { return 1; } int scenario helper(ref int value) { return 2; } scenario { int result = helper(5); }
```

## Control Flow And Operators

### 52. ternary type comes from int false branch

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int condition = 1; result = condition ? "text" : 5; int value = result; }
```

### 53. int ternary result converts implicitly to string

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int condition = 1; result = condition ? "text" : 5; string value = result; }
```

### 54. int ternary condition is valid

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int condition = 1; int result = condition ? 1 : 0; }
```

### 55. same trigger name is allowed in separate scenario blocks

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { trigger later(1) { } } scenario { trigger later(1) { } }
```

### 56. distinct switch cases remain valid

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int value = 1; switch (value) { case 1: break; case 2: break; } }
```

### 57. separate switch cases have separate variable scopes

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int value = 1; switch (value) { case 1: int result = 1; break; case 2: int result = 2; break; } }
```

### 58. int case is valid for int switch

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int value = 1; switch (value) { case 1: break; } }
```

### 59. label identifier remains valid in switch case

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { labels { expected = 1 } int value = 1; switch (value) { case expected: break; } }
```

### 60. negative integer initializer remains valid

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int value = -1; }
```

### 61. unary minus preserves boolean type

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { bool result = -true; }
```

### 62. logical not accepts string values

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { result = !"text"; }
```

### 63. logical not accepts every scalar type

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int i = 1; float f = 1.0; string s = "1"; bool b = true; first = !i; second = !f; third = !s; fourth = !b; }
```

### 64. logical and accepts float operands

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { result = 1.5 && 1; }
```

### 65. logical and accepts string operands

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { result = "text" && 1; }
```

### 66. logical or accepts mixed string and float operands

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { bool result = "text" || 1.5; }
```

### 67. boolean values participate in arithmetic

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { result = true + 1; }
```

### 68. mixed numeric division promotes the result to float

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { float first = 5 / 2.0; float second = 5.0 / 2; }
```

### 69. mixed numeric arithmetic promotes results to float

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { float sum = 1 + 2.0; float difference = 2.0 - 1; float product = 2 * 1.5; float power = 2.0 ^ 3; }
```

### 70. integer shift operators are valid

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int left = 1 << 2; int right = 8 >> 1; }
```

### 71. binary bitwise and and or operators are valid

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { andResult = 5 & 3; orResult = 5 | 2; }
```

### 72. binary and and or produce boolean results

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { bool andResult = 5 & 3; bool orResult = 5 | 2; }
```

### 73. binary and and or accept every scalar operand pairing

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int i = 2; float f = 2.0; string s = "2"; bool b = true; ii = i & i; iff = i & f; iss = i & s; ib = i & b; fi = f & i; ff = f & f; fs = f & s; fb = f & b; si = s & i; sf = s & f; ss = s & s; sb = s & b; bi = b & i; bf = b & f; bs = b & s; bb = b & b; oii = i | i; oif = i | f; ois = i | s; oib = i | b; ofi = f | i; off = f | f; ofs = f | s; ofb = f | b; osi = s | i; osf = s | f; oss = s | s; osb = s | b; obi = b | i; obf = b | f; obs = b | s; obb = b | b; }
```

### 74. comparisons accept boolean and integer pairings in both directions

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { bool b = true; bool first = b < 1; bool second = 1 >= b; }
```

### 75. addition accepts boolean with integer and boolean operands

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { bool b = true; bool c = false; first = b + 1; second = 1 + b; third = b + c; }
```

### 76. shift operators may be chained

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int value = 16 >> 1 >> 1; }
```

### 77. compound shift assignment operators are valid

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int left = 1; int right = 8; left <<= 2; right >>= 1; }
```

### 78. binary shifts accept every scalar operand pairing

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int i = 2; float f = 2.0; string s = "2"; bool b = true; ii = i << i; iff = i << f; iss = i << s; ib = i << b; fi = f << i; ff = f << f; fs = f << s; fb = f << b; si = s << i; sf = s << f; ss = s << s; sb = s << b; bi = b << i; bf = b << f; bs = b << s; bb = b << b; rii = i >> i; rif = i >> f; ris = i >> s; rib = i >> b; rfi = f >> i; rff = f >> f; rfs = f >> s; rfb = f >> b; rsi = s >> i; rsf = s >> f; rss = s >> s; rsb = s >> b; rbi = b >> i; rbf = b >> f; rbs = b >> s; rbb = b >> b; }
```

### 79. shift accepts a float left operand with an integer shift count

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { float value = 4.0 << 1; }
```

### 80. explicit casts remain valid in binary shifts

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int i = 2; float f = 2.0; first = (float)i << f; second = i << (int)f; third = f << (float)i; fourth = (int)f << i; }
```

### 81. shift currently permits void as its right operand

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
void scenario nothing() { } scenario { result = 1 >> nothing(); }
```

### 82. compound shift accepts boolean targets with assignable operands

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { bool first = true; bool second = true; first <<= 1; second <<= true; }
```

### 83. addition binds more tightly than shift operators

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int value = 1 << 2 + 1; }
```

### 84. string concatenation retains numeric conversion behavior

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { string result = "value=" + 5; }
```

### 85. string plus-equals accepts numeric and string operands

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { string value = "1"; value += 2; value += 2.0; value += "2"; }
```

### 86. boolean keywords use integer-to-string conversion

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { string first = true; string second = false; string third = "1"; third += true; }
```

### 87. parenthesized boolean keywords remain integer-backed

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int first = (true); float second = (false); string third = (true); }
```

### 88. parentheses preserve a struct receiver for field access

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Data { int code; }; scenario { Data item; int result = ((item)).code; }
```

### 89. conditional expression remains readable as an rvalue

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int first = 1; int second = 2; int condition = 1; int result = condition ? first : second; }
```

### 90. direct variable remains writable

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int value; value = 1; }
```

### 91. direct struct field remains writable

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Data { int code; }; scenario { Data item; item.code = 2; }
```

### 92. direct array element remains writable

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int[] values; values[0] = 3; }
```

## Types And Operators

### 93. script can return a previously declared struct type

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Data { int value; }; Data scenario create() { Data result; return result; } scenario { Data item = create(); }
```

### 94. script can return a one-dimensional array

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
int[] scenario create() { int[] result; return result; } scenario { int[] values = create(); }
```

### 95. script can return a multidimensional array

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
int[][] scenario create() { int[][] result; return result; } scenario { int[][] values = create(); }
```

### 96. terminal aggregate return satisfies the syntactic return rule

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Data { int value; }; Data scenario create(int condition) { Data result; if (condition) { result = result; } return result; }
```

### 97. nested struct layout differences distinguish overload signatures

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct InnerFirst { int value; }; struct InnerSecond { int value; int extra; }; struct First { InnerFirst child; }; struct Second { InnerSecond child; }; int scenario inspect(First item) { return 1; } int scenario inspect(Second item) { return 2; }
```

### 98. different struct layouts distinguish overload signatures

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct First { int value; }; struct Second { int value; int test; }; First scenario create() { First item; return item; } int scenario inspect(First item) { return 1; } int scenario inspect(Second item) { return 2; } scenario { int result = inspect(create()); }
```

### 99. different struct field names distinguish overload signatures

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct First { int value; }; struct Second { int vaeue; }; First scenario create() { First item; return item; } int scenario inspect(First item) { return 1; } int scenario inspect(Second item) { return 2; } scenario { int result = inspect(create()); }
```

### 100. arrays preserve nominal struct element types in overload signatures

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct First { int value; }; struct Second { int value; }; int scenario inspect(First[] items) { return 1; } int scenario inspect(Second[] items) { return 2; }
```

### 101. parentheses preserve a writable ref variable

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
int scenario set(ref int value) { value = 5; return value; } scenario { int value; int result = set((value)); }
```

### 102. parentheses preserve an ordinary value argument

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
int scenario set(int value) { value = 5; return value; } scenario { int value; int result = set((value)); }
```

### 103. nested parentheses preserve a writable ref field

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Data { int code; }; int scenario set(ref int value) { value = 5; return value; } scenario { Data item; int result = set(((item.code))); }
```

### 104. boolean keyword uses integer-to-string conversion for arguments

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
int scenario inspect(string value) { return 1; } scenario { int result = inspect(true); }
```

### 105. boolean keyword uses integer-to-string conversion in returns

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
string scenario inspect() { return true; }
```

### 106. boolean expression selects only a boolean overload

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
int scenario inspect(int value) { return 1; } int scenario inspect(bool value) { return 2; } scenario { int result = inspect(!1); }
```

### 107. struct values support equality comparisons

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Data { int value; }; scenario { Data first; Data second; bool equal = first == second; bool different = first != second; }
```

### 108. array values support equality comparisons

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int[] first; int[] second; bool equal = first == second; bool different = first != second; }
```

### 109. adjacent string literals concatenate at compile time

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { string value = "first" "second"; }
```

### 110. multiple adjacent string literals form one expression

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { string value = "first" " " "second"; }
```

### 111. adjacent string literal is a string function argument

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
int scenario inspect(string value) { return 1; } scenario { int result = inspect("first" "second"); }
```

### 112. character literal remains valid in switch case

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int value = 65; switch (value) { case 'A': break; } }
```

### 113. escaped zero character is distinct from numeric zero

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int value = 0; switch (value) { case '\0': break; case 0: break; } }
```

### 114. escaped b character is distinct from numeric backspace code

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int value = 8; switch (value) { case '\b': break; case 8: break; } }
```

### 115. matching string literal remains valid in switch case

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { string value = "first"; switch (value) { case "first": break; } }
```

### 116. matching float literal remains valid in switch case

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { float value = 1.5; switch (value) { case 1.5: break; } }
```

### 117. boolean literal is valid under an integer switch

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int value = 1; switch (value) { case true: break; } }
```

### 118. integer literal is valid under a boolean switch

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { bool value = true; switch (value) { case 1: break; } }
```

### 119. implicit label continues a preceding explicit float value

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { labels { first = 1.5, second } float value = 2.5; switch (value) { case second: break; } }
```

### 120. leading unassigned label does not default to zero

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { labels { target } int value = 0; switch (value) { case target: break; case 0: break; } }
```

### 121. trailing-dot float literal is valid

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { float value = 1.; switch (value) { case 1.: break; } }
```

### 122. scientific notation is a valid float literal

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { float value = 1e3; }
```

### 123. scientific notation supports decimal mantissa and signed exponent

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { float first = 1.5E-2; float second = .5e+2; }
```

### 124. hexadecimal notation is a valid integer literal

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int lower = 0x10; int upper = 0X2A; }
```

### 125. hexadecimal digits containing E remain integer literals

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int value = 0xFE; }
```

## Arrays And Declarations

### 126. multidimensional primitive array declaration is valid

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int[][] values; }
```

### 127. array dimensions may follow the variable name

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int values[][]; int value = values[0][0]; }
```

### 128. array dimensions may follow a parameter name

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
int scenario inspect(int values[][]) { return values[0][0]; } scenario { int matrix[][]; int result = inspect(matrix); }
```

### 129. ref array parameter retains trailing dimensions

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
int scenario inspect(ref int values[][]) { return values[0][0]; } scenario { int matrix[][]; int result = inspect(matrix); }
```

### 130. overloads distinguish trailing parameter dimensions

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
int scenario inspect(int values[]) { return 1; } int scenario inspect(int values[][]) { return 2; } scenario { int matrix[][]; int result = inspect(matrix); }
```

### 131. array may be a dotted function receiver

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
int scenario inspect(int[] item, int value) { return value; } scenario { int[] item; int result = item.inspect(5); }
```

### 132. array receiver dimensions select the matching overload

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
int scenario inspect(int[] item, int value) { return 1; } int scenario inspect(int[][] item, int value) { return 2; } scenario { int[][] item; int result = item.inspect(5); }
```

### 133. each declarator retains its own trailing array dimensions

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int scalar, row[], matrix[][]; int value = scalar; int[] selectedRow = row; int[][] selectedMatrix = matrix; }
```

### 134. multidimensional arrays lose one dimension per index

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int[][] values; int[] row = values[0]; int value = values[0][0]; }
```

### 135. dot member can be read from a returned array value

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
int[] scenario create() { int[] result; return result; } scenario { int result = create().length; }
```

### 136. parentheses preserve an array variable for indexing

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int[] values; int value = ((values))[0]; }
```

### 137. three-dimensional arrays retain intermediate array types

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int[][][] values; int[][] plane = values[0]; int[] row = values[0][0]; int value = values[0][0][0]; }
```

### 138. multidimensional primitive array is valid as a struct field

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Data { int[][] values; }; scenario { Data item; int value = item.values[0][0]; }
```

### 139. previously declared struct is valid as a multidimensional struct field

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct First { int value; }; struct Container { First values[][]; }; scenario { Container holder; holder.values[0][0].value = 5; }
```

### 140. array dimensions may follow a struct field name

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Data { int values[][]; }; scenario { Data item; int value = item.values[0][0]; }
```

### 141. comma-separated struct fields retain individual dimensions

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Data { int first[], second[][]; }; scenario { Data item; int[] first = item.first; int[][] second = item.second; }
```

### 142. overloads distinguish array dimensionality

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
int scenario inspect(int[] row) { return 1; } int scenario inspect(int[][] matrix) { return 2; } scenario { int[][] values; int result = inspect(values); }
```

### 143. overloads distinguish scalar and multidimensional array parameters

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
int scenario inspect(int value) { return 1; } int scenario inspect(int[][] matrix) { return 2; } scenario { int[][] values; int result = inspect(values); }
```

### 144. ref overload selects the exact array dimensionality

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
int scenario inspect(ref int[] row) { return 1; } int scenario inspect(ref int[][] matrix) { return 2; } scenario { int[][] values; int result = inspect(values); }
```

### 145. single unbraced if body may assign an existing variable

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int condition = 1; int result; if (condition) result = 1; }
```

### 146. unbraced if and else bodies may assign an existing variable

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int condition = 1; int result; if (condition) result = 1; else result = 2; }
```

### 147. unbraced if body may precede a braced else body

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int condition = 0; int value = 0; if (condition) value = 1; else { value = 2; } }
```

### 148. final else body may be an unbraced executable statement

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int first = 0; int second = 1; int result; if (first) { result = 1; } else if (second) { result = 2; } else result = 3; }
```

### 149. braced if else remains valid

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int condition = 1; if (condition) { result = 1; } else { result = 2; } }
```

### 150. else if chain may connect braced branch bodies

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int first = 0; int second = 1; if (first) { result = 1; } else if (second) { result = 2; } else { result = 3; } }
```

### 151. else if chain may use unbraced executable bodies

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int first = 0; int second = 1; int result; if (first) result = 1; else if (second) result = 2; else result = 3; }
```

### 152. unbraced while body may assign an existing variable

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int i = 0; while (i < 1) i = i + 1; }
```

### 153. unbraced for body may assign an existing variable

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int i; int result; for (i = 0; i < 1; i++) result = i; }
```

### 154. unbraced do body may assign an existing variable

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int i = 0; do i = i + 1; while (i < 1); }
```

### 155. for-loop initializer may be empty

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int i = 0; for (; i < 5; i++) { } }
```

### 156. for-loop update may be empty

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int i; for (i = 0; i < 5; ) { } }
```

### 157. for-loop initializer and update may both be empty

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int i = 0; for (; i < 5; ) { i++; } }
```

### 158. for-loop with all clauses remains valid

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int i; for (i = 0; i < 5; i++) { } }
```

### 159. void script may use bare return

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
void scenario helper() { return; }
```

### 160. untyped script accepts boolean literals as integer-backed returns

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario helper() { return true; } scenario { bool value = helper(); }
```

### 161. anytype is valid as a function identifier

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
int scenario anytype() { return 1; } scenario { int value = anytype(); }
```

### 162. variable may use a name distinct from its struct type

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Data { int value; }; scenario { Data dataNew; }
```

### 163. parameter may use a name distinct from an available struct type

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Data { int value; }; int scenario inspect(int dataNew) { return dataNew; }
```

### 164. function may use a name distinct from an available struct type

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Data { int value; }; int scenario dataNew() { return 1; }
```

### 165. trigger may use a name distinct from an available struct type

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Data { int value; }; scenario { trigger dataNew(1) {} }
```

### 166. field may be declared with its struct type name when not accessed

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Data { int data; }; scenario { Data value; }
```

### 167. field access works when distinct from available struct type names

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Data { int dataNew; }; scenario { Data value; value.dataNew = 5; }
```

### 168. expired scoped variable does not conflict with a later struct

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int data; } struct Data { int value; };
```

### 169. expired parameter does not conflict with a later struct

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
int scenario helper(int data) { return data; } struct Data { int value; };
```

### 170. void is a valid struct field type

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Data { void value; };
```

### 171. void struct field value is integer-backed

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Data { void value; }; scenario { Data item; int result = item.value; }
```

### 172. void struct field selects an int overload

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Data { void value; }; int scenario inspect(int value) { return 1; } int scenario inspect(string value) { return 2; } scenario { Data item; int result = inspect(item.value); }
```

### 173. nested block comments are valid

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int value = 1; /* outer /* inner */ outer */ int result = value; }
```

### 174. deeply nested block comments are valid

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { /* first /* second /* third */ second */ first */ int value = 1; }
```

### 175. struct variable accepts assignment from the same struct type

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Data { int value; }; scenario { Data first; Data second; first = second; }
```

### 176. explicit cast to a previously declared struct type is valid

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Data { int value; }; scenario { Data first; Data second = (Data)first; }
```

### 177. explicit cast to an array type is valid

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int[] first; int[] second = (int[])first; }
```

### 178. explicit cast supports arrays of a previously declared struct

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Data { int value; }; scenario { Data[] first; Data[] second = (Data[])first; }
```

### 179. parenthesized value remains an expression when it is not a struct type

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { int value = 1; int result = (value) + 1; }
```

### 180. struct declarations are valid inside a script block

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { struct Data { int value; }; Data item; item.value = 5; }
```

### 181. local struct types are inherited by nested executable blocks

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { struct Data { int value; }; if (1) { Data item; item.value = 5; } }
```

### 182. struct types declared in a script remain available to later scripts

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { struct Data { int value; }; Data item; } scenario { Data item; }
```

### 183. struct types declared in nested blocks remain available afterward

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { if (1) { struct Data { int value; }; } Data item; item.value = 5; }
```

### 184. struct types declared in triggers remain available afterward

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { trigger later(1) { struct Data { int value; }; } Data item; item.value = 5; }
```

### 185. trigger names from an earlier script do not conflict with a later struct

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { trigger Data(1) { } } struct Data { int value; };
```

### 186. expired nested local does not conflict with a later struct in the script

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { if (1) { int Data; } struct Data { int value; }; Data item; }
```

### 187. anytype may be a contextual struct name

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct anytype { int value; }; scenario { anytype data; data.value = 5; }
```

### 188. anytype struct parameter accepts the matching struct

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct anytype { int value; }; int scenario inspect(anytype item) { return item.value; } scenario { anytype item; int result = inspect(item); }
```

### 189. anytype may be a struct field identifier

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Data { int anytype; }; scenario { Data dataNew; dataNew.anytype = 5; }
```

### 190. real may be a function identifier in a standalone call

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
int scenario real() { return 1; } scenario { real(); }
```

### 191. real may be a variable and parameter identifier

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
int scenario helper(int real) { return real; } scenario { int real = helper(5); }
```

### 192. real may be a struct field identifier

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Data { int real; }; scenario { Data value; value.real = 5; }
```

### 193. struct type is available after declaration

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
struct Group { int x; }; scenario { Group g; g.x = 5; }
```

### 194. label is available after its declaration

**Expected:** Compiles successfully in game and produces no LSP diagnostics.

```bhs
scenario { labels { status = 1 } int result = status; }
```
