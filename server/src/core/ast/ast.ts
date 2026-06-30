/**
 * AST node definitions for Big Huge Script.
 *
 * Every node carries `start`/`end` document offsets so diagnostics can point at
 * the exact source range.
 */

export interface Pos {
    start: number;
    end: number;
}

// ---------------------------------------------------------------------------
// Expressions
// ---------------------------------------------------------------------------

export interface NumberLit extends Pos { kind: 'Number'; value: string; isFloat: boolean; }
export interface StringLit extends Pos { kind: 'String'; value: string; }
export interface CharLit extends Pos { kind: 'Char'; value: string; }
export interface BoolLit extends Pos { kind: 'Bool'; value: boolean; }
export interface Ident extends Pos { kind: 'Ident'; name: string; }
export interface CallExpr extends Pos { kind: 'Call'; callee: Ident; args: Expr[]; receiver?: Expr; }
export interface MemberExpr extends Pos { kind: 'Member'; receiver: Expr; field: Ident; }
export interface IndexExpr extends Pos { kind: 'Index'; receiver: Expr; index: Expr; }
export interface UnaryExpr extends Pos { kind: 'Unary'; op: string; operand: Expr; prefix: boolean; }
export interface BinaryExpr extends Pos { kind: 'Binary'; op: string; left: Expr; right: Expr; }
export interface TernaryExpr extends Pos { kind: 'Ternary'; cond: Expr; whenTrue: Expr; whenFalse: Expr; }
export interface ParenExpr extends Pos { kind: 'Paren'; expr: Expr; }
/** A C-style explicit cast, e.g. `(int)x`. `castType` is a normalized type name. */
export interface CastExpr extends Pos { kind: 'Cast'; castType: string; operand: Expr; }
/** Placeholder emitted where an operand was expected but missing. */
export interface ErrorExpr extends Pos { kind: 'Error'; }

export type Expr =
    | NumberLit | StringLit | CharLit | BoolLit | Ident
    | CallExpr | MemberExpr | IndexExpr | UnaryExpr | BinaryExpr | TernaryExpr | ParenExpr | CastExpr | ErrorExpr;

// ---------------------------------------------------------------------------
// Statements
// ---------------------------------------------------------------------------

export interface Declarator { name: Ident; varType?: string; init?: Expr; }
export interface VarDecl extends Pos { kind: 'VarDecl'; qualifier?: string; varType?: string; declarators: Declarator[]; }
export interface AssignStmt extends Pos { kind: 'Assign'; target: Expr; op: string; value: Expr; }
export interface ExprStmt extends Pos { kind: 'ExprStmt'; expr: Expr; }
export interface IfStmt extends Pos { kind: 'If'; cond: Expr; then: Stmt; alt?: Stmt; }
export interface WhileStmt extends Pos { kind: 'While'; cond: Expr; body: Stmt; }
export interface ForStmt extends Pos { kind: 'For'; init?: Stmt; cond?: Expr; update?: Stmt; body: Stmt; }
export interface DoWhileStmt extends Pos { kind: 'DoWhile'; body: Stmt; cond: Expr; }
export interface ReturnStmt extends Pos { kind: 'Return'; value?: Expr; }
export interface BreakStmt extends Pos { kind: 'Break'; }
export interface ContinueStmt extends Pos { kind: 'Continue'; }
export interface EmptyStmt extends Pos { kind: 'Empty'; }
export interface Block extends Pos { kind: 'Block'; body: Stmt[]; }
export interface TriggerStmt extends Pos { kind: 'Trigger'; name?: Ident; cond: Expr; body: Block; }
export interface RunOnceStmt extends Pos { kind: 'RunOnce'; body: Block; }
export interface LabelEntry { name: Ident; value?: Expr; }
export interface LabelsBlock extends Pos { kind: 'Labels'; entries: LabelEntry[]; }
export interface SwitchCase { test?: Expr; body: Stmt[]; }
export interface SwitchStmt extends Pos { kind: 'Switch'; disc: Expr; cases: SwitchCase[]; }

export type Stmt =
    | VarDecl | AssignStmt | ExprStmt | IfStmt | WhileStmt | ForStmt | DoWhileStmt
    | ReturnStmt | BreakStmt | ContinueStmt | EmptyStmt | Block | TriggerStmt
    | RunOnceStmt | LabelsBlock | SwitchStmt | StructDecl;

// ---------------------------------------------------------------------------
// Top level
// ---------------------------------------------------------------------------

export interface Param extends Pos { qualifier?: string; paramType?: string; name: Ident; isRef: boolean; }
export interface ScriptDecl extends Pos {
    kind: 'Script';
    scriptType: string;       // scenario | conquest | ai
    name?: Ident;
    returnType?: string;
    params: Param[];
    body?: Block;             // undefined for a forward declaration ending in ';'
}
export interface IncludeDecl extends Pos { kind: 'Include'; path: string; }
export interface StructField extends Pos { fieldType: string; name: Ident; }
export interface StructDecl extends Pos { kind: 'Struct'; name: Ident; fields: StructField[]; }

export type TopLevel = ScriptDecl | IncludeDecl | StructDecl | Stmt;

export interface Program { kind: 'Program'; items: TopLevel[]; }
