/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as nls from 'base/nls';
import { Action } from 'base/common/actions';
import { Registry } from 'platform/registry/common/platform';
import { SyncActionDescriptor, MenuRegistry, MenuId } from 'platform/actions/common/actions';
import { IWorkbenchActionRegistry, Extensions } from 'workbench/common/actions';
import { IPartService } from 'workbench/services/part/common/partService';

class ToggleCenteredLayout extends Action {

	static readonly ID = 'workbench.action.toggleCenteredLayout';
	static readonly LABEL = nls.localize('toggleCenteredLayout', "Toggle Centered Layout");

	constructor(
		id: string,
		label: string,
		@IPartService private partService: IPartService
	) {
		super(id, label);
		this.enabled = !!this.partService;
	}

	run(): Promise<any> {
		this.partService.centerEditorLayout(!this.partService.isEditorLayoutCentered());

		return Promise.resolve(null);
	}
}

const registry = Registry.as<IWorkbenchActionRegistry>(Extensions.WorkbenchActions);
registry.registerWorkbenchAction(new SyncActionDescriptor(ToggleCenteredLayout, ToggleCenteredLayout.ID, ToggleCenteredLayout.LABEL), 'View: Toggle Centered Layout', nls.localize('view', "View"));

MenuRegistry.appendMenuItem(MenuId.MenubarAppearanceMenu, {
	group: '1_toggle_view',
	command: {
		id: ToggleCenteredLayout.ID,
		title: nls.localize('miToggleCenteredLayout', "Toggle Centered Layout")
	},
	order: 3
});

MenuRegistry.appendMenuItem(MenuId.MenubarLayoutMenu, {
	group: '2_layouts',
	command: {
		id: 'workbench.action.toggleCenteredLayout',
		title: nls.localize({ key: 'miCenteredEditorLayout', comment: ['&& denotes a mnemonic'] }, "&&Centered")
	},
	order: 2
});
