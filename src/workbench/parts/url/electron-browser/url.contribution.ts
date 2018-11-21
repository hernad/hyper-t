/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from 'base/nls';
import { SyncActionDescriptor } from 'platform/actions/common/actions';
import { Registry } from 'platform/registry/common/platform';
import { Extensions as ActionExtensions, IWorkbenchActionRegistry } from 'workbench/common/actions';
import { IURLService } from 'platform/url/common/url';
import { IQuickInputService } from 'platform/quickinput/common/quickInput';
import { URI } from 'base/common/uri';
import { TPromise } from 'base/common/winjs.base';
import { Action } from 'base/common/actions';

export class OpenUrlAction extends Action {

	static readonly ID = 'workbench.action.url.openUrl';
	static readonly LABEL = localize('openUrl', "Open URL");

	constructor(
		id: string,
		label: string,
		@IURLService private urlService: IURLService,
		@IQuickInputService private quickInputService: IQuickInputService,
	) {
		super(id, label);
	}

	run(): TPromise<any> {
		return this.quickInputService.input({ prompt: 'URL to open' }).then(input => {
			const uri = URI.parse(input);
			this.urlService.open(uri);
		});
	}
}

Registry.as<IWorkbenchActionRegistry>(ActionExtensions.WorkbenchActions)
	.registerWorkbenchAction(new SyncActionDescriptor(OpenUrlAction, OpenUrlAction.ID, OpenUrlAction.LABEL), 'OpenUrl', localize('developer', "Developer"));