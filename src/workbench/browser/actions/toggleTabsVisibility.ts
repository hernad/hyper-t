/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as nls from 'base/nls';
import { Registry } from 'platform/registry/common/platform';
import { Action } from 'base/common/actions';
import { SyncActionDescriptor } from 'platform/actions/common/actions';
import { IWorkbenchActionRegistry, Extensions } from 'workbench/common/actions';
import { IConfigurationService } from 'platform/configuration/common/configuration';
import { KeyCode, KeyMod } from 'base/common/keyCodes';

export class ToggleTabsVisibilityAction extends Action {

	static readonly ID = 'workbench.action.toggleTabsVisibility';
	static readonly LABEL = nls.localize('toggleTabs', "Toggle Tab Visibility");

	private static readonly tabsVisibleKey = 'workbench.editor.showTabs';

	constructor(
		id: string,
		label: string,
		@IConfigurationService private configurationService: IConfigurationService
	) {
		super(id, label);
	}

	run(): Promise<any> {
		const visibility = this.configurationService.getValue<string>(ToggleTabsVisibilityAction.tabsVisibleKey);
		const newVisibilityValue = !visibility;

		return this.configurationService.updateValue(ToggleTabsVisibilityAction.tabsVisibleKey, newVisibilityValue);
	}
}

const registry = Registry.as<IWorkbenchActionRegistry>(Extensions.WorkbenchActions);
registry.registerWorkbenchAction(new SyncActionDescriptor(ToggleTabsVisibilityAction, ToggleTabsVisibilityAction.ID, ToggleTabsVisibilityAction.LABEL, { primary: KeyMod.CtrlCmd | KeyMod.WinCtrl | KeyCode.KEY_W }), 'View: Toggle Tab Visibility', nls.localize('view', "View"));