import { TextDocument } from 'vscode-languageserver-textdocument';
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver/node';
import { ScopeManager } from '../scopeManager';
import { FunctionSignatureMap } from '../types';
import { tokenize } from '../ast/lexer';
import { parse } from '../ast/parser';
import { Analyzer, IncludedProgramGroup } from '../ast/analyzer';
import * as A from '../ast/ast';
import { IncludeResolver } from '../includeResolver';

interface RawDiagnostic {
    start: number;
    end: number;
    message: string;
    severity: number;
}

interface IncludeResolution {
    includedPrograms: IncludedProgramGroup[];
    hasIncludes: boolean;
    clean: boolean;
}

/**
 * Validation pipeline for BHS files: tokenize -> parse to an AST -> analyze.
 *
 * Each run returns its AST, diagnostics, scopes, and signatures as an isolated
 * document snapshot for validation and editor features.
 */
export class ValidationService {
    private readonly builtinKeys: Set<string>;

    constructor(
        private readonly builtinSignatures: FunctionSignatureMap,
        private includeResolver: IncludeResolver
    ) {
        this.builtinKeys = new Set(builtinSignatures.keys());
    }

    /**
     * Resolve every `include "..."` in the program. Reports a problem at each
     * include site (missing file -> error; unreadable or partially-parsed file
     * -> warning) and returns the parsed programs whose symbols can be imported.
     *
     * `clean` is true only when every include resolved and parsed without any
     * problems; the caller uses it to decide whether undefined-name checking is
     * safe to run (an unseen include would otherwise cause false positives).
     */
    private resolveIncludes(
        document: TextDocument,
        program: A.Program,
        raw: RawDiagnostic[]
    ): IncludeResolution {
        const includedPrograms: IncludedProgramGroup[] = [];
        let hasIncludes = false;
        let clean = true;

        for (const item of program.items) {
            if (item.kind !== 'Include') { continue; }
            // An empty path means the parser already reported a syntax error.
            if (!item.path.trim()) { continue; }
            hasIncludes = true;

            const resolved = this.resolveIncludeGraph(document.uri, item.path, item, raw, new Set());
            if (resolved.programs.length) {
                includedPrograms.push({ include: item, programs: resolved.programs });
            }
            clean = clean && resolved.clean;
        }

        return { includedPrograms, hasIncludes, clean };
    }

    private resolveIncludeGraph(
        fromUri: string,
        rawPath: string,
        diagnosticAt: A.IncludeDecl,
        raw: RawDiagnostic[],
        loading: Set<string>
    ): { programs: A.Program[]; clean: boolean } {
        const outcome = this.includeResolver.load(fromUri, rawPath);
        if (outcome.kind === 'missing') {
            this.addRawDiagnostic(raw, diagnosticAt, 1, `Cannot find include file ${rawPath} in the workspace.`);
            return { programs: [], clean: false };
        }
        if (outcome.kind === 'unreadable') {
            this.addRawDiagnostic(raw, diagnosticAt, 2, `Could not read include file ${rawPath}: ${outcome.detail}`);
            return { programs: [], clean: false };
        }

        const pathKey = outcome.fsPath.toLowerCase();
        if (loading.has(pathKey)) {
            this.addRawDiagnostic(raw, diagnosticAt, 1, `Cyclic include detected while loading ${rawPath}.`);
            return { programs: [], clean: false };
        }

        loading.add(pathKey);
        const programs: A.Program[] = [];
        let clean = outcome.problems === 0;
        if (!clean) {
            this.addRawDiagnostic(raw, diagnosticAt, 2, `Included file ${rawPath} has ${outcome.problems} problem(s) and may not load correctly.`);
        }
        for (const item of outcome.program.items) {
            if (item.kind !== 'Include' || !item.path.trim()) { continue; }
            const nested = this.resolveIncludeGraph(outcome.fsPath, item.path, diagnosticAt, raw, loading);
            programs.push(...nested.programs);
            clean = clean && nested.clean;
        }
        programs.push(outcome.program);
        loading.delete(pathKey);
        return { programs, clean };
    }

    private addRawDiagnostic(raw: RawDiagnostic[], at: A.Pos, severity: number, message: string): void {
        raw.push({ start: at.start, end: at.end, severity, message });
    }

    analyzeDocument(document: TextDocument): DocumentAnalysis {
        const text = document.getText();
        const raw: RawDiagnostic[] = [];
        const functionSignatures = this.createSignatureMap();
        const scopeManager = new ScopeManager();
        const userFunctionKeys = new Set<string>();

        const { tokens, diagnostics: lexDiagnostics } = tokenize(text);
        raw.push(...lexDiagnostics);

        const { program, diagnostics: parseDiagnostics } = parse(tokens);
        raw.push(...parseDiagnostics);

        // Resolve includes before analysis so their symbols can be imported.
        // Undefined-name checks are suppressed when an include couldn't be fully
        // resolved, to avoid false positives for names we couldn't see.
        const { includedPrograms, hasIncludes, clean } = this.resolveIncludes(document, program, raw);
        const suppressUnknownNames = hasIncludes && !clean;

        const analyzer = new Analyzer(
            functionSignatures,
            scopeManager,
            this.builtinKeys,
            userFunctionKeys,
            includedPrograms,
            suppressUnknownNames
        );
        raw.push(...analyzer.analyze(program));

        const diagnostics = raw.map(d => ({
            severity: d.severity as DiagnosticSeverity,
            range: {
                start: document.positionAt(d.start),
                end: document.positionAt(d.end)
            },
            message: d.message,
            source: 'bhs'
        }));

        return {
            uri: document.uri,
            version: document.version,
            program,
            diagnostics,
            scopeManager,
            functionSignatures
        };
    }

    validateDocument(document: TextDocument): Diagnostic[] {
        return this.analyzeDocument(document).diagnostics;
    }

    private createSignatureMap(): FunctionSignatureMap {
        return new Map(Array.from(this.builtinSignatures, ([name, overloads]) => [name, [...overloads]]));
    }
}

export interface DocumentAnalysis {
    uri: string;
    version: number;
    program: A.Program;
    diagnostics: Diagnostic[];
    scopeManager: ScopeManager;
    functionSignatures: FunctionSignatureMap;
}
