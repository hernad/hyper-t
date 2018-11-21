/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from 'base/common/lifecycle';
import { join } from 'path';
import { IEnvironmentService } from 'platform/environment/common/environment';
import { IExtensionManagementService, DidInstallExtensionEvent, DidUninstallExtensionEvent } from 'platform/extensionManagement/common/extensionManagement';
import { MANIFEST_CACHE_FOLDER, USER_MANIFEST_CACHE_FILE } from 'platform/extensions/common/extensions';
import * as pfs from 'base/node/pfs';

export class ExtensionsManifestCache extends Disposable {

	private extensionsManifestCache = join(this.environmentService.userDataPath, MANIFEST_CACHE_FOLDER, USER_MANIFEST_CACHE_FILE);

	constructor(
		private readonly environmentService: IEnvironmentService,
		extensionsManagementServuce: IExtensionManagementService
	) {
		super();
		this._register(extensionsManagementServuce.onDidInstallExtension(e => this.onDidInstallExtension(e)));
		this._register(extensionsManagementServuce.onDidUninstallExtension(e => this.onDidUnInstallExtension(e)));
	}

	private onDidInstallExtension(e: DidInstallExtensionEvent): void {
		if (!e.error) {
			this.invalidate();
		}
	}

	private onDidUnInstallExtension(e: DidUninstallExtensionEvent): void {
		if (!e.error) {
			this.invalidate();
		}
	}

	invalidate(): void {
		pfs.del(this.extensionsManifestCache).then(() => { }, () => { });
	}
}
