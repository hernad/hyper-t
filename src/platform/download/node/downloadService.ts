/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IDownloadService } from 'platform/download/common/download';
import { URI } from 'base/common/uri';
import { Schemas } from 'base/common/network';
import { copy } from 'base/node/pfs';
import { IRequestService } from 'platform/request/node/request';
import { asText, download } from 'base/node/request';
import { CancellationToken } from 'base/common/cancellation';

export class DownloadService implements IDownloadService {

	_serviceBrand: any;

	constructor(
		@IRequestService private requestService: IRequestService
	) { }

	download(uri: URI, target: string, cancellationToken: CancellationToken = CancellationToken.None): Promise<void> {
		if (uri.scheme === Schemas.file) {
			return copy(uri.fsPath, target);
		}
		const options = { type: 'GET', url: uri.toString() };
		return this.requestService.request(options, cancellationToken)
			.then(context => {
				if (context.res.statusCode === 200) {
					return download(target, context);
				}
				return asText(context)
					.then(message => Promise.reject(new Error(`Expected 200, got back ${context.res.statusCode} instead.\n\n${message}`)));
			});
	}
}