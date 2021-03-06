/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { MainContext, MainThreadLanguagesShape, IMainContext } from './extHost.protocol';
import * as hypert from 'hypert';
import { ExtHostDocuments } from 'workbench/api/node/extHostDocuments';

export class ExtHostLanguages {

	private readonly _proxy: MainThreadLanguagesShape;
	private readonly _documents: ExtHostDocuments;

	constructor(
		mainContext: IMainContext,
		documents: ExtHostDocuments
	) {
		this._proxy = mainContext.getProxy(MainContext.MainThreadLanguages);
		this._documents = documents;
	}

	getLanguages(): Thenable<string[]> {
		return this._proxy.$getLanguages();
	}

	changeLanguage(uri: hypert.Uri, languageId: string): Thenable<hypert.TextDocument> {
		return this._proxy.$changeLanguage(uri, languageId).then(() => {
			return this._documents.getDocumentData(uri).document;
		});
	}
}
