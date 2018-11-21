/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IRemoteAuthorityResolverService, ResolvedAuthority, IResolvingProgressEvent, IRemoteAuthorityResolver } from 'platform/remote/common/remoteAuthorityResolver';
import { IEnvironmentService } from 'platform/environment/common/environment';
import { IConfigurationService } from 'platform/configuration/common/configuration';
import { ILogService } from 'platform/log/common/log';
import { Disposable } from 'base/common/lifecycle';
import { Emitter, Event } from 'base/common/event';
import { IExtensionManagementService } from 'platform/extensionManagement/common/extensionManagement';

export class RemoteAuthorityResolverService extends Disposable implements IRemoteAuthorityResolverService {

	_serviceBrand: any;

	private _onResolvingProgress: Emitter<IResolvingProgressEvent> = this._register(new Emitter<IResolvingProgressEvent>());
	readonly onResolvingProgress: Event<IResolvingProgressEvent> = this._onResolvingProgress.event;

	constructor(
		@IEnvironmentService environmentService: IEnvironmentService,
		@IConfigurationService configurationService: IConfigurationService,
		@ILogService logService: ILogService,
		@IExtensionManagementService extensionManagementService: IExtensionManagementService
	) {
		super();
	}

	async resolveAuthority(authority: string): Promise<ResolvedAuthority> {
		throw new Error(`Not implemented`);
	}

	async getRemoteAuthorityResolver(authority: string): Promise<IRemoteAuthorityResolver | null> {
		throw new Error(`Not implemented`);
	}
}
