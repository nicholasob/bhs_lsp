import {
  CompletionItem,
  CompletionItemKind,
  InsertTextFormat,
  MarkupKind
} from 'vscode-languageserver-protocol';
import {
  CombinedCompletion, CompletionDetail, InfoHover
} from '../types';

import functions from '../RoN_Functions/functions.json';

import worker from './general';

const completions: CompletionItem[] = [];
const completionDetails: CompletionDetail[] = [];
const infoHovers: InfoHover[] = [];

let completionsCounter = 0;

//Adding the allowed keyword used by rise of nations
["static", "int", "real", "float", "string", "void", "bool", "anytype", "scenario", "conquest", "ai", "trigger"].forEach(dataType => {
  completions.push({
    label: dataType,
    insertText: dataType,
    insertTextFormat: InsertTextFormat.PlainText,
    kind: CompletionItemKind.Keyword,
    data: completionsCounter
  });

  completionDetails.push( {
    detail: `(datatype) ${dataType}`,
    documentation: {
      kind: MarkupKind.Markdown,
      value: ''
    }
  });
  completionsCounter++;
});

for (const func of functions) {
  const processedFunction: CombinedCompletion = worker.processFunction(
    func, completionsCounter
  );

  completions.push(processedFunction.basic);
  completionDetails.push(processedFunction.details);

  completionsCounter++;
}





export { completions, completionDetails, infoHovers };
