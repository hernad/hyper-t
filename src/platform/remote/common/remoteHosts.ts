/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { URI } from 'base/common/uri';

export const REMOTE_HOST_SCHEME = 'hypert-remote';

export function getRemoteAuthority(uri: URI) {
	return uri.scheme === REMOTE_HOST_SCHEME ? uri.authority : void 0;
}