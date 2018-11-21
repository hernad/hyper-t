/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as nls from 'base/nls';
import { Action } from 'base/common/actions';
import { KeyCode, KeyMod, KeyChord } from 'base/common/keyCodes';
import { Registry } from 'platform/registry/common/platform';
import { SyncActionDescriptor, MenuRegistry, MenuId } from 'platform/actions/common/actions';
import { IWorkbenchActionRegistry, Extensions } from 'workbench/common/actions';
import { IPartService } from 'workbench/services/part/common/partService';

class ToggleZenMode extends Action {

	static readonly ID = 'workbench.action.toggleZenMode';
	static readonly LABEL = nls.localize('toggleZenMode', "Toggle Zen Mode");

	constructor(
		id: string,
		label: string,
		@IPartService private partService: IPartService
	) {
		super(id, label);
		this.enabled = !!this.partService;
	}

	run(): Promise<any> {
		this.partService.toggleZenMode();

		return Promise.resolve(null);
	}
}

const registry = Registry.as<IWorkbenchActionRegistry>(Extensions.WorkbenchActions);
registry.registerWorkbenchAction(new SyncActionDescriptor(ToggleZenMode, ToggleZenMode.ID, ToggleZenMode.LABEL, { primary: KeyChord(KeyMod.CtrlCmd | KeyCode.KEY_K, KeyCode.KEY_Z) }), 'View: Toggle Zen Mode', nls.localize('view', "View"));

MenuRegistry.appendMenuItem(MenuId.MenubarAppearanceMenu, {
	group: '1_toggle_view',
	command: {
		id: ToggleZenMode.ID,
		title: nls.localize('miToggleZenMode', "Toggle Zen Mode")
	},
	order: 2
});
