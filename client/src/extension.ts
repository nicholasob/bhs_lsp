/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import { ExtensionContext } from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
	const serverModule = context.asAbsolutePath(
		path.join('server', 'out', 'server.js')
	);
	client = new LanguageClient(
		'bhs',
		'bhs server',
		createServerOptions(serverModule),
		createClientOptions()
	);
	client.start();
}

function createServerOptions(serverModule: string): ServerOptions {
	return {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: { execArgv: ['--nolazy', '--inspect=6009'] }
		}
	};
}

function createClientOptions(): LanguageClientOptions {
	return {
		documentSelector: [
			{ scheme: 'file', language: 'bhs' },
			{ scheme: 'untitled', language: 'bhs' }
		],
		synchronize: {
			configurationSection: 'bhs'
		}
	};
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
