/**
 * Semantic analyzer for the BHS AST.
 *
 * Produces semantic diagnostics and populates a run-local ScopeManager and
 * function-signature map used by completion and hover. It enforces only
 * rules that are genuinely correct for BHS: a float cannot be used as a boolean
 * condition, `ref` parameters need an explicit type, names must be defined, and
 * functions/labels/triggers cannot be declared twice. On assignment it rejects a
 * value that would need a narrowing or string conversion to fit the declared type
 * (e.g. `int x = 5000.0` or `int x = "5"`) — the game's compiler demands an
 * explicit cast there — while allowing widening (`int`->`float`),
 * and to-string auto-casts, and never flagging `anytype`/unknown values. It
 * flags calls to unknown functions when the include graph is clean, and skips
 * arity checks for variadic builtins.
 *
 * Symbols declared in successfully-resolved `include` files are collected up
 * front (via `includedPrograms`) so references to them resolve. When an include
 * cannot be resolved or parsed cleanly, the caller sets `suppressUnknownNames`
 * so undefined-name diagnostics are withheld rather than producing a flood of
 * false positives for names we simply couldn't see.
 */

import * as A from './ast';
import { getFunctionOverloads } from '../types';
import { SemDiagnostic } from '../semantic/declarationCollector';
import { StatementAnalyzer } from '../semantic/statementAnalyzer';

export { IncludedProgramGroup, SemDiagnostic } from '../semantic/declarationCollector';

export class Analyzer extends StatementAnalyzer {
    analyze(program: A.Program): SemDiagnostic[] {
        for (const key of this.functionSignatures.keys()) {
            this.allNames.add(key);
            this.globalNames.add(key);
        }
        for (const key of this.builtinKeys) {
            this.availableFunctionSignatures.set(
                key,
                [...getFunctionOverloads(this.functionSignatures, key)]
            );
        }

        this.collectProgram(program);
        this.pushScope('global');
        for (const item of program.items) { this.checkTopLevel(item); }
        return this.diagnostics;
    }
}
