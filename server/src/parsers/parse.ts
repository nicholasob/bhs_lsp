export function replaceAllBetween(text: string, startIndex: number, endIndex: number, replaceWith: string) : string
{
	if(startIndex < 0 || endIndex < 0 || startIndex > endIndex)
	{
		return text;
	}
	const retText = [...text];

	for (let x = startIndex; x <=  endIndex; x++) {
		retText[x] = replaceWith;
	}
	text = retText.join('');

	return text;
}

//Parsing and removing any comments or declared strings from the text document by replacing all characters in the range with ' '.
export function parse(text: string, regex: RegExp): string {
	let m: RegExpExecArray | null;
	//Making sure the global flag is set
	const regexToExecute = new RegExp(regex, "g");

	while ((m = regexToExecute.exec(text))) {
		text = replaceAllBetween(text, m.index, m.index + (m[0].length - 1), " ");
	}

	return text;
}

//Parsing and removing any comments or declared strings from the text document.
export function parseComments(text: string): string {
	//Removing any comments!
	const commentsPattern = /\/\*.*?\*\/|"(?:.*?(?<!\\))"|\/\/(?:.*?\r?\n)|\/\/(?:.*?)$/g;
	const parsedText: string = parse(text, commentsPattern);

	return parsedText;
}

export function parseFunction(text: string): string {
	
	//Removing any function declerations
	let parsedText: string = parse(text, /(?:(?:int|real|float|[sS]tring|anytype|void|bool)?(?:\[\])?\s+)?(?:scenario|conquest|ai)\s+?\w+\s*?\([^;()]*?\)\s*?;/);

	//Making it so the function parameters are not globaly available throughout the file, only whithin the curly brackets.
	let m: RegExpExecArray | null;
	const functionPattern = /(?:scenario|conquest|ai)\s+?\w+\s*?\([^;()]*?\)\s*?{/g;
	const retText = [...parsedText];

	while ((m = functionPattern.exec(parsedText))) {
		//Getting the index of where the parameters start and end
		const startIndex: number = m[0].indexOf("(");
		const endIndex: number = m[0].indexOf(")");

		//Substring that includes only the parameters: "(...)"
		const argz: string = m[0].substring(startIndex, endIndex + 1);

		//Switch place of the end curly bracket so it is before the parameters starts
		retText[m.index + startIndex] = "{";
		retText[m.index + m[0].length - 1] = " ";

		//Moving the parameters 1 step further in the string: "scenario *NAME*{(parameters)"
		for (let x = 0; x < argz.length; x++) {
			retText[(m.index + startIndex + 1) + x ] = argz[x];
		}
	
	}
	
	parsedText = retText.join('');

	return parsedText;
}