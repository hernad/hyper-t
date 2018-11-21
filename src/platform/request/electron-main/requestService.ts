/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IRequestOptions, IRequestContext, request, IRawRequestFunction } from 'base/node/request';
import { RequestService as NodeRequestService } from 'platform/request/node/requestService';
import { assign } from 'base/common/objects';
import { net } from 'electron';
import { CancellationToken } from 'base/common/cancellation';

function getRawRequest(options: IRequestOptions): IRawRequestFunction {
	return net.request as any as IRawRequestFunction;
}

export class RequestService extends NodeRequestService {

	request(options: IRequestOptions, token: CancellationToken): Promise<IRequestContext> {
		return super.request(options, token, options => request(assign({}, options || {}, { getRawRequest }), token));
	}
}
