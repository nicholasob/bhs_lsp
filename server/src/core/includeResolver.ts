/**
 * Resolves and loads `include "..."` targets for the analyzer.
 *
 * Resolution order, first hit wins:
 *   1. relative to the including file's own directory
 *   2. relative to each workspace folder root
 *   3. a bounded recursive search of the workspace roots by file name
 *
 * Loaded files are tokenized/parsed so their declared symbols can be imported
 * by the analyzer. Parsed results for on-disk files are cached by modification
 * time, so repeated validations of the same document don't re-parse an
 * unchanged library on every keystroke. An open editor buffer always wins over
 * the on-disk copy so unsaved edits are reflected immediately.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { tokenize } from './ast/lexer';
import { parse } from './ast/parser';
import * as A from './ast/ast';

export type IncludeOutcome =
    | { kind: 'missing' }
    | { kind: 'unreadable'; detail: string }
    | { kind: 'loaded'; program: A.Program; problems: number; fsPath: string };

interface OpenDocument {
    uri: string;
    getText(): string;
}

interface CacheEntry {
    mtimeMs: number;
    program: A.Program;
    problems: number;
}

interface OpenDocumentCacheEntry {
    text: string;
    program: A.Program;
    problems: number;
}

interface PathCacheEntry {
    fsPath?: string;
    timestamp: number;
}

const CASE_INSENSITIVE_FS = process.platform === 'win32';
const MAX_SEARCH_DEPTH = 6;
const MISSING_PATH_CACHE_MS = 2000;
const MAX_DISK_CACHE_ENTRIES = 256;
const MAX_OPEN_DOCUMENT_CACHE_ENTRIES = 64;
const MAX_PATH_CACHE_ENTRIES = 1024;

export class IncludeResolver {
    private workspaceRoots: string[] = [];
    private readonly diskCache = new Map<string, CacheEntry>();
    private readonly openDocumentCache = new Map<string, OpenDocumentCacheEntry>();
    private readonly pathCache = new Map<string, PathCacheEntry>();

    constructor(private readonly listOpenDocuments: () => readonly OpenDocument[]) {}

    /** Replace the known workspace roots. Accepts `file:` URIs or plain paths. */
    setWorkspaceRoots(uris: readonly string[]): void {
        this.workspaceRoots = uris
            .map(u => this.uriToPath(u))
            .filter((p): p is string => !!p);
        this.pathCache.clear();
    }

    /** Resolve and parse an include referenced from `fromUri`. `rawPath` may be quoted. */
    load(fromUri: string, rawPath: string): IncludeOutcome {
        const includePath = this.unquote(rawPath);
        if (!includePath) { return { kind: 'missing' }; }

        const fsPath = this.resolvePath(fromUri, includePath);
        if (!fsPath) { return { kind: 'missing' }; }

        // Prefer an open editor buffer so unsaved edits are reflected.
        const openText = this.openTextFor(fsPath);
        if (openText !== undefined) {
            const cacheKey = this.normPath(fsPath);
            const cached = this.openDocumentCache.get(cacheKey);
            if (cached?.text === openText) {
                return { kind: 'loaded', program: cached.program, problems: cached.problems, fsPath };
            }
            const { program, problems } = this.parseText(openText);
            this.setBounded(
                this.openDocumentCache,
                cacheKey,
                { text: openText, program, problems },
                MAX_OPEN_DOCUMENT_CACHE_ENTRIES
            );
            return { kind: 'loaded', program, problems, fsPath };
        }

        try {
            const stat = fs.statSync(fsPath);
            const cached = this.diskCache.get(fsPath);
            if (cached && cached.mtimeMs === stat.mtimeMs) {
                return { kind: 'loaded', program: cached.program, problems: cached.problems, fsPath };
            }
            const text = fs.readFileSync(fsPath, 'utf8');
            const { program, problems } = this.parseText(text);
            this.setBounded(
                this.diskCache,
                fsPath,
                { mtimeMs: stat.mtimeMs, program, problems },
                MAX_DISK_CACHE_ENTRIES
            );
            return { kind: 'loaded', program, problems, fsPath };
        } catch (e) {
            return { kind: 'unreadable', detail: e instanceof Error ? e.message : String(e) };
        }
    }

    private parseText(text: string): { program: A.Program; problems: number } {
        const { tokens, diagnostics: lex } = tokenize(text);
        const { program, diagnostics: parseDiags } = parse(tokens);
        return { program, problems: lex.length + parseDiags.length };
    }

    private resolvePath(fromUri: string, includePath: string): string | undefined {
        const cacheKey = this.pathCacheKey(fromUri, includePath);
        const cachedPath = this.cachedPath(cacheKey);
        if (cachedPath !== 'expired') { return cachedPath; }

        for (const candidate of this.directPathCandidates(fromUri, includePath)) {
            if (this.isFile(candidate)) {
                return this.cacheFoundPath(cacheKey, candidate);
            }
        }

        // Fall back to a bounded search by file name across the workspace roots.
        const base = path.basename(includePath);
        for (const root of this.workspaceRoots) {
            const found = this.searchByName(root, base, 0);
            if (found) { return this.cacheFoundPath(cacheKey, found); }
        }

        this.setBounded(
            this.pathCache,
            cacheKey,
            { timestamp: Date.now() },
            MAX_PATH_CACHE_ENTRIES
        );
        return undefined;
    }

    private cachedPath(cacheKey: string): string | undefined | 'expired' {
        const cached = this.pathCache.get(cacheKey);
        if (!cached) { return 'expired'; }
        if (cached.fsPath) {
            if (this.isFile(cached.fsPath)) { return cached.fsPath; }
            this.pathCache.delete(cacheKey);
            return 'expired';
        }
        if (Date.now() - cached.timestamp < MISSING_PATH_CACHE_MS) {
            return undefined;
        }
        this.pathCache.delete(cacheKey);
        return 'expired';
    }

    private directPathCandidates(fromUri: string, includePath: string): string[] {
        const candidates: string[] = [];
        const fromPath = this.uriToPath(fromUri);
        if (fromPath) { candidates.push(path.resolve(path.dirname(fromPath), includePath)); }
        for (const root of this.workspaceRoots) { candidates.push(path.resolve(root, includePath)); }
        return candidates;
    }

    private cacheFoundPath(cacheKey: string, fsPath: string): string {
        this.setBounded(
            this.pathCache,
            cacheKey,
            { fsPath, timestamp: Date.now() },
            MAX_PATH_CACHE_ENTRIES
        );
        return fsPath;
    }

    private setBounded<K, V>(cache: Map<K, V>, key: K, value: V, maximumSize: number): void {
        // Refresh insertion order so frequently reused entries survive eviction.
        cache.delete(key);
        cache.set(key, value);
        if (cache.size <= maximumSize) { return; }
        const oldest = cache.keys().next();
        if (!oldest.done) {
            cache.delete(oldest.value);
        }
    }

    private pathCacheKey(fromUri: string, includePath: string): string {
        const fromPath = this.uriToPath(fromUri);
        const fromDir = fromPath ? path.dirname(fromPath) : '';
        const raw = [
            this.normPath(fromDir),
            ...this.workspaceRoots.map(root => this.normPath(root)),
            includePath
        ].join('\0');
        return CASE_INSENSITIVE_FS ? raw.toLowerCase() : raw;
    }

    private searchByName(dir: string, name: string, depth: number): string | undefined {
        if (depth > MAX_SEARCH_DEPTH) { return undefined; }
        let entries: fs.Dirent[];
        try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
        catch { return undefined; }
        for (const e of entries) {
            if (e.isFile() && this.sameName(e.name, name)) { return path.join(dir, e.name); }
        }
        for (const e of entries) {
            if (e.isDirectory() && e.name !== 'node_modules' && !e.name.startsWith('.')) {
                const found = this.searchByName(path.join(dir, e.name), name, depth + 1);
                if (found) { return found; }
            }
        }
        return undefined;
    }

    private openTextFor(fsPath: string): string | undefined {
        const target = this.normPath(fsPath);
        for (const doc of this.listOpenDocuments()) {
            const p = this.uriToPath(doc.uri);
            if (p && this.normPath(p) === target) { return doc.getText(); }
        }
        return undefined;
    }

    private isFile(p: string): boolean {
        try { return fs.statSync(p).isFile(); } catch { return false; }
    }

    private sameName(a: string, b: string): boolean {
        return CASE_INSENSITIVE_FS ? a.toLowerCase() === b.toLowerCase() : a === b;
    }

    private normPath(p: string): string {
        const n = path.normalize(p);
        return CASE_INSENSITIVE_FS ? n.toLowerCase() : n;
    }

    private uriToPath(uri: string): string | undefined {
        try { return uri.startsWith('file:') ? fileURLToPath(uri) : uri; }
        catch { return undefined; }
    }

    private unquote(s: string): string {
        const t = s.trim();
        if (t.length >= 2 && (t[0] === '"' || t[0] === "'") && t[t.length - 1] === t[0]) {
            return t.slice(1, -1).trim();
        }
        return t;
    }
}
