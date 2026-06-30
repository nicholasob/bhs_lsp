# BHS Game Compile-Error Cases

Generated from the executable semantic regression corpus. Total: **296** standalone cases.

Run every snippet independently. Each is expected to fail compilation and produce an LSP diagnostic.

Synthetic built-in fixtures excluded because they cannot be compiled directly in game: **1**.

## Declarations And Calls

### 1. statement syntax and boolean literals are case-sensitive

**Expected:** At least one LSP diagnostic containing:

```text
Missing semicolon
```

```bhs
ScEnArIo { StAtIc InT Value = 1; RuN_OnCe { IF (TrUe) { VALUE += 1; } ElSe { VALUE = 0; } } TrIgGeR Tick (VaLuE > 0) { WhIlE (FaLsE) { BrEaK; } } }
```

### 2. mixed-case static qualifier is not syntax

**Expected:** At least one LSP diagnostic containing:

```text
Missing semicolon
```

```bhs
scenario { StAtIc int value = 1; }
```

### 3. mixed-case run_once statement is not syntax

**Expected:** At least one LSP diagnostic containing:

```text
Cannot find name 'RuN_OnCe'
```

```bhs
scenario { RuN_OnCe { } }
```

### 4. mixed-case if statement is not syntax

**Expected:** At least one LSP diagnostic containing:

```text
Cannot find function or script 'IF'
```

```bhs
scenario { IF (true) { } }
```

### 5. mixed-case true literal is not syntax

**Expected:** At least one LSP diagnostic containing:

```text
Cannot find name 'TrUe'
```

```bhs
scenario { int value = TrUe; }
```

### 6. mixed-case else clause is not syntax

**Expected:** At least one LSP diagnostic containing:

```text
Cannot find name 'ElSe'
```

```bhs
scenario { if (true) { } ElSe { } }
```

### 7. mixed-case trigger statement is not syntax

**Expected:** At least one LSP diagnostic containing:

```text
Cannot find name 'TrIgGeR'
```

```bhs
scenario { TrIgGeR Tick(1) { } }
```

### 8. mixed-case while statement is not syntax

**Expected:** At least one LSP diagnostic containing:

```text
Expected an expression
```

```bhs
scenario { WhIlE(false) { } }
```

### 9. mixed-case false literal is not syntax

**Expected:** At least one LSP diagnostic containing:

```text
Cannot find name 'FaLsE'
```

```bhs
scenario { int value = FaLsE; }
```

### 10. mixed-case break statement is not syntax

**Expected:** At least one LSP diagnostic containing:

```text
Cannot find name 'BrEaK'
```

```bhs
scenario { while (false) { BrEaK; } }
```

### 11. int is reserved as a lowercase identifier

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int int = 1; }
```

### 12. INT is reserved as an uppercase identifier

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int INT = 1; }
```

### 13. float is reserved as a lowercase identifier

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int float = 1; }
```

### 14. FLOAT is reserved as an uppercase identifier

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int FLOAT = 1; }
```

### 15. string is reserved as a lowercase identifier

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int string = 1; }
```

### 16. STRING is reserved as an uppercase identifier

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int STRING = 1; }
```

### 17. bool is reserved as a lowercase identifier

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int bool = 1; }
```

### 18. BOOL is reserved as an uppercase identifier

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int BOOL = 1; }
```

### 19. void is reserved as a lowercase identifier

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int void = 1; }
```

### 20. VOID is reserved as an uppercase identifier

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int VOID = 1; }
```

### 21. scenario is reserved as a lowercase identifier

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int scenario = 1; }
```

### 22. SCENARIO is reserved as an uppercase identifier

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int SCENARIO = 1; }
```

### 23. conquest is reserved as a lowercase identifier

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int conquest = 1; }
```

### 24. CONQUEST is reserved as an uppercase identifier

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int CONQUEST = 1; }
```

### 25. ai is reserved as a lowercase identifier

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int ai = 1; }
```

### 26. AI is reserved as an uppercase identifier

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int AI = 1; }
```

### 27. for is reserved as a lowercase identifier

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int for = 1; }
```

### 28. FOR is reserved as an uppercase identifier

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int FOR = 1; }
```

### 29. while is reserved as a lowercase identifier

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int while = 1; }
```

### 30. WHILE is reserved as an uppercase identifier

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int WHILE = 1; }
```

### 31. do is reserved as a lowercase identifier

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int do = 1; }
```

### 32. DO is reserved as an uppercase identifier

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int DO = 1; }
```

### 33. switch is reserved as a lowercase identifier

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int switch = 1; }
```

### 34. SWITCH is reserved as an uppercase identifier

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int SWITCH = 1; }
```

### 35. case is reserved as a lowercase identifier

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int case = 1; }
```

### 36. CASE is reserved as an uppercase identifier

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int CASE = 1; }
```

### 37. struct keyword spelling is reserved

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int struct = 1; }
```

### 38. static keyword spelling is reserved

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int static = 1; }
```

### 39. ref keyword spelling is reserved

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int ref = 1; }
```

### 40. if keyword spelling is reserved

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int if = 1; }
```

### 41. else keyword spelling is reserved

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int else = 1; }
```

### 42. default keyword spelling is reserved

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int default = 1; }
```

### 43. break keyword spelling is reserved

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int break = 1; }
```

### 44. continue keyword spelling is reserved

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int continue = 1; }
```

### 45. return keyword spelling is reserved

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int return = 1; }
```

### 46. trigger keyword spelling is reserved

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int trigger = 1; }
```

### 47. run_once keyword spelling is reserved

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int run_once = 1; }
```

### 48. labels keyword spelling is reserved

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int labels = 1; }
```

### 49. true keyword spelling is reserved

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int true = 1; }
```

### 50. false keyword spelling is reserved

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use reserved keyword
```

```bhs
scenario { int false = 1; }
```

### 51. invalid switch region is diagnosed once

**Expected:** Exactly one LSP diagnostic containing:

```text
Expected 'case' or 'default' in switch body
```

```bhs
scenario { int value = 1; switch (value) { value = 2; case 1: break; } }
```

### 52. struct declaration without trailing semicolon is invalid

**Expected:** At least one LSP diagnostic containing:

```text
Missing semicolon at end of statement
```

```bhs
struct Node { int value; }
```

### 53. ref struct parameter field assignment from parameter

**Expected:** At least one LSP diagnostic containing:

```text
visible variable has the same name
```

```bhs
struct Group { int x; }; int scenario update(ref Group g, int x) { g.x = x; return g.x; }
```

### 54. parenthesized same-name parameter assignment

**Expected:** At least one LSP diagnostic containing:

```text
visible variable has the same name
```

```bhs
struct Group { int x; }; int scenario update(ref Group g, int x) { g.x = (x); return g.x; }
```

### 55. same-name parameter blocks unrelated expression assignment

**Expected:** At least one LSP diagnostic containing:

```text
visible variable has the same name
```

```bhs
struct Group { int x; }; int scenario update(ref Group g, int x) { g.x = 5 + 5; return g.x; }
```

### 56. same-name parameter blocks expression using that parameter

**Expected:** At least one LSP diagnostic containing:

```text
visible variable has the same name
```

```bhs
struct Group { int x; }; int scenario update(ref Group g, int x) { g.x = x + 5; return g.x; }
```

### 57. value struct parameter field assignment from parameter

**Expected:** At least one LSP diagnostic containing:

```text
visible variable has the same name
```

```bhs
struct Group { int x; }; int scenario update(Group g, int x) { g.x = x; return g.x; }
```

### 58. ref struct parameter field compound assignment

**Expected:** At least one LSP diagnostic containing:

```text
visible variable has the same name
```

```bhs
struct Group { int x; }; int scenario update(ref Group g, int x) { g.x += 5; return g.x; }
```

### 59. local variable collides with assigned field

**Expected:** At least one LSP diagnostic containing:

```text
visible variable has the same name
```

```bhs
struct Group { int x; }; scenario { int x; Group g; g.x = 5; }
```

### 60. earlier declarator collides with later initializer

**Expected:** At least one LSP diagnostic containing:

```text
visible variable has the same name
```

```bhs
struct Group { int x; }; scenario { Group g; int x, result = g.x; }
```

### 61. earlier local variable collides with later field access

**Expected:** At least one LSP diagnostic containing:

```text
visible variable has the same name
```

```bhs
struct Group { int x; }; scenario { Group g; int x; g.x = 5; }
```

### 62. local variable collides with read field

**Expected:** At least one LSP diagnostic containing:

```text
visible variable has the same name
```

```bhs
struct Group { int x; }; scenario { int x; Group g; int result = g.x; }
```

### 63. local variable collides with array dot member

**Expected:** At least one LSP diagnostic containing:

```text
visible variable has the same name
```

```bhs
scenario { int length; int[] values; int result = values.length; }
```

### 64. bare struct field cannot match available user function name

**Expected:** At least one LSP diagnostic containing:

```text
Cannot use function or script name 'inspect'
```

```bhs
int scenario inspect(int value) { return value; } struct Group { int inspect; }; scenario { Group g; int result = g.inspect; }
```

### 65. local struct field increment

**Expected:** At least one LSP diagnostic containing:

```text
dotted members are not incrementable
```

```bhs
struct Group { int x; }; scenario { static Group g; g.x++; }
```

### 66. array element as ref argument

**Expected:** At least one LSP diagnostic containing:

```text
No overload for 'set_int'
```

```bhs
int scenario set_int(ref int value) { value = 5; return value; } scenario { static int[] values; int result = set_int(values[0]); }
```

### 67. local variable collides with dotted function call

**Expected:** At least one LSP diagnostic containing:

```text
conflicts with a previously declared function or script
```

```bhs
struct Group { int x; }; int scenario inspect(Group g) { return g.x; } scenario { int inspect; Group g; int result = g.inspect(); }
```

### 68. local variable collides with ordinary function call

**Expected:** At least one LSP diagnostic containing:

```text
conflicts with a previously declared function or script
```

```bhs
int scenario inspect(int value) { return value; } scenario { int inspect; int result = inspect(5); }
```

### 69. later local declaration conflicts with earlier dotted function

**Expected:** At least one LSP diagnostic containing:

```text
conflicts with a previously declared function or script
```

```bhs
struct Group { int x; }; int scenario inspect(Group g) { return g.x; } scenario { Group g; int result = g.inspect(); int inspect; }
```

### 70. later local declaration conflicts with earlier ordinary function

**Expected:** At least one LSP diagnostic containing:

```text
conflicts with a previously declared function or script
```

```bhs
int scenario inspect(int value) { return value; } scenario { int result = inspect(5); int inspect; }
```

### 71. typed variable cannot reuse earlier user function name

**Expected:** At least one LSP diagnostic containing:

```text
conflicts with a previously declared function or script
```

```bhs
int scenario inspect(int value) { return value; } scenario { int inspect; }
```

### 72. implicit variable cannot reuse earlier user function name

**Expected:** At least one LSP diagnostic containing:

```text
conflicts with a previously declared function or script
```

```bhs
int scenario inspect(int value) { return value; } scenario { inspect = 5; }
```

### 73. parameter cannot reuse earlier user function name

**Expected:** At least one LSP diagnostic containing:

```text
conflicts with a previously declared function or script
```

```bhs
int scenario inspect(int value) { return value; } int scenario relay(int inspect) { return 1; }
```

### 74. overload parameter cannot match already available function name

**Expected:** At least one LSP diagnostic containing:

```text
conflicts with a previously declared function or script
```

```bhs
int scenario inspect(int inspect) { return inspect; } string scenario inspect(string inspect) { return inspect; }
```

### 75. trigger cannot reuse earlier user function name

**Expected:** At least one LSP diagnostic containing:

```text
conflicts with a previously declared function or script
```

```bhs
int scenario inspect(int value) { return value; } scenario { trigger inspect(1) { } }
```

### 76. trigger cannot reuse earlier visible variable name

**Expected:** At least one LSP diagnostic containing:

```text
conflicts with a visible variable or parameter
```

```bhs
scenario { int inspect; trigger inspect(1) { } }
```

### 77. variable cannot reuse earlier trigger name

**Expected:** At least one LSP diagnostic containing:

```text
conflicts with a previously declared trigger
```

```bhs
scenario { trigger inspect(1) { } int inspect; }
```

### 78. trigger cannot reuse earlier label name

**Expected:** At least one LSP diagnostic containing:

```text
conflicts with a previously declared label
```

```bhs
scenario { labels { inspect = 1 } trigger inspect(1) { } }
```

### 79. label cannot reuse earlier trigger name

**Expected:** At least one LSP diagnostic containing:

```text
conflicts with a previously declared trigger
```

```bhs
scenario { trigger inspect(1) { } labels { inspect = 1 } }
```

### 80. label cannot reuse earlier user function name

**Expected:** At least one LSP diagnostic containing:

```text
conflicts with a previously declared function or script
```

```bhs
int scenario inspect(int value) { return value; } scenario { labels { inspect = 1 } }
```

### 81. user function cannot reuse earlier global label name

**Expected:** At least one LSP diagnostic containing:

```text
conflicts with a label of the same name
```

```bhs
scenario { labels { inspect = 1 } } int scenario inspect(int value) { return value; }
```

### 82. label blocks same-named user function call

**Expected:** At least one LSP diagnostic containing:

```text
conflicts with a previously declared function or script
```

```bhs
int scenario inspect(int value) { return value; } scenario { labels { inspect = 1 } int result = inspect(5); }
```

### 83. later overload is not callable through earlier overload name

**Expected:** At least one LSP diagnostic containing:

```text
No overload for 'convert'
```

```bhs
int scenario convert(int value) { return value; } scenario { string result = convert("text"); } string scenario convert(string value) { return value; }
```

### 84. parameter lists reject a trailing comma

**Expected:** At least one LSP diagnostic containing:

```text
Trailing commas are not allowed in parameter lists
```

```bhs
int scenario helper(int value,) { return value; }
```

### 85. static is not a valid parameter qualifier

**Expected:** At least one LSP diagnostic containing:

```text
only 'ref' is supported
```

```bhs
int scenario helper(static int value) { return value; }
```

### 86. local is not a valid parameter qualifier

**Expected:** At least one LSP diagnostic containing:

```text
only 'ref' is supported
```

```bhs
int scenario helper(local int value) { return value; }
```

### 87. named script definitions reject a trailing semicolon

**Expected:** At least one LSP diagnostic containing:

```text
Script definitions cannot be followed by a semicolon
```

```bhs
int scenario helper() { return 1; }; scenario { int result = helper(); }
```

### 88. anonymous script definitions reject a trailing semicolon

**Expected:** At least one LSP diagnostic containing:

```text
Script definitions cannot be followed by a semicolon
```

```bhs
scenario { int value = 1; };
```

### 89. prototype constrains the return type of its definition

**Expected:** At least one LSP diagnostic containing:

```text
differs only in return type
```

```bhs
int scenario helper(int value); string scenario helper(int value) { return "text"; }
```

### 90. same-typed overloads with different parameter names are ambiguous when called

**Expected:** At least one LSP diagnostic containing:

```text
Ambiguous call to 'helper'
```

```bhs
int scenario helper(int value) { return 1; } int scenario helper(int other) { return 2; } scenario { int result = helper(5); }
```

### 91. function names and parameter names are case-insensitive for duplicate identity

**Expected:** At least one LSP diagnostic containing:

```text
same parameters is already declared
```

```bhs
int scenario Inspect(int value) { return value; } int scenario inspect(int value) { return value; }
```

### 92. calls cannot fall back to another script category

**Expected:** At least one LSP diagnostic containing:

```text
Cannot find function or script 'helper'
```

```bhs
int scenario helper(int value) { return value; } int conquest caller() { return helper(1); }
```

### 93. return type alone cannot distinguish overloads

**Expected:** At least one LSP diagnostic containing:

```text
differs only in return type
```

```bhs
int scenario helper(int value) { return value; } string scenario helper(int value) { return "text"; }
```

### 94. prototype with a different parameter name creates an ambiguous overload

**Expected:** At least one LSP diagnostic containing:

```text
exactly match 2 overloads
```

```bhs
int scenario helper(int value); int scenario helper(int other) { return other; } scenario { int result = helper(5); }
```

### 95. value and ref exact matches are ambiguous for a writable argument

**Expected:** At least one LSP diagnostic containing:

```text
exactly match 2 overloads
```

```bhs
int scenario helper(int value) { return 1; } int scenario helper(ref int value) { return 2; } scenario { int value = 5; int result = helper(value); }
```

## Control Flow And Operators

### 96. ternary type comes from string false branch

**Expected:** At least one LSP diagnostic containing:

```text
explicit cast is required
```

```bhs
scenario { int condition = 1; result = condition ? 5 : "text"; int value = result; }
```

### 97. float ternary condition is invalid

**Expected:** At least one LSP diagnostic containing:

```text
cannot be evaluated as a boolean value
```

```bhs
scenario { float condition = 1.5; int result = condition ? 1 : 0; }
```

### 98. same trigger name remains invalid within one scenario block

**Expected:** At least one LSP diagnostic containing:

```text
Duplicate trigger name 'later'
```

```bhs
scenario { trigger later(1) { } trigger later(1) { } }
```

### 99. duplicate switch case is invalid

**Expected:** At least one LSP diagnostic containing:

```text
Duplicate case statement '1'
```

```bhs
scenario { int value = 1; switch (value) { case 1: break; case 1: break; } }
```

### 100. struct declarations are invalid directly inside switch cases

**Expected:** At least one LSP diagnostic containing:

```text
Struct declarations are not valid directly inside switch cases
```

```bhs
scenario { switch (1) { case 1: struct Data { int value; }; break; } }
```

### 101. invalid switch-case struct does not become available after the switch

**Expected:** At least one LSP diagnostic containing:

```text
Unknown type 'Data'
```

```bhs
scenario { switch (1) { case 1: struct Data { int value; }; break; } Data item; }
```

### 102. same switch case rejects duplicate local variable

**Expected:** At least one LSP diagnostic containing:

```text
already declared
```

```bhs
scenario { int value = 1; switch (value) { case 1: int result = 1; int result = 2; break; } }
```

### 103. string case is invalid for int switch

**Expected:** At least one LSP diagnostic containing:

```text
explicit cast is required
```

```bhs
scenario { int value = 1; switch (value) { case "1": break; } }
```

### 104. unary plus is invalid in switch case

**Expected:** At least one LSP diagnostic containing:

```text
Unary operator '+' is not valid
```

```bhs
scenario { int value = 1; switch (value) { case +1: break; } }
```

### 105. unary minus is invalid in switch case

**Expected:** At least one LSP diagnostic containing:

```text
Unary operator '-' is not valid
```

```bhs
scenario { int value = 1; switch (value) { case -1: break; } }
```

### 106. logical not is invalid in switch case

**Expected:** At least one LSP diagnostic containing:

```text
Unary operator '!' is not valid
```

```bhs
scenario { int value = 1; switch (value) { case !1: break; } }
```

### 107. binary expression is invalid in switch case

**Expected:** At least one LSP diagnostic containing:

```text
Binary operator '+' is not valid
```

```bhs
scenario { int value = 2; switch (value) { case 1 + 1: break; } }
```

### 108. parenthesized expression is invalid in switch case

**Expected:** At least one LSP diagnostic containing:

```text
Parenthesized expressions are not valid
```

```bhs
scenario { int value = 1; switch (value) { case (1): break; } }
```

### 109. leading-zero integer case duplicates normalized value

**Expected:** At least one LSP diagnostic containing:

```text
Duplicate case statement '1'
```

```bhs
scenario { int value = 1; switch (value) { case 1: break; case 01: break; } }
```

### 110. switch cannot contain multiple defaults

**Expected:** At least one LSP diagnostic containing:

```text
more than one default case
```

```bhs
scenario { int value = 1; switch (value) { default: break; default: break; } }
```

### 111. default must be the final switch section

**Expected:** At least one LSP diagnostic containing:

```text
cannot appear after default
```

```bhs
scenario { int value = 1; switch (value) { default: break; case 1: break; } }
```

### 112. label cases compare by resolved value

**Expected:** At least one LSP diagnostic containing:

```text
Duplicate case statement '1'
```

```bhs
scenario { labels { first = 1, second = 1 } int value = 1; switch (value) { case first: break; case second: break; } }
```

### 113. int case is invalid for float switch without cast

**Expected:** At least one LSP diagnostic containing:

```text
explicit cast is required
```

```bhs
scenario { float value = 1.0; switch (value) { case 1: break; } }
```

### 114. cast expression is invalid in switch case

**Expected:** At least one LSP diagnostic containing:

```text
Cast expressions are not valid
```

```bhs
scenario { float value = 1.0; switch (value) { case (float)1: break; } }
```

### 115. function call is invalid in switch case

**Expected:** At least one LSP diagnostic containing:

```text
Function calls are not valid
```

```bhs
int scenario constant() { return 1; } scenario { int value = 1; switch (value) { case constant(): break; } }
```

### 116. ternary expression is invalid in switch case

**Expected:** At least one LSP diagnostic containing:

```text
Ternary expressions are not valid
```

```bhs
scenario { int condition = 1; int value = 1; switch (value) { case condition ? 1 : 2: break; } }
```

### 117. struct field is invalid in switch case

**Expected:** At least one LSP diagnostic containing:

```text
Runtime storage values are not valid
```

```bhs
struct Data { int code; }; scenario { Data item; int value = 1; switch (value) { case item.code: break; } }
```

### 118. array element is invalid in switch case

**Expected:** At least one LSP diagnostic containing:

```text
Runtime storage values are not valid
```

```bhs
scenario { int[] values; int value = 1; switch (value) { case values[0]: break; } }
```

### 119. ordinary variable is invalid in switch case

**Expected:** At least one LSP diagnostic containing:

```text
must refer to a label constant
```

```bhs
scenario { int expected = 1; int value = 1; switch (value) { case expected: break; } }
```

### 120. negative number is invalid as a label value

**Expected:** At least one LSP diagnostic containing:

```text
Label values must be a constant literal
```

```bhs
scenario { labels { negative = -1 } }
```

### 121. unary plus number is invalid as a label value

**Expected:** At least one LSP diagnostic containing:

```text
Label values must be a constant literal
```

```bhs
scenario { labels { positive = +1 } }
```

### 122. unary plus is invalid in an integer initializer

**Expected:** At least one LSP diagnostic containing:

```text
Unary operator '+' is not valid in an expression
```

```bhs
scenario { int value = +1; }
```

### 123. unary minus is invalid for string values

**Expected:** At least one LSP diagnostic containing:

```text
Operator '-' is not valid for type 'string'
```

```bhs
scenario { result = -"text"; }
```

### 124. logical not rejects struct values

**Expected:** At least one LSP diagnostic containing:

```text
Operator '!' is not valid for type 'Data'
```

```bhs
struct Data { int value; }; scenario { Data item; bool result = !item; }
```

### 125. logical not rejects array values

**Expected:** At least one LSP diagnostic containing:

```text
Operator '!' is not valid for type 'int[]'
```

```bhs
scenario { int[] values; bool result = !values; }
```

### 126. logical not rejects void values

**Expected:** At least one LSP diagnostic containing:

```text
Operator '!' is not valid for type 'void'
```

```bhs
void scenario nothing() { } scenario { bool result = !nothing(); }
```

### 127. comparisons reject boolean and float pairings

**Expected:** At least one LSP diagnostic containing:

```text
explicit cast is required
```

```bhs
scenario { bool b = true; bool result = b < 1.0; }
```

### 128. comparisons reject float and boolean pairings

**Expected:** At least one LSP diagnostic containing:

```text
explicit cast is required
```

```bhs
scenario { bool b = true; bool result = 1.0 < b; }
```

### 129. comparisons reject boolean and string pairings

**Expected:** At least one LSP diagnostic containing:

```text
explicit cast is required
```

```bhs
scenario { bool b = true; bool result = b == "1"; }
```

### 130. comparisons reject string and boolean pairings

**Expected:** At least one LSP diagnostic containing:

```text
explicit cast is required
```

```bhs
scenario { bool b = true; bool result = "1" != b; }
```

### 131. non-additive arithmetic rejects boolean and float pairings

**Expected:** At least one LSP diagnostic containing:

```text
explicit cast is required
```

```bhs
scenario { bool b = true; result = b - 1.0; }
```

### 132. non-additive arithmetic rejects float and boolean pairings

**Expected:** At least one LSP diagnostic containing:

```text
explicit cast is required
```

```bhs
scenario { bool b = true; result = 1.0 * b; }
```

### 133. addition rejects boolean and float pairings

**Expected:** At least one LSP diagnostic containing:

```text
explicit cast is required
```

```bhs
scenario { bool b = true; result = b + 1.0; }
```

### 134. addition rejects float and boolean pairings

**Expected:** At least one LSP diagnostic containing:

```text
explicit cast is required
```

```bhs
scenario { bool b = true; result = 1.0 + b; }
```

### 135. addition rejects boolean and string pairings

**Expected:** At least one LSP diagnostic containing:

```text
explicit cast is required
```

```bhs
scenario { bool b = true; result = b + "1"; }
```

### 136. addition rejects string and boolean pairings

**Expected:** At least one LSP diagnostic containing:

```text
explicit cast is required
```

```bhs
scenario { bool b = true; result = "1" + b; }
```

### 137. binary and result cannot be assigned to int

**Expected:** At least one LSP diagnostic containing:

```text
explicit cast is required
```

```bhs
scenario { int result = 5 & 3; }
```

### 138. binary or result cannot be assigned to float

**Expected:** At least one LSP diagnostic containing:

```text
explicit cast is required
```

```bhs
scenario { float result = 5 | 2; }
```

### 139. binary and result cannot be assigned to string

**Expected:** At least one LSP diagnostic containing:

```text
type 'bool' to 'string'
```

```bhs
scenario { string result = 5 & 3; }
```

### 140. bitwise complement remains unsupported

**Expected:** At least one LSP diagnostic containing:

```text
Unknown symbol "~"
```

```bhs
scenario { int result = ~5; }
```

### 141. compound bitwise and remains unsupported

**Expected:** At least one LSP diagnostic containing:

```text
Expected an expression
```

```bhs
scenario { int value = 5; value &= 3; }
```

### 142. compound bitwise or remains unsupported

**Expected:** At least one LSP diagnostic containing:

```text
Expected an expression
```

```bhs
scenario { int value = 5; value |= 2; }
```

### 143. compound shift rejects a float target

**Expected:** At least one LSP diagnostic containing:

```text
Operator '<<=' is not valid for float values
```

```bhs
scenario { float value = 1.0; value <<= 2; }
```

### 144. compound shift rejects a float operand

**Expected:** At least one LSP diagnostic containing:

```text
Operator '>>=' is not valid for float values
```

```bhs
scenario { int value = 1; value >>= 2.0; }
```

### 145. shift rejects void as its left operand

**Expected:** At least one LSP diagnostic containing:

```text
cannot use a void value as its left operand
```

```bhs
void scenario nothing() { } scenario { result = nothing() << 1; }
```

### 146. compound shift rejects boolean operand for integer target

**Expected:** At least one LSP diagnostic containing:

```text
explicit cast is required
```

```bhs
scenario { int value = 1; bool operand = true; value <<= operand; }
```

### 147. compound shift rejects string targets

**Expected:** At least one LSP diagnostic containing:

```text
Operator '<<=' is not valid for string values
```

```bhs
scenario { string value = "1"; value <<= 1; }
```

### 148. string plus-equals rejects boolean operands

**Expected:** At least one LSP diagnostic containing:

```text
type 'bool' to 'string'
```

```bhs
scenario { string value = "1"; bool operand = true; value += operand; }
```

### 149. conditional expression is not an assignment target

**Expected:** At least one LSP diagnostic containing:

```text
must be a writable variable, field, or array element
```

```bhs
scenario { int first; int second; int condition = 1; (condition ? first : second) = 5; }
```

### 150. field cannot be accessed through a conditional struct value

**Expected:** At least one LSP diagnostic containing:

```text
must be a struct variable
```

```bhs
struct Data { int code; }; scenario { Data first; Data second; int condition = 1; (condition ? first : second).code = 5; }
```

### 151. parenthesized variable is not an assignment target

**Expected:** At least one LSP diagnostic containing:

```text
must be a writable variable, field, or array element
```

```bhs
scenario { int value; (value) = 5; }
```

### 152. parenthesized variable is not a compound-assignment target

**Expected:** At least one LSP diagnostic containing:

```text
must be a writable variable, field, or array element
```

```bhs
scenario { int value = 1; ((value)) += 1; }
```

## Types And Operators

### 153. array return dimensions must match

**Expected:** At least one LSP diagnostic containing:

```text
to 'int[][]'
```

```bhs
int[][] scenario create() { int[] result; return result; }
```

### 154. struct-returning script cannot have an empty body

**Expected:** At least one LSP diagnostic containing:

```text
aggregate-returning scripts require a terminal return statement
```

```bhs
struct Data { int value; }; Data scenario create() { }
```

### 155. array-returning script cannot have an empty body

**Expected:** At least one LSP diagnostic containing:

```text
aggregate-returning scripts require a terminal return statement
```

```bhs
int[] scenario create() { }
```

### 156. multidimensional-array-returning script cannot have an empty body

**Expected:** At least one LSP diagnostic containing:

```text
aggregate-returning scripts require a terminal return statement
```

```bhs
int[][] scenario create() { }
```

### 157. aggregate return in only one branch still permits fallthrough

**Expected:** At least one LSP diagnostic containing:

```text
aggregate-returning scripts require a terminal return statement
```

```bhs
struct Data { int value; }; Data scenario create(int condition) { if (condition) { Data item; return item; } }
```

### 158. nested returns in both if branches do not satisfy terminal return rule

**Expected:** At least one LSP diagnostic containing:

```text
aggregate-returning scripts require a terminal return statement
```

```bhs
struct Data { int value; }; Data scenario create(int condition) { Data first; Data second; if (condition) { return first; } else { return second; } }
```

### 159. identical struct layouts do not distinguish overload signatures

**Expected:** At least one LSP diagnostic containing:

```text
Function 'inspect' with the same parameters is already declared
```

```bhs
struct First { int value; }; struct Second { int value; }; int scenario inspect(First item) { return 1; } int scenario inspect(Second item) { return 2; }
```

### 160. recursively identical struct layouts do not distinguish overload signatures

**Expected:** At least one LSP diagnostic containing:

```text
Function 'inspect' with the same parameters is already declared
```

```bhs
struct InnerFirst { int value; }; struct InnerSecond { int value; }; struct First { InnerFirst child; }; struct Second { InnerSecond child; }; int scenario inspect(First item) { return 1; } int scenario inspect(Second item) { return 2; }
```

### 161. void and int fields have the same overload layout identity

**Expected:** At least one LSP diagnostic containing:

```text
Function 'inspect' with the same parameters is already declared
```

```bhs
struct First { void value; }; struct Second { int value; }; int scenario inspect(First item) { return 1; } int scenario inspect(Second item) { return 2; }
```

### 162. parentheses do not make a computed value writable for ref

**Expected:** At least one LSP diagnostic containing:

```text
No overload for 'set'
```

```bhs
int scenario set(ref int value) { value = 5; return value; } scenario { int first; int second; int result = set((first + second)); }
```

### 163. script cannot return a struct type declared later

**Expected:** At least one LSP diagnostic containing:

```text
Unknown type 'Data'
```

```bhs
Data scenario create() { Data result; return result; } struct Data { int value; };
```

### 164. struct-returning script validates its returned value

**Expected:** At least one LSP diagnostic containing:

```text
to 'Data'
```

```bhs
struct Data { int value; }; Data scenario create() { return 5; }
```

### 165. binary expression is not an assignment target

**Expected:** At least one LSP diagnostic containing:

```text
must be a writable variable, field, or array element
```

```bhs
scenario { int first = 1; int second = 2; (first + second) = 5; }
```

### 166. boolean expressions do not implicitly convert to string

**Expected:** At least one LSP diagnostic containing:

```text
type 'bool' to 'string'
```

```bhs
scenario { string value = !1; }
```

### 167. boolean expression does not implicitly convert for string arguments

**Expected:** At least one LSP diagnostic containing:

```text
No overload for 'inspect' matches argument types (bool)
```

```bhs
int scenario inspect(string value) { return 1; } scenario { int result = inspect(!1); }
```

### 168. boolean expression does not implicitly convert in string returns

**Expected:** At least one LSP diagnostic containing:

```text
type 'bool'
```

```bhs
string scenario inspect() { return !1; }
```

### 169. boolean keyword is ambiguous between integer and boolean overloads

**Expected:** At least one LSP diagnostic containing:

```text
exactly match 2 overloads
```

```bhs
int scenario inspect(int value) { return 1; } int scenario inspect(bool value) { return 2; } scenario { int result = inspect(true); }
```

### 170. integer argument is ambiguous between integer and boolean overloads

**Expected:** At least one LSP diagnostic containing:

```text
exactly match 2 overloads
```

```bhs
int scenario inspect(int value) { return 1; } int scenario inspect(bool value) { return 2; } scenario { int result = inspect(1); }
```

### 171. struct equality rejects a scalar operand

**Expected:** At least one LSP diagnostic containing:

```text
requires matching aggregate operand types
```

```bhs
struct Data { int value; }; scenario { Data item; bool result = item == 0; }
```

### 172. struct equality requires the same nominal struct type

**Expected:** At least one LSP diagnostic containing:

```text
requires matching aggregate operand types
```

```bhs
struct First { int value; }; struct Second { int value; }; scenario { First first; Second second; bool result = first == second; }
```

### 173. struct equality rejects an array operand

**Expected:** At least one LSP diagnostic containing:

```text
requires matching aggregate operand types
```

```bhs
struct Data { int value; }; scenario { Data item; Data[] items; bool result = item != items; }
```

### 174. array values do not support relational comparisons

**Expected:** At least one LSP diagnostic containing:

```text
not valid for aggregate operands
```

```bhs
scenario { int[] first; int[] second; bool result = first < second; }
```

### 175. multidimensional arrays do not support relational comparisons

**Expected:** At least one LSP diagnostic containing:

```text
not valid for aggregate operands
```

```bhs
scenario { int[][] first; int[][] second; bool result = first >= second; }
```

### 176. struct values do not support relational comparisons

**Expected:** At least one LSP diagnostic containing:

```text
not valid for aggregate operands
```

```bhs
struct Data { int value; }; scenario { Data first; Data second; bool result = first < second; }
```

### 177. nested struct values do not support relational comparisons

**Expected:** At least one LSP diagnostic containing:

```text
not valid for aggregate operands
```

```bhs
struct Inner { int value; }; struct Outer { Inner child; }; scenario { Outer first; Outer second; bool result = first >= second; }
```

### 178. array equality requires matching dimensions

**Expected:** At least one LSP diagnostic containing:

```text
requires matching aggregate operand types
```

```bhs
scenario { int[] first; int[][] second; bool result = first == second; }
```

### 179. array inequality requires matching element types

**Expected:** At least one LSP diagnostic containing:

```text
requires matching aggregate operand types
```

```bhs
scenario { int[] first; float[] second; bool result = first != second; }
```

### 180. array equality rejects a scalar operand

**Expected:** At least one LSP diagnostic containing:

```text
requires matching aggregate operand types
```

```bhs
scenario { int[] values; bool result = values == 0; }
```

### 181. adjacent and combined switch strings are duplicate constants

**Expected:** At least one LSP diagnostic containing:

```text
Duplicate case statement
```

```bhs
scenario { string value = "firstsecond"; switch (value) { case "first" "second": break; case "firstsecond": break; } }
```

### 182. string concatenation rejects struct values

**Expected:** At least one LSP diagnostic containing:

```text
not valid for aggregate or void operands
```

```bhs
struct Data { int value; }; scenario { Data item; string result = "item=" + item; }
```

### 183. addition rejects a struct in either operand position

**Expected:** At least one LSP diagnostic containing:

```text
not valid for aggregate or void operands
```

```bhs
struct Data { int value; }; scenario { Data item; first = item + 1; second = 1 + item; }
```

### 184. addition rejects an array in either operand position

**Expected:** At least one LSP diagnostic containing:

```text
not valid for aggregate or void operands
```

```bhs
scenario { int[] values; first = values + 1; second = "x" + values; }
```

### 185. addition rejects void in either operand position

**Expected:** At least one LSP diagnostic containing:

```text
not valid for aggregate or void operands
```

```bhs
void scenario nothing() { } scenario { first = nothing() + 1; second = "x" + nothing(); }
```

### 186. subtraction rejects aggregate operands

**Expected:** At least one LSP diagnostic containing:

```text
Operator '-' is not valid for aggregate or void operands
```

```bhs
struct Data { int value; }; scenario { Data item; result = item - 1; }
```

### 187. multiplication rejects aggregate operands

**Expected:** At least one LSP diagnostic containing:

```text
Operator '*' is not valid for aggregate or void operands
```

```bhs
scenario { int[] values; result = 1 * values; }
```

### 188. division rejects void operands

**Expected:** At least one LSP diagnostic containing:

```text
Operator '/' is not valid for aggregate or void operands
```

```bhs
void scenario nothing() { } scenario { result = nothing() / 1; }
```

### 189. power rejects aggregate operands

**Expected:** At least one LSP diagnostic containing:

```text
Operator '^' is not valid for aggregate or void operands
```

```bhs
struct Data { int value; }; scenario { Data item; result = 1 ^ item; }
```

### 190. modulo rejects aggregate operands

**Expected:** At least one LSP diagnostic containing:

```text
Operator '%' is not valid for aggregate or void operands
```

```bhs
scenario { int[] values; result = values % 1; }
```

### 191. string plus-equals rejects struct values

**Expected:** At least one LSP diagnostic containing:

```text
not valid for aggregate or void operands
```

```bhs
struct Data { int value; }; scenario { Data item; string result; result += item; }
```

### 192. string plus-equals rejects array values

**Expected:** At least one LSP diagnostic containing:

```text
not valid for aggregate or void operands
```

```bhs
scenario { int[] values; string result; result += values; }
```

### 193. string plus-equals rejects void values

**Expected:** At least one LSP diagnostic containing:

```text
not valid for aggregate or void operands
```

```bhs
void scenario nothing() { } scenario { string result; result += nothing(); }
```

### 194. compound addition rejects struct sources for scalar targets

**Expected:** At least one LSP diagnostic containing:

```text
not valid for aggregate or void operands
```

```bhs
struct Data { int value; }; scenario { int result = 1; Data item; result += item; }
```

### 195. compound arithmetic rejects array sources for scalar targets

**Expected:** At least one LSP diagnostic containing:

```text
not valid for aggregate or void operands
```

```bhs
scenario { int result = 1; int[] values; result *= values; }
```

### 196. compound arithmetic rejects scalar sources for struct targets

**Expected:** At least one LSP diagnostic containing:

```text
not valid for aggregate or void operands
```

```bhs
struct Data { int value; }; scenario { Data item; item -= 1; }
```

### 197. compound arithmetic rejects scalar sources for array targets

**Expected:** At least one LSP diagnostic containing:

```text
not valid for aggregate or void operands
```

```bhs
scenario { int[] values; values /= 1; }
```

### 198. compound power rejects aggregate operands

**Expected:** At least one LSP diagnostic containing:

```text
not valid for aggregate or void operands
```

```bhs
struct Data { int value; }; scenario { int result = 1; Data item; result ^= item; }
```

### 199. compound shifts reject aggregate operands

**Expected:** At least one LSP diagnostic containing:

```text
not valid for aggregate or void operands
```

```bhs
scenario { int result = 1; int[] values; result <<= values; }
```

### 200. compound operators reject void operands

**Expected:** At least one LSP diagnostic containing:

```text
not valid for aggregate or void operands
```

```bhs
void scenario nothing() { } scenario { int result = 1; result += nothing(); }
```

### 201. character and integer cases compare by character code

**Expected:** At least one LSP diagnostic containing:

```text
Duplicate case statement '65'
```

```bhs
scenario { int value = 65; switch (value) { case 'A': break; case 65: break; } }
```

### 202. true and one are duplicate boolean-switch cases

**Expected:** At least one LSP diagnostic containing:

```text
Duplicate case statement '1'
```

```bhs
scenario { bool value = true; switch (value) { case true: break; case 1: break; } }
```

### 203. true and one are duplicate integer cases

**Expected:** At least one LSP diagnostic containing:

```text
Duplicate case statement '1'
```

```bhs
scenario { int value = 1; switch (value) { case true: break; case 1: break; } }
```

### 204. false and zero are duplicate integer cases

**Expected:** At least one LSP diagnostic containing:

```text
Duplicate case statement '0'
```

```bhs
scenario { int value = 0; switch (value) { case false: break; case 0: break; } }
```

### 205. boolean label and integer literal compare by integer value

**Expected:** At least one LSP diagnostic containing:

```text
Duplicate case statement '1'
```

```bhs
scenario { labels { truth = true } int value = 1; switch (value) { case truth: break; case 1: break; } }
```

### 206. implicit label continues a preceding explicit integer value

**Expected:** At least one LSP diagnostic containing:

```text
Duplicate case statement '6'
```

```bhs
scenario { labels { first = 5, second } int value = 6; switch (value) { case second: break; case 6: break; } }
```

### 207. implicit label sequence continues across multiple entries

**Expected:** At least one LSP diagnostic containing:

```text
Duplicate case statement '7'
```

```bhs
scenario { labels { first = 5, second, third } int value = 7; switch (value) { case third: break; case 7: break; } }
```

### 208. implicit label continues a boolean value as an integer

**Expected:** At least one LSP diagnostic containing:

```text
Duplicate case statement '2'
```

```bhs
scenario { labels { first = true, second } int value = 2; switch (value) { case second: break; case 2: break; } }
```

### 209. implicit label continues a character value as an integer

**Expected:** At least one LSP diagnostic containing:

```text
Duplicate case statement '66'
```

```bhs
scenario { labels { first = 'A', second } int value = 66; switch (value) { case second: break; case 66: break; } }
```

### 210. equivalent hexadecimal and decimal switch cases are duplicates

**Expected:** At least one LSP diagnostic containing:

```text
Duplicate case statement '16'
```

```bhs
scenario { int value = 16; switch (value) { case 0x10: break; case 16: break; } }
```

## Arrays And Declarations

### 211. array receiver requires a compatible first parameter

**Expected:** At least one LSP diagnostic containing:

```text
Invalid receiver call to 'inspect'
```

```bhs
int scenario inspect(string item, int value) { return value; } scenario { int[] item; int result = item.inspect(5); }
```

### 212. trailing dimensions participate in assignment checks

**Expected:** At least one LSP diagnostic containing:

```text
explicit cast is required
```

```bhs
scenario { int row[]; int matrix[][]; row = matrix; }
```

### 213. returned array value cannot be indexed

**Expected:** At least one LSP diagnostic containing:

```text
Array index may only be used on an array variable
```

```bhs
int[] scenario create() { int[] result; return result; } scenario { int value = create()[0]; }
```

### 214. returned array value cannot be indexed for assignment

**Expected:** At least one LSP diagnostic containing:

```text
Array index may only be used on an array variable
```

```bhs
int[] scenario create() { int[] result; return result; } scenario { create()[0] = 5; }
```

### 215. array assignment requires the same number of dimensions

**Expected:** At least one LSP diagnostic containing:

```text
explicit cast is required
```

```bhs
scenario { int[][] values; int[] row; row = values; }
```

### 216. struct cannot contain a scalar field of its own type

**Expected:** At least one LSP diagnostic containing:

```text
cannot contain a field of its own type
```

```bhs
struct Node { Node next; int value; };
```

### 217. struct cannot contain an array field of its own type

**Expected:** At least one LSP diagnostic containing:

```text
cannot contain a field of its own type
```

```bhs
struct Node { Node[][] children; int value; };
```

### 218. later struct type is unavailable to an earlier struct field

**Expected:** At least one LSP diagnostic containing:

```text
Unknown type 'First[][]'
```

```bhs
struct Container { First values[][]; }; struct First { int value; };
```

### 219. trailing void array struct field remains invalid

**Expected:** At least one LSP diagnostic containing:

```text
cannot have array type 'void[]'
```

```bhs
struct Data { void values[][]; };
```

### 220. malformed comma-separated struct fields recover without parser non-progress

**Expected:** At least one LSP diagnostic containing:

```text
Expected an identifier
```

```bhs
struct Data { int first[], ; };
```

### 221. array argument requires matching dimensionality

**Expected:** At least one LSP diagnostic containing:

```text
No overload for 'inspect' matches argument types (int[][])
```

```bhs
int scenario inspect(int[] row) { return 1; } scenario { int[][] values; int result = inspect(values); }
```

### 222. struct value cannot be used as a condition

**Expected:** At least one LSP diagnostic containing:

```text
cannot be evaluated as a boolean value
```

```bhs
struct Data { int value; }; scenario { Data item; if (item) result = 1; }
```

### 223. array value cannot be used as a condition

**Expected:** At least one LSP diagnostic containing:

```text
cannot be evaluated as a boolean value
```

```bhs
scenario { int[] values; if (values) result = 1; }
```

### 224. implicit declaration cannot be an unbraced if body

**Expected:** At least one LSP diagnostic containing:

```text
must be enclosed in braces
```

```bhs
scenario { int condition = 1; if (condition) result = 1; }
```

### 225. typed declaration cannot be an unbraced if body

**Expected:** At least one LSP diagnostic containing:

```text
must be enclosed in braces
```

```bhs
scenario { int condition = 1; if (condition) int result = 1; }
```

### 226. typed declaration cannot be an unbraced else body

**Expected:** At least one LSP diagnostic containing:

```text
must be enclosed in braces
```

```bhs
scenario { int condition = 1; int result; if (condition) result = 1; else int alternate = 2; }
```

### 227. implicit declaration cannot be an unbraced else body

**Expected:** At least one LSP diagnostic containing:

```text
must be enclosed in braces
```

```bhs
scenario { int condition = 1; int result; if (condition) result = 1; else alternate = 2; }
```

### 228. implicit declaration cannot be an unbraced while body

**Expected:** At least one LSP diagnostic containing:

```text
must be enclosed in braces
```

```bhs
scenario { int condition = 1; while (condition) result = 1; }
```

### 229. typed declaration cannot be an unbraced while body

**Expected:** At least one LSP diagnostic containing:

```text
must be enclosed in braces
```

```bhs
scenario { int condition = 1; while (condition) int result = 1; }
```

### 230. implicit declaration cannot be an unbraced for body

**Expected:** At least one LSP diagnostic containing:

```text
must be enclosed in braces
```

```bhs
scenario { int i; for (i = 0; i < 1; i++) result = i; }
```

### 231. typed declaration cannot be an unbraced for body

**Expected:** At least one LSP diagnostic containing:

```text
must be enclosed in braces
```

```bhs
scenario { int i; for (i = 0; i < 1; i++) int result = i; }
```

### 232. implicit declaration cannot be an unbraced do body

**Expected:** At least one LSP diagnostic containing:

```text
must be enclosed in braces
```

```bhs
scenario { int condition = 0; do result = 1; while (condition); }
```

### 233. typed declaration cannot be an unbraced do body

**Expected:** At least one LSP diagnostic containing:

```text
must be enclosed in braces
```

```bhs
scenario { int condition = 0; do int result = 1; while (condition); }
```

### 234. for-loop condition cannot be empty

**Expected:** At least one LSP diagnostic containing:

```text
condition clause of a for-loop cannot be empty
```

```bhs
scenario { int i; for (i = 0; ; i++) { } }
```

### 235. for-loop condition remains required when update is present

**Expected:** At least one LSP diagnostic containing:

```text
condition clause of a for-loop cannot be empty
```

```bhs
scenario { int i = 0; for (; ; i++) { } }
```

### 236. for-loop initializer does not support comma expressions

**Expected:** At least one LSP diagnostic containing:

```text
Expected ';' in for-clause
```

```bhs
scenario { int i; int j; for (i = 0, j = 0; i < 5; i++) { } }
```

### 237. for-loop update does not support comma expressions

**Expected:** At least one LSP diagnostic containing:

```text
Expected ')' after for-clause
```

```bhs
scenario { int i; int j; for (i = 0; i < 5; i++, j++) { } }
```

### 238. modulo is invalid for float values

**Expected:** At least one LSP diagnostic containing:

```text
Operator '%' is not valid for float values
```

```bhs
scenario { float result = 5.5 % 2.0; }
```

### 239. modulo assignment is invalid for float values

**Expected:** At least one LSP diagnostic containing:

```text
Operator '%=' is not valid for float values
```

```bhs
scenario { float value = 5.5; value %= 2.0; }
```

### 240. non-void script cannot use bare return

**Expected:** At least one LSP diagnostic containing:

```text
expected to return a value of 'int'
```

```bhs
int scenario helper() { return; }
```

### 241. untyped script cannot use bare return

**Expected:** At least one LSP diagnostic containing:

```text
expected to return a value of 'int'
```

```bhs
scenario helper() { return; }
```

### 242. untyped script defaults its return type to int

**Expected:** At least one LSP diagnostic containing:

```text
script that returns 'int'
```

```bhs
scenario helper() { return 1.5; }
```

### 243. anytype cannot be an explicit script return type

**Expected:** At least one LSP diagnostic containing:

```text
cannot be written explicitly
```

```bhs
anytype scenario helper() { return true; }
```

### 244. anytype cannot be an explicit parameter type

**Expected:** At least one LSP diagnostic containing:

```text
cannot be written explicitly
```

```bhs
int scenario helper(anytype value) { return 1; }
```

### 245. untyped parameters default to int for calls

**Expected:** At least one LSP diagnostic containing:

```text
No overload for 'helper'
```

```bhs
int scenario helper(value) { return 1; } scenario { int result = helper("text"); }
```

### 246. anytype cannot be a struct field type

**Expected:** At least one LSP diagnostic containing:

```text
cannot be written explicitly
```

```bhs
struct Data { anytype value; };
```

### 247. anytype cannot be an array element type

**Expected:** At least one LSP diagnostic containing:

```text
cannot be written explicitly
```

```bhs
scenario { anytype[] values; }
```

### 248. anytype cannot be an explicit cast target

**Expected:** At least one LSP diagnostic containing:

```text
cannot be used in an explicit cast
```

```bhs
scenario { int value = (anytype)5; }
```

### 249. concrete datatype remains reserved as a function identifier

**Expected:** At least one LSP diagnostic containing:

```text
reserved keyword 'int'
```

```bhs
int scenario int() { return 1; }
```

### 250. bool datatype remains reserved as a function identifier

**Expected:** At least one LSP diagnostic containing:

```text
reserved keyword 'bool'
```

```bhs
int scenario bool() { return 1; }
```

### 251. variable name cannot case-insensitively match an available struct type

**Expected:** At least one LSP diagnostic containing:

```text
conflicts with struct type
```

```bhs
struct Data { int value; }; scenario { Data data; }
```

### 252. parameter name cannot case-insensitively match an available struct type

**Expected:** At least one LSP diagnostic containing:

```text
conflicts with struct type
```

```bhs
struct Data { int value; }; int scenario inspect(int data) { return data; }
```

### 253. function name cannot case-insensitively match an available struct type

**Expected:** At least one LSP diagnostic containing:

```text
conflicts with struct type
```

```bhs
struct Data { int value; }; int scenario data() { return 1; }
```

### 254. trigger name cannot case-insensitively match an available struct type

**Expected:** At least one LSP diagnostic containing:

```text
conflicts with struct type
```

```bhs
struct Data { int value; }; scenario { trigger data(1) {} }
```

### 255. label name cannot case-insensitively match an available struct type

**Expected:** At least one LSP diagnostic containing:

```text
conflicts with struct type
```

```bhs
struct Data { int value; }; scenario { labels { data = 1 } }
```

### 256. field access cannot case-insensitively match an available struct type

**Expected:** At least one LSP diagnostic containing:

```text
struct type has the same name
```

```bhs
struct Data { int data; }; scenario { Data value; value.data = 5; }
```

### 257. case-insensitive duplicate struct definition is invalid

**Expected:** At least one LSP diagnostic containing:

```text
Duplicate definition of struct 'data' does not match the original
```

```bhs
struct Data { int first; }; struct data { int second; };
```

### 258. matching duplicate struct definitions are still invalid

**Expected:** At least one LSP diagnostic containing:

```text
Duplicate definition of struct 'data' does not match the original
```

```bhs
struct Data { int value; }; struct data { int value; };
```

### 259. later struct cannot case-insensitively match an available function

**Expected:** At least one LSP diagnostic containing:

```text
conflicts with a previously declared function or script
```

```bhs
int scenario data() { return 1; } struct Data { int value; };
```

### 260. later struct cannot case-insensitively match an available label

**Expected:** At least one LSP diagnostic containing:

```text
conflicts with a previously declared label
```

```bhs
scenario { labels { data = 1 } } struct Data { int value; };
```

### 261. script-body struct cannot follow a same-named label

**Expected:** At least one LSP diagnostic containing:

```text
conflicts with a previously declared label
```

```bhs
scenario {
  labels {
    Data = 1
  }

  struct Data { int value; };
}
```

### 262. label still cannot follow an available same-named struct

**Expected:** At least one LSP diagnostic containing:

```text
conflicts with struct type
```

```bhs
scenario { struct Data { int value; }; labels { Data = 1 } }
```

### 263. assignment-created variable cannot match an available struct type

**Expected:** At least one LSP diagnostic containing:

```text
conflicts with struct type
```

```bhs
struct Data { int value; }; scenario { data = 5; }
```

### 264. typed variable cannot match a previously declared trigger

**Expected:** At least one LSP diagnostic containing:

```text
conflicts with a previously declared trigger
```

```bhs
scenario { trigger inspect(1) {} int inspect; }
```

### 265. assignment-created variable cannot match a previously declared trigger

**Expected:** At least one LSP diagnostic containing:

```text
conflicts with a previously declared trigger
```

```bhs
scenario { trigger inspect(1) {} inspect = 5; }
```

### 266. label cannot match a visible variable

**Expected:** At least one LSP diagnostic containing:

```text
conflicts with a visible variable or parameter
```

```bhs
scenario { int inspect; labels { inspect = 1 } }
```

### 267. void is not a valid parameter type

**Expected:** At least one LSP diagnostic containing:

```text
cannot have type 'void'
```

```bhs
int scenario helper(void value) { return 1; }
```

### 268. void is not a valid local variable type

**Expected:** At least one LSP diagnostic containing:

```text
cannot have type 'void'
```

```bhs
scenario { void value; }
```

### 269. local qualifier is not valid for variable declarations

**Expected:** At least one LSP diagnostic containing:

```text
'local' qualifier is not supported
```

```bhs
scenario { local int value = 1; }
```

### 270. void array is not a valid struct field type

**Expected:** At least one LSP diagnostic containing:

```text
cannot have array type 'void[]'
```

```bhs
struct Data { void[] values; };
```

### 271. integer-backed void struct field cannot bind to ref string

**Expected:** At least one LSP diagnostic containing:

```text
No overload for 'set_string' matches argument types (int)
```

```bhs
struct Data { void value; }; int scenario set_string(ref string value) { value = "x"; return 1; } scenario { Data item; set_string(item.value); }
```

### 272. unterminated block comment is rejected

**Expected:** At least one LSP diagnostic containing:

```text
Unterminated block comment
```

```bhs
scenario {} /* unterminated
```

### 273. unterminated nested block comment is rejected

**Expected:** At least one LSP diagnostic containing:

```text
Unterminated block comment
```

```bhs
scenario { /* outer /* inner */
```

### 274. struct variable rejects assignment from int

**Expected:** At least one LSP diagnostic containing:

```text
Cannot convert
```

```bhs
struct Data { int value; }; scenario { Data item; item = 5; }
```

### 275. explicit cast cannot convert between structurally identical named structs

**Expected:** At least one LSP diagnostic containing:

```text
struct casts require the same declared type
```

```bhs
struct First { int value; }; struct Second { int value; }; First scenario create() { Second result; return (First)result; }
```

### 276. explicit cast cannot convert between recursively identical named structs

**Expected:** At least one LSP diagnostic containing:

```text
struct casts require the same declared type
```

```bhs
struct InnerFirst { int value; }; struct InnerSecond { int value; }; struct First { InnerFirst child; }; struct Second { InnerSecond child; }; First scenario create() { Second result; return (First)result; }
```

### 277. explicit cast cannot convert a primitive to a struct

**Expected:** At least one LSP diagnostic containing:

```text
struct casts require the same declared type
```

```bhs
struct First { int value; }; scenario { First result = (First)5; }
```

### 278. explicit cast cannot convert a struct to a primitive

**Expected:** At least one LSP diagnostic containing:

```text
struct casts require the same declared type
```

```bhs
struct First { int value; }; scenario { First source; int result = (int)source; }
```

### 279. explicit cast cannot add an array dimension

**Expected:** At least one LSP diagnostic containing:

```text
array casts must preserve dimensionality
```

```bhs
scenario { int[] first; int[][] second = (int[][])first; }
```

### 280. explicit cast cannot remove an array dimension

**Expected:** At least one LSP diagnostic containing:

```text
array casts must preserve dimensionality
```

```bhs
scenario { int[][] first; int[] second = (int[])first; }
```

### 281. explicit cast cannot convert a scalar to an array

**Expected:** At least one LSP diagnostic containing:

```text
array casts must preserve dimensionality
```

```bhs
scenario { int value; int[] result = (int[])value; }
```

### 282. explicit cast cannot convert an array to a scalar

**Expected:** At least one LSP diagnostic containing:

```text
array casts must preserve dimensionality
```

```bhs
scenario { int[] values; int result = (int)values; }
```

### 283. cast cannot use a struct type declared later

**Expected:** At least one LSP diagnostic containing:

```text
Missing operator between operands
```

```bhs
scenario { Data first; Data second = (Data)first; } struct Data { int value; };
```

### 284. matching duplicate struct field names are case-sensitive

**Expected:** At least one LSP diagnostic containing:

```text
does not match the original
```

```bhs
struct Data { int value; }; struct data { int Value; };
```

### 285. empty structs are invalid

**Expected:** At least one LSP diagnostic containing:

```text
must declare at least one field
```

```bhs
struct Empty { }; scenario { Empty value; }
```

### 286. local struct types are unavailable before their declaration

**Expected:** At least one LSP diagnostic containing:

```text
Unknown type 'Data'
```

```bhs
scenario { Data before; struct Data { int value; }; }
```

### 287. later scripts cannot redeclare a struct introduced in an earlier script

**Expected:** At least one LSP diagnostic containing:

```text
Duplicate definition of struct 'Data'
```

```bhs
scenario { struct Data { int first; }; Data item; } scenario { struct Data { string second; }; Data item; }
```

### 288. struct declaration conflicts with an earlier trigger in the same script

**Expected:** At least one LSP diagnostic containing:

```text
conflicts with a previously declared trigger
```

```bhs
scenario { trigger Data(1) { } struct Data { int value; }; }
```

### 289. struct inside a trigger cannot match that trigger name

**Expected:** At least one LSP diagnostic containing:

```text
conflicts with a previously declared trigger
```

```bhs
scenario { trigger Data(1) { struct Data { int value; }; } }
```

### 290. struct declaration conflicts with an earlier visible local variable

**Expected:** At least one LSP diagnostic containing:

```text
conflicts with a visible variable or parameter
```

```bhs
scenario { int Data; struct Data { int value; }; }
```

### 291. struct declaration conflicts with an earlier parameter

**Expected:** At least one LSP diagnostic containing:

```text
conflicts with a visible variable or parameter
```

```bhs
int scenario helper(int Data) { struct Data { int value; }; return 1; }
```

### 292. struct declaration conflicts with an earlier assignment-created variable

**Expected:** At least one LSP diagnostic containing:

```text
conflicts with a visible variable or parameter
```

```bhs
scenario { Data = 1; struct Data { int value; }; }
```

### 293. anytype struct parameter rejects an int argument

**Expected:** At least one LSP diagnostic containing:

```text
No overload for 'inspect'
```

```bhs
struct anytype { int value; }; int scenario inspect(anytype item) { return item.value; } scenario { int result = inspect(5); }
```

### 294. real remains invalid as an undeclared source type

**Expected:** At least one LSP diagnostic containing:

```text
Unknown type 'real'
```

```bhs
scenario { real value; }
```

### 295. struct type is unavailable before declaration

**Expected:** At least one LSP diagnostic containing:

```text
Unknown type 'Group'
```

```bhs
scenario { Group g; g.x = 5; } struct Group { int x; };
```

### 296. label is unavailable before its declaration

**Expected:** At least one LSP diagnostic containing:

```text
Cannot find name 'status'
```

```bhs
scenario { int result = status; labels { status = 1 } }
```
