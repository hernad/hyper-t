/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { URI } from 'base/common/uri';
import { IConfigurationService } from 'platform/configuration/common/configuration';
import { ITextResourcePropertiesService } from 'editor/common/services/resourceConfiguration';
import { OperatingSystem, OS } from 'base/common/platform';
import { IRemoteAgentService, IRemoteAgentEnvironment } from 'workbench/services/remote/node/remoteAgentService';
import { Schemas } from 'base/common/network';
import { IStorageService, StorageScope } from 'platform/storage/common/storage';
import { IWindowService } from 'platform/windows/common/windows';

export class TextResourcePropertiesService implements ITextResourcePropertiesService {

	_serviceBrand: any;

	private remoteEnvironment: IRemoteAgentEnvironment | null = null;

	constructor(
		@IConfigurationService private configurationService: IConfigurationService,
		@IRemoteAgentService remoteAgentService: IRemoteAgentService,
		@IWindowService private windowService: IWindowService,
		@IStorageService private storageService: IStorageService
	) {
		const remoteAgentConnection = remoteAgentService.getConnection();
		if (remoteAgentConnection) {
			remoteAgentConnection.getEnvironment().then(remoteEnv => this.remoteEnvironment = remoteEnv);
		}
	}

	getEOL(resource: URI, language?: string): string {
		const filesConfiguration = this.configurationService.getValue<{ eol: string }>('files', { overrideIdentifier: language, resource });
		if (filesConfiguration && filesConfiguration.eol && filesConfiguration.eol !== 'auto') {
			return filesConfiguration.eol;
		}
		const os = this.getOS(resource);
		return os === OperatingSystem.Linux || os === OperatingSystem.Macintosh ? '\n' : '\r\n';
	}

	private getOS(resource: URI): OperatingSystem {
		let os = OS;
		const remoteAuthority = this.windowService.getConfiguration().remoteAuthority;
		if (remoteAuthority) {
			if (resource.scheme !== Schemas.file) {
				const osCacheKey = `resource.authority.os.${remoteAuthority}`;
				os = this.remoteEnvironment ? this.remoteEnvironment.os : /* Get it from cache */ this.storageService.getInteger(osCacheKey, StorageScope.WORKSPACE, OS);
				this.storageService.store(osCacheKey, os, StorageScope.WORKSPACE);
			}
		}
		return os;
	}

}