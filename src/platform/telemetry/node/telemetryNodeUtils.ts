/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/


import { URI } from 'base/common/uri';
import product from 'platform/node/product';
import { ITelemetryService } from 'platform/telemetry/common/telemetry';
import { IEnvironmentService } from 'platform/environment/common/environment';

export function addGAParameters(telemetryService: ITelemetryService, environmentService: IEnvironmentService, uri: URI, origin: string, experiment = '1'): Thenable<URI> {
	if (environmentService.isBuilt && !environmentService.isExtensionDevelopment && !environmentService.args['disable-telemetry'] && !!product.enableTelemetry) {
		if (uri.scheme === 'https' && uri.authority === 'code.visualstudio.com') {
			return telemetryService.getTelemetryInfo()
				.then(info => {
					return uri.with({ query: `${uri.query ? uri.query + '&' : ''}utm_source=hypert&utm_medium=${encodeURIComponent(origin)}&utm_campaign=${encodeURIComponent(info.instanceId)}&utm_content=${encodeURIComponent(experiment)}` });
				});
		}
	}
	return Promise.resolve(uri);
}
