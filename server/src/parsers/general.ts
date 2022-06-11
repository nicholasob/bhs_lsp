/* eslint-disable prefer-const */
import {
  CompletionItem,
  CompletionItemKind,
  InsertTextFormat,
  MarkupKind
} from 'vscode-languageserver-protocol';

import { CompletionDetail, CombinedCompletion } from '../types';

export default {
  processFunction: (func: any, data: number): CombinedCompletion => {
    let completionItem: CompletionItem;
    let completionDetail: CompletionDetail;

    const args: string[] = [];
    const snippetArgs: string[] = [];
    const detailArgs: string[] = [];
    const params: string[] = [];

    let argsCounter = 0;

    for (const arg of func.arguments) {
      argsCounter++;

      args.push(arg.name);
      snippetArgs.push(`\${${argsCounter}:${arg.name}}`);

      if (arg.type !== '') {
        detailArgs.push(`${arg.name}: ${arg.type}`);
        params.push(`_@param_ \`${arg.type}\` \`${arg.name}\``);
      }
      else{
        detailArgs.push(`${arg.name}`);
        params.push(`_@param_ \`${arg.name}\``);
      }
    }

    completionItem = {
      label: `${func.name}(${args.join(', ')})`,
      insertText: `${func.name}(${snippetArgs.join(', ')})`,
      insertTextFormat: InsertTextFormat.Snippet,
      kind: CompletionItemKind.Function,
      data: data
    };

    const hasParams: boolean = (params.length > 0);
    const hasReturn: boolean = (typeof func.return.name !== 'undefined');
    const hasReturnType: boolean = (typeof func.return.type !== 'undefined');
    const hasDescription: boolean = (func.description !== '');
    const hasNotes: boolean = (func.notes !== '');

    let details = `(function) ${func.name}(${detailArgs.join(', ')})`;

    if (hasReturnType) {
      details = details + `: ${func.return.type}`;
    } else if (hasReturn) {
      details = details + ': free';
    }

    const documentation: any[] = [];

    if (hasDescription) {
      documentation.push(func.description);
    }

    if (hasNotes) {
      documentation.push(func.notes);
    }

    const docBlock: any[] = [];

    if (hasParams) {
      docBlock.push('\n\n');

      for (let i = 0; i < params.length; i++) {
        docBlock.push(params[i]);

        if (i !== (params.length - 1)) {
          docBlock.push('  \n');
        }
      }
    }

    if (hasReturn) {
      docBlock.push('\n\n');

      if (hasReturnType) {
        docBlock.push(
          `_@return_ \`${func.return.type}\` \`${func.return.name}\``
        );
      } else {
        docBlock.push(`_@return_ \`${func.return.name}\``);
      }
    }

    completionDetail = {
      detail: details,
      documentation: {
        kind: MarkupKind.Markdown,
        value: documentation.join('\n\n') + docBlock.join('')
      }
    };

    return {
      basic: completionItem,
      details: completionDetail
    };
  }
};
