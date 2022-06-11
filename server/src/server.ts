/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
	createConnection,
	TextDocuments,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	Hover,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeResult,
} from 'vscode-languageserver/node';


import {
	Position,
	//Position,
	TextDocument
} from 'vscode-languageserver-textdocument';

import { CursorInfo, InfoHover, bracket } from './types';

import { completions, completionDetails, infoHovers } from './parsers';

import { parseFunction, parseComments, replaceAllBetween} from './parsers/parse';

import {
	CompletionItemKind,
	InsertTextFormat
} from 'vscode-languageserver-protocol';


interface Settings {
	validationMethod: boolean;
}

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<Settings>> = new Map();
const defaultSettings: Settings = { validationMethod: true };
const globalSettings: Settings = defaultSettings;  

let variableBracket: bracket | undefined = undefined;
const CustomFunctionList: CompletionItem[] = [];
let CustomLabelList: CompletionItem[] = [];

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = true;
let hasWorkspaceFolderCapability = false;

//Simple function removing the first word from the string, this case used to remove the declared datatype (int, string, etc).
/*
function removeFirstWord(str: string): string {
	const indexOfSpace = str.indexOf(' ');

	if (indexOfSpace === -1) {
		return '';
	}

	return str.substring(indexOfSpace + 1);
}
*/

/*
const getCurrentLineNumber = (): number => {
	
	const activeEditor = window.activeTextEditor;
	if (activeEditor) {
		return activeEditor.selection.active.line;
	}
	
	return 0;
};
*/

connection.onInitialize((params: InitializeParams) => {
	const capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	// If not, we fall back using global settings.
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			// Tell the client that this server supports code completion.
			completionProvider: {
				resolveProvider: true
			},
			hoverProvider: true
		}
	};
	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true
			}
		};
	}
	return result;
});

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
		});
	}
});

// Only keep settings for open documents
documents.onDidClose(e => {
	documentSettings.delete(e.document.uri);
});


connection.onDidChangeConfiguration((change) => {
    //const settings = <Settings>change.settings;

	if (hasConfigurationCapability) {
		// Reset all cached document settings
		documentSettings.clear();
	}
	
	// Revalidate all open text documents
	documents.all().forEach(validateDocument);

});

function getDocumentSettings(resource: string): Thenable<Settings> {
	if (!hasConfigurationCapability) {
		return Promise.resolve(globalSettings);
	}
	let result = documentSettings.get(resource);
	if (!result) {
		result = connection.workspace.getConfiguration({
			scopeUri: resource,
			section: 'bhs'
		});
		documentSettings.set(resource, result);
	}
	return result;
}

async function validateDocument(textDocument: TextDocument): Promise<void> 
{
	//Fetching all the declared variables in the document.
	let text: string = parseComments(textDocument.getText());
	const bracketsDiagnostics: Diagnostic[] = validateBrackets(textDocument, text);
	let variableDiagnostics: Diagnostic[] = [];
	let functionDiagnostics: Diagnostic[] = [];

	if (bracketsDiagnostics.length == 0) {
		functionDiagnostics = getAllFunctions(textDocument, text);
		text = parseFunction(text);
		CustomLabelList = getAllLabels(text);
		variableDiagnostics = validateAndGetVariables(textDocument, text);
	}

	const diagnostics: Diagnostic[] = [...variableDiagnostics, ...functionDiagnostics, ...bracketsDiagnostics];
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });

}

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidSave(async change => {
	const settings = await getDocumentSettings(change.document.uri);
	if(settings.validationMethod == false)
	{
		validateDocument(change.document);
	}
});

documents.onDidChangeContent(async change => {
	const settings = await getDocumentSettings(change.document.uri);
	if(settings.validationMethod == true)
	{
		validateDocument(change.document);
	}
});

const getBlockPairs = (text: string): bracket[] => {
	const bracketArray: bracket[] = [];
	const chars = [...text];
	const stack: bracket[] = [];
	let item: bracket | undefined = undefined;

	chars.forEach((eachChar, index) => {
		switch (eachChar) {
			case "{":
				stack.push({ startIndex: index, endIndex: -1, children: undefined, completionItems: undefined });
				break;
			case "}":
				item = stack.pop();
				if (item !== undefined) {
					item.endIndex = index;
					if (stack.length === 0) {
						bracketArray.push(item);
					}
					else {
						if (stack[stack.length - 1].children === undefined) {
							stack[stack.length - 1].children = [];
						}
						stack[stack.length - 1].children?.push(item);
					}
				}
				break;
		}
	});

	return bracketArray;
};
const validateBrackets = (textDocument: TextDocument, text: string): Diagnostic[] => {
	interface bracket {
		char: string;
		pos: number;
	}

	const chars = [...text];
	const stack: bracket[] = [];
	const diagnostics: Diagnostic[] = [];
	const set: { [key: string]: string } =
	{
		'{': '}',
		'[': ']',
		'(': ')'
	};
	
	let diagnostic: Diagnostic | undefined = undefined;
	let item: bracket | undefined = undefined;
	chars.forEach((eachChar, index) => {
		switch (eachChar) {
			case "[":
			case "{":
			case "(":
				stack.push({ char: eachChar, pos: index });
				break;
			case "]":
			case "}":
			case ")":
				diagnostic = undefined;
				item = stack.pop();

				if (item === undefined) {
					diagnostic = {
						severity: DiagnosticSeverity.Error,
						range: {
							start: textDocument.positionAt(index),
							end: textDocument.positionAt(index + 1)
						},
						message: `No matching bracket for character ${eachChar}`,
						source: 'ex'
					};
					diagnostics.push(diagnostic);

				}
				else if (set[item.char] !== eachChar) {
					diagnostic = {
						severity: DiagnosticSeverity.Error,
						range: {
							start: textDocument.positionAt(item.pos),
							end: textDocument.positionAt(item.pos + 1)
						},
						message: `No matching bracket for character ${eachChar}`,
						source: 'ex'
					};
					diagnostics.push(diagnostic);
				}
				break;

		}
	});

	if (stack.length !== 0) {
		stack.forEach(item => {
			diagnostics.push({
				severity: DiagnosticSeverity.Warning,
				range: {
					start: textDocument.positionAt(item.pos),
					end: textDocument.positionAt(item.pos + 1)
				},
				message: `No matching bracket for character ${item.char}`,
				source: 'ex'
			});
		});
	}

	// Send the computed diagnostics to VSCode.
	return diagnostics;
};



const getAllFunctions = (textDocument: TextDocument, text: string): Diagnostic[] => {
	// The validator creates diagnostics for all uppercase words length 2 and more
	let m: RegExpExecArray | null;

	CustomFunctionList.splice(0);

	//Removing comments and strings from the document.

	const diagnostics: Diagnostic[] = [];

	//Getting all the functions specified

	//const functionPattern = /(?:scenario|conquest|ai|trigger)\s*?\w+\s*?(?:\((?:[^)]+)\))\s*?{/g;
	const functionPattern = /(?:scenario|conquest|ai)\s+?\w+\s*?\([^;]*?\)\s*?[{;]/g;
	while ((m = functionPattern.exec(text))) {
		let diagnostic: Diagnostic | undefined = undefined;
		let args: string[] = [];
		const snippetArgs: string[] = [];
		if (m[0].indexOf("(") != -1) {
			args = m[0].substring(m[0].indexOf("(") + 1, m[0].lastIndexOf(")")).split(",");
			args.forEach((each, counter) => {
				args[counter] = each.trim();
				snippetArgs.push(`\${${counter + 1}:${args[counter]}}`);
			});
		}
		const name = m[0].replace(/(?:scenario|conquest|ai)\s+/, "").replace(/\s*?\([^;]*?\)\s*?[{;]/, "").trim();
		const label = `${name}(${args.join(', ')})`;
		if (CustomFunctionList.find(e => e.label === label) != undefined && m != undefined) {
			diagnostic = {
				severity: DiagnosticSeverity.Error,
				range: {
					start: textDocument.positionAt(m.index),
					end: textDocument.positionAt(m.index + m[0].length)
				},
				message: `${name} is already declared`,
				source: 'ex'
			};
		}
		else {
			const completionItem: CompletionItem = {
				label: label,
				insertText: `${name}(${snippetArgs.join(', ')})`,
				insertTextFormat: InsertTextFormat.Snippet,
				kind: CompletionItemKind.Function,
				data: undefined
			};

			CustomFunctionList.push(completionItem);
		}

		if (diagnostic != undefined)
			diagnostics.push(diagnostic);

	}

	return diagnostics;
};

const getAllLabels = (text: string): CompletionItem[] => {
	let m: RegExpExecArray | null;
	const completionItems: CompletionItem[] = [];

	//Getting all the variables in the labels
	const labelPattern = /labels\s*{(?:[^}]+)}/g;
	while ((m = labelPattern.exec(text))) {
		const arra = m[0].replace(/^labels\s*{/, "").replace(/\s*}$/, "").replace(/[\t\n\r]/g,'').split(',');
		arra.forEach((element, index) => {
			const item = element.replace(/\s*?=.*/g, "").trim();

			const completionItem: CompletionItem = {
				label: item,
				insertText: item,
				insertTextFormat: InsertTextFormat.Snippet,
				kind: CompletionItemKind.Variable,
				data: completionItems.length
			};

			completionItems.push(completionItem);
		});
	}
	return completionItems;
};

const validateAndGetVariables = (textDocument: TextDocument, text: string): Diagnostic[] => 
{
		// The validator creates diagnostics for all uppercase words length 2 and more
		const bracketPairs: bracket[] = getBlockPairs(text);
		
		let diagnostics: Diagnostic[] = [];
		
		variableBracket = {startIndex: 0, endIndex: textDocument.getText().length, children: bracketPairs, completionItems: undefined};
		diagnostics = getVariablesAndDiagnostics(textDocument, text, {brack: variableBracket}, undefined);

		/*
		bracketPairs.forEach(eachItem => {
			diagnostics = [...diagnostics, ...checkBlockForVariables(textDocument, eachItem, undefined)];
		});
		*/

		return diagnostics;
};

//Function to fetch all the variables and potential diagnostics if variable has been double declared. 
const getVariablesAndDiagnostics = (textDocument: TextDocument, text: string, refBracket: { brack: bracket } , allVariables: CompletionItem[] | undefined): Diagnostic[] => {
	let m: RegExpExecArray | null;
	let substringText: string = text.substring(refBracket.brack.startIndex, refBracket.brack.endIndex + 1);

	if (refBracket.brack.children !== undefined) {
		refBracket.brack.children.forEach(eachChild => {
			substringText = replaceAllBetween(substringText, eachChild.startIndex - refBracket.brack.startIndex, eachChild.endIndex - refBracket.brack.startIndex, " ");
		});
	}

	//const textWithoutBrackets: string = parse(text, /(?<!^){(?:[^}]+)}/);

	let diagnostics: Diagnostic[] = [];
	const variables: CompletionItem[] = [];
	
	//Getting all the variables
	//(?:int|real|float|string|anytype|void)\s+(?!scenario|conquest|ai|trigger)\w+(?:\s*?=\s*?[^,;]+)?(?:(?:\s*?,\s*?(?!ref|int|real|float|string|anytype|void)\w+(?:\s*?=\s*?[^,;]+)?)?)*
	const variablePattern = /(?:int|real|float|[sS]tring|anytype|void|bool)(?:\[\])?\s+(?!scenario|conquest|ai|trigger)\w+(?:\[\])?\s*(?:=\s*[^;]+)?(?:,\s*(?!(?:int|real|float|[sS]tring|anytype|void|bool|ref|static|local)(?:\[\])?\s+)\w+(?:\[\])?\s*(?:=\s*[^;]+)?)*/g;

	while ((m = variablePattern.exec(substringText))) {
		let diagnostic: Diagnostic | undefined = undefined;

		const arra = m[0].replace(/^(?:int|real|float|[sS]tring|anytype|void|bool)(?:\[\])?/, "").replace(/\((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*\)/g, "").replace(/\[(?:[^\][]+|\[(?:[^\][]+|\[[^\][]*\])*\])*\]/g, "").split(",");
		arra.forEach((element, index) => {
			const item = element.trim().replace(";", "").replace(/\s*?=.*/g, "");

			//Pointers not allowed
			if(m != null){
				if (item.includes("*")) {
					diagnostic = {
						severity: DiagnosticSeverity.Error,
						range: {
							start: textDocument.positionAt(refBracket.brack.startIndex + m.index),
							end: textDocument.positionAt(refBracket.brack.startIndex + m.index + m[0].length)
						},
						message: `Pointers not allowed in rise of nations.`,
						source: 'ex'
					};
				}
				else {
					if ((item === "int" || item === "real" || item === "float" || item === "string" || item === "String" || item === "anytype" || item === "void" || item === "bool")) {
						diagnostic = {
							severity: DiagnosticSeverity.Error,
							range: {
								start: textDocument.positionAt(refBracket.brack.startIndex + m.index),
								end: textDocument.positionAt(refBracket.brack.startIndex + m.index + m[0].length)
							},
							message: `Can't have name ${item}, reserved keyword`,
							source: 'ex'
						};
					}
					else {
						if (variables !== undefined && (variables.find(e => e.label === item) != undefined) || allVariables !== undefined && (allVariables.find(e => e.label === item) != undefined)) {
							diagnostic = {
								severity: DiagnosticSeverity.Error,
								range: {
									start: textDocument.positionAt(refBracket.brack.startIndex + m.index),
									end: textDocument.positionAt(refBracket.brack.startIndex + m.index + m[0].length)
								},
								message: `${item} is already declared`,
								source: 'ex'
							};
						}
						else {
	
							const completionItem: CompletionItem = {
								label: item,
								insertText: item,
								insertTextFormat: InsertTextFormat.Snippet,
								kind: CompletionItemKind.Variable,
								data: variables.length
							};
	
							variables.push(completionItem);
						}
					}
				}
				
				if (diagnostic !== undefined)
					diagnostics.push(diagnostic);
			}
		});

	}

	refBracket.brack.completionItems = variables;

	if (allVariables === undefined)
		allVariables = variables;
	else
		allVariables = [...allVariables, ...variables];

	if (refBracket.brack.children !== undefined) {
		refBracket.brack.children.forEach(eachItem => {
			diagnostics = [...diagnostics, ...getVariablesAndDiagnostics(textDocument, text, {brack: eachItem}, allVariables)];
		});
	}

	return diagnostics;
};


//Function to fetch all the variables relevant to the users current position in the document.
const getSuggestionVariables = (textDocument: TextDocument, brack: bracket, position: Position):  CompletionItem[] => {
	const currentPosOffset: number = textDocument.offsetAt(position);

	let variables: CompletionItem[] = [];
	if(brack.completionItems != undefined && currentPosOffset > brack.startIndex && currentPosOffset < brack.endIndex){
		variables = brack.completionItems;

		if(brack.children !== undefined)
		{
			for(let i=0; i<brack.children.length; i++){
				if(currentPosOffset > brack.children[i].startIndex && currentPosOffset < brack.children[i].endIndex){
					variables = [...variables, ...getSuggestionVariables(textDocument, brack.children[i], position)];
					break;
				}
			}
		}
	}
	else
	{
		return variables;
	}

	return variables;
};



const getCompletionText = (_textDocumentPosition: TextDocumentPositionParams): string | undefined => {
	const document: TextDocument | undefined = documents.get(_textDocumentPosition.textDocument.uri);
	if (!document) {
		return undefined;
	}

	const text: string = document.getText();
	const offset: number = document.offsetAt(_textDocumentPosition.position);

	const endIndex: number = offset;
	let startIndex: number = endIndex - 1;
	while (startIndex >= 0 && /[a-zA-Z0-9_#@]/.test(text[startIndex])) {
		startIndex--;
	}
	return text.substring(startIndex + 1, endIndex);
};

/*
	RoN Script Manual.doc - file
	Not Supported in Script:
		pointers, arrays, structs, bitwise ops, preprocessor directives, externs
		char, short, double, long, anything unsigned

*/
//const getAllStructs = (text: string): CompletionItem[] => {
//	let m: RegExpExecArray | null;
//	const completionItems: CompletionItem[] = [];
//
//	//Getting all the variables in the labels
//	const labelPattern = /struct\s+\w+\s*{(?:[^}]+)}/g;
//	while ((m = labelPattern.exec(text))) {
//		const name = m[0].replace(/^struct\s+/, "").replace(/\s*{(?:[^}]+)};?$/, "").trim();
//		const rest = m[0].replace(/^struct\s+\w+\s*{/, "").replace(/\s*}$/, "").replace(/[\t\n\r]/g,"");
//		console.log(rest);
//		const arra = m[0].replace(/^struct\s+\w+\s*{/, "").replace(/\s*}$/, "").replace(/[\t\n\r]/g,"").split(';').filter(element => element);
//		arra.forEach((element, index) => {
//			const item = element.replace(/(?:int|real|float|[sS]tring|anytype|void)(?:\[\])?/, "").replace(/\s*?=.*/g, "").trim();
//
//			const completionItem: CompletionItem = {
//				label: `${name}.${item}`,
//				insertText: `${name}.${item}`,
//				insertTextFormat: InsertTextFormat.Snippet,
//				kind: CompletionItemKind.Variable,
//				data: completionItems.length
//			};
//
//			completionItems.push(completionItem);
//		});
//	}
//	return completionItems;
//};


// This handler provides the initial list of the completion items.
connection.onCompletion((_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
	const textToUse: string | undefined = getCompletionText(_textDocumentPosition);
	const document: TextDocument | undefined = documents.get(_textDocumentPosition.textDocument.uri);

	if (textToUse === undefined) {
		return completions;
	}


	let filteredCompletionList: CompletionItem[] = completions.filter(eachIndex => {
		return eachIndex.label.includes(textToUse);
	});

	CustomLabelList.forEach(item => {
		if (item.label.includes(textToUse)) {
			filteredCompletionList.push(item);
		}
	});

	if(variableBracket != undefined && document !== undefined){
		filteredCompletionList = [...filteredCompletionList, ...getSuggestionVariables(document, variableBracket, _textDocumentPosition.position) ];
	}

	CustomFunctionList.forEach(item => {
		if (item.label.includes(textToUse)) {
			filteredCompletionList.push(item);
		}
	});

	return filteredCompletionList;
});

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		if (item.kind === CompletionItemKind.Variable) {
			item.detail = `(variable) ${item.label}`;
			item.documentation = ``;
		}
		else if (item.data != undefined) {

			item.detail = completionDetails[item.data].detail;
			item.documentation = completionDetails[item.data].documentation;
		}

		return item;
	});

	const getCursorInfo = (
		text: string,
		start: number,
		end: number
	): CursorInfo => {
		while (start >= 0 && /[a-zA-Z0-9_#@]/.test(text[start])) {
			start--;
		}

		while (end < text.length && /[a-zA-Z0-9_(]/.test(text[end])) {
			end++;

			if (text.substring(end - 1, end) === '(') {
				return {
					type: 'function',
					word: text.substring(start + 1, end - 1)
				};
			}
		}

		return {
			type: 'default',
			word: text.substring(start + 1, end - 1)
		};
};

connection.onHover((textDocumentPosition: TextDocumentPositionParams): Hover | undefined => {
	const document: TextDocument | undefined = documents.get(textDocumentPosition.textDocument.uri);
	if (!document) {
		return {
			contents: ''
		};
	}

	const text: string = document.getText();
	const offset: number = document.offsetAt(textDocumentPosition.position);

	const start: number = offset;
	const end: number = offset + 1;

	const cursorInfo: CursorInfo = getCursorInfo(text, start, end);

	let result: CompletionItem | InfoHover | undefined;

	if (cursorInfo.type === 'function') {
		result = cursorInfo.word !== ''
			? completions.find(item => item.label.startsWith(cursorInfo.word))
			: undefined;

		return {
			contents: result
				? completionDetails[result.data].documentation
				: ''
		};
	}

	result = cursorInfo.word !== ''
		? infoHovers.find(item => item.name.startsWith(cursorInfo.word))
		: undefined;

	return {
		contents: result
			? result.contents
			: ''
	};
}
);



// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
