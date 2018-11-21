/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { URI } from 'base/common/uri';
import { createDecorator } from 'platform/instantiation/common/instantiation';
import { CancellationToken } from 'base/common/cancellation';

export const IDownloadService = createDecorator<IDownloadService>('downloadService');

export interface IDownloadService {

	_serviceBrand: any;

	download(uri: URI, to: string, cancellationToken?: CancellationToken): Promise<void>;

}