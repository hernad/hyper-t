/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as hypert from 'hypert';
import { URI } from 'base/common/uri';
import { MainContext, MainThreadDiaglogsShape, IMainContext } from 'workbench/api/node/extHost.protocol';

export class ExtHostDialogs {

	private readonly _proxy: MainThreadDiaglogsShape;

	constructor(mainContext: IMainContext) {
		this._proxy = mainContext.getProxy(MainContext.MainThreadDialogs);
	}

	showOpenDialog(options: hypert.OpenDialogOptions): Thenable<URI[]> {
		return this._proxy.$showOpenDialog(options).then(filepaths => {
			return filepaths && filepaths.map(URI.revive);
		});
	}

	showSaveDialog(options: hypert.SaveDialogOptions): Thenable<URI> {
		return this._proxy.$showSaveDialog(options).then(filepath => {
			return filepath && URI.revive(filepath);
		});
	}
}
