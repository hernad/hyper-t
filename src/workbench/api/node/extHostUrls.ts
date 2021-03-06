/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as hypert from 'hypert';
import { MainContext, IMainContext, ExtHostUrlsShape, MainThreadUrlsShape } from './extHost.protocol';
import { URI, UriComponents } from 'base/common/uri';
import { toDisposable } from 'base/common/lifecycle';
import { onUnexpectedError } from 'base/common/errors';

export class ExtHostUrls implements ExtHostUrlsShape {

	private static HandlePool = 0;
	private readonly _proxy: MainThreadUrlsShape;

	private handles = new Set<string>();
	private handlers = new Map<number, hypert.UriHandler>();

	constructor(
		mainContext: IMainContext
	) {
		this._proxy = mainContext.getProxy(MainContext.MainThreadUrls);
	}

	registerUriHandler(extensionId: string, handler: hypert.UriHandler): hypert.Disposable {
		if (this.handles.has(extensionId)) {
			throw new Error(`Protocol handler already registered for extension ${extensionId}`);
		}

		const handle = ExtHostUrls.HandlePool++;
		this.handles.add(extensionId);
		this.handlers.set(handle, handler);
		this._proxy.$registerUriHandler(handle, extensionId);

		return toDisposable(() => {
			this.handles.delete(extensionId);
			this.handlers.delete(handle);
			this._proxy.$unregisterUriHandler(handle);
		});
	}

	$handleExternalUri(handle: number, uri: UriComponents): Thenable<void> {
		const handler = this.handlers.get(handle);

		if (!handler) {
			return Promise.resolve(null);
		}
		try {
			handler.handleUri(URI.revive(uri));
		} catch (err) {
			onUnexpectedError(err);
		}

		return Promise.resolve(null);
	}
}
