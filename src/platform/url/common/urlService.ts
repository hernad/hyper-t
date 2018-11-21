/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IURLService, IURLHandler } from 'platform/url/common/url';
import { URI } from 'base/common/uri';
import { IDisposable, toDisposable } from 'base/common/lifecycle';
import { first } from 'base/common/async';

declare module Array {
	function from<T>(set: Set<T>): T[];
}

export class URLService implements IURLService {

	_serviceBrand: any;

	private handlers = new Set<IURLHandler>();

	open(uri: URI): Thenable<boolean> {
		const handlers = Array.from(this.handlers);
		return first(handlers.map(h => () => h.handleURL(uri)), undefined, false);
	}

	registerHandler(handler: IURLHandler): IDisposable {
		this.handlers.add(handler);
		return toDisposable(() => this.handlers.delete(handler));
	}
}

export class RelayURLService extends URLService implements IURLHandler {

	constructor(private urlService: IURLService) {
		super();
	}

	open(uri: URI): Thenable<boolean> {
		return this.urlService.open(uri);
	}

	handleURL(uri: URI): Thenable<boolean> {
		return super.open(uri);
	}
}
