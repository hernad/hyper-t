/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as nls from 'base/nls';
import { Registry } from 'platform/registry/common/platform';
import { Action } from 'base/common/actions';
import { SyncActionDescriptor, MenuRegistry, MenuId } from 'platform/actions/common/actions';
import { IWorkbenchActionRegistry, Extensions } from 'workbench/common/actions';
import { IPartService, Parts } from 'workbench/services/part/common/partService';
import { KeyMod, KeyCode } from 'base/common/keyCodes';

export class ToggleSidebarVisibilityAction extends Action {

	static readonly ID = 'workbench.action.toggleSidebarVisibility';
	static readonly LABEL = nls.localize('toggleSidebar', "Toggle Side Bar Visibility");

	constructor(
		id: string,
		label: string,
		@IPartService private partService: IPartService
	) {
		super(id, label);

		this.enabled = !!this.partService;
	}

	run(): Thenable<any> {
		const hideSidebar = this.partService.isVisible(Parts.SIDEBAR_PART);
		this.partService.setSideBarHidden(hideSidebar);

		return Promise.resolve(null);
	}
}

const registry = Registry.as<IWorkbenchActionRegistry>(Extensions.WorkbenchActions);
registry.registerWorkbenchAction(new SyncActionDescriptor(ToggleSidebarVisibilityAction, ToggleSidebarVisibilityAction.ID, ToggleSidebarVisibilityAction.LABEL, { primary: KeyMod.CtrlCmd | KeyCode.KEY_B }), 'View: Toggle Side Bar Visibility', nls.localize('view', "View"));

MenuRegistry.appendMenuItem(MenuId.MenubarAppearanceMenu, {
	group: '2_workbench_layout',
	command: {
		id: ToggleSidebarVisibilityAction.ID,
		title: nls.localize({ key: 'miToggleSidebar', comment: ['&& denotes a mnemonic'] }, "&&Toggle Side Bar")
	},
	order: 1
});
