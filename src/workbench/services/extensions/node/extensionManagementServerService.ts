/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from 'base/nls';
import { Schemas } from 'base/common/network';
import { URI } from 'base/common/uri';
import { IExtensionManagementServer, IExtensionManagementServerService, IExtensionManagementService } from 'platform/extensionManagement/common/extensionManagement';
import { ExtensionManagementChannelClient } from 'platform/extensionManagement/node/extensionManagementIpc';
import { IRemoteAgentService } from 'workbench/services/remote/node/remoteAgentService';
import { REMOTE_HOST_SCHEME } from 'platform/remote/common/remoteHosts';
import { IChannel } from 'base/parts/ipc/node/ipc';

const localExtensionManagementServerAuthority: string = 'hypert-local';

export class ExtensionManagementServerService implements IExtensionManagementServerService {

	_serviceBrand: any;

	readonly localExtensionManagementServer: IExtensionManagementServer;
	readonly otherExtensionManagementServer: IExtensionManagementServer | null = null;

	constructor(
		localExtensionManagementService: IExtensionManagementService,
		@IRemoteAgentService remoteAgentService: IRemoteAgentService
	) {
		this.localExtensionManagementServer = { extensionManagementService: localExtensionManagementService, authority: localExtensionManagementServerAuthority, label: localize('local', "Local") };
		const remoteAgentConnection = remoteAgentService.getConnection();
		if (remoteAgentConnection) {
			const extensionManagementService = new ExtensionManagementChannelClient(remoteAgentConnection.getChannel<IChannel>('extensions'));
			this.otherExtensionManagementServer = { authority: remoteAgentConnection.remoteAuthority, extensionManagementService, label: remoteAgentConnection.remoteAuthority };
		}
	}

	getExtensionManagementServer(location: URI): IExtensionManagementServer | null {
		if (location.scheme === Schemas.file) {
			return this.localExtensionManagementServer;
		}
		if (location.scheme === REMOTE_HOST_SCHEME) {
			return this.otherExtensionManagementServer;
		}
		return null;
	}
}

export class SingleServerExtensionManagementServerService implements IExtensionManagementServerService {

	_serviceBrand: any;


	constructor(
		private readonly extensionManagementServer: IExtensionManagementServer
	) {
	}

	getExtensionManagementServer(location: URI): IExtensionManagementServer | null {
		const authority = location.scheme === Schemas.file ? localExtensionManagementServerAuthority : location.authority;
		return this.extensionManagementServer.authority === authority ? this.extensionManagementServer : null;
	}

	get localExtensionManagementServer(): IExtensionManagementServer | null {
		return this.extensionManagementServer.authority === localExtensionManagementServerAuthority ? this.extensionManagementServer : null;
	}

	get otherExtensionManagementServer(): IExtensionManagementServer | null {
		return this.extensionManagementServer.authority !== localExtensionManagementServerAuthority ? this.extensionManagementServer : null;
	}
}