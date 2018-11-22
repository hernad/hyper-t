/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationTokenSource } from 'base/common/cancellation';
import { OutputChannel } from 'workbench/services/search/node/ripgrepSearchUtils';
import { RipgrepTextSearchEngine } from 'workbench/services/search/node/ripgrepTextSearchEngine';
import * as hypert from 'hypert';

export class RipgrepSearchProvider implements hypert.TextSearchProvider {
	private inProgress: Set<hypert.CancellationTokenSource> = new Set();

	constructor(private outputChannel: OutputChannel) {
		process.once('exit', () => this.dispose());
	}

	provideTextSearchResults(query: hypert.TextSearchQuery, options: hypert.TextSearchOptions, progress: hypert.Progress<hypert.TextSearchResult>, token: hypert.CancellationToken): Promise<hypert.TextSearchComplete> {
		const engine = new RipgrepTextSearchEngine(this.outputChannel);
		return this.withToken(token, token => engine.provideTextSearchResults(query, options, progress, token));
	}

	private async withToken<T>(token: hypert.CancellationToken, fn: (token: hypert.CancellationToken) => Thenable<T>): Promise<T> {
		const merged = mergedTokenSource(token);
		this.inProgress.add(merged);
		const result = await fn(merged.token);
		this.inProgress.delete(merged);

		return result;
	}

	private dispose() {
		this.inProgress.forEach(engine => engine.cancel());
	}
}

function mergedTokenSource(token: hypert.CancellationToken): hypert.CancellationTokenSource {
	const tokenSource = new CancellationTokenSource();
	token.onCancellationRequested(() => tokenSource.cancel());

	return tokenSource;
}