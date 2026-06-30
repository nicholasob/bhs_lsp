import { TextDocument } from 'vscode-languageserver-textdocument';
import { DocumentAnalysis, ValidationService } from './validationService';

/** Caches the complete semantic result for each open document version. */
export class DocumentAnalysisStore {
    private readonly analyses = new Map<string, DocumentAnalysis>();

    constructor(private readonly validationService: ValidationService) {}

    get(document: TextDocument): DocumentAnalysis {
        const cached = this.analyses.get(document.uri);
        if (cached?.version === document.version) {
            return cached;
        }
        if (cached && cached.version > document.version) {
            return cached;
        }

        const analysis = this.validationService.analyzeDocument(document);
        this.analyses.set(document.uri, analysis);
        return analysis;
    }

    invalidate(uri: string): void {
        this.analyses.delete(uri);
    }

    clear(): void {
        this.analyses.clear();
    }
}
