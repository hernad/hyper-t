/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as nls from 'base/nls';
import { Action } from 'base/common/actions';
import * as platform from 'base/common/platform';
import { MenuId, MenuRegistry, SyncActionDescriptor } from 'platform/actions/common/actions';
import { ConfigurationTarget, IConfigurationService } from 'platform/configuration/common/configuration';
import { IContextKey, IContextKeyService, RawContextKey } from 'platform/contextkey/common/contextkey';
import { LifecyclePhase } from 'platform/lifecycle/common/lifecycle';
import { Registry } from 'platform/registry/common/platform';
import { Extensions, IWorkbenchActionRegistry } from 'workbench/common/actions';
import { Extensions as WorkbenchExtensions, IWorkbenchContribution, IWorkbenchContributionsRegistry } from 'workbench/common/contributions';

export class ToggleMultiCursorModifierAction extends Action {

	public static readonly ID = 'workbench.action.toggleMultiCursorModifier';
	public static readonly LABEL = nls.localize('toggleLocation', "Toggle Multi-Cursor Modifier");

	private static readonly multiCursorModifierConfigurationKey = 'editor.multiCursorModifier';

	constructor(
		id: string,
		label: string,
		@IConfigurationService private configurationService: IConfigurationService
	) {
		super(id, label);
	}

	public run(): Promise<any> {
		const editorConf = this.configurationService.getValue<{ multiCursorModifier: 'ctrlCmd' | 'alt' }>('editor');
		const newValue: 'ctrlCmd' | 'alt' = (editorConf.multiCursorModifier === 'ctrlCmd' ? 'alt' : 'ctrlCmd');

		return this.configurationService.updateValue(ToggleMultiCursorModifierAction.multiCursorModifierConfigurationKey, newValue, ConfigurationTarget.USER);
	}
}

const multiCursorModifier = new RawContextKey<string>('multiCursorModifier', 'altKey');

class MultiCursorModifierContextKeyController implements IWorkbenchContribution {

	private readonly _multiCursorModifier: IContextKey<string>;

	constructor(
		@IConfigurationService private readonly configurationService: IConfigurationService,
		@IContextKeyService contextKeyService: IContextKeyService
	) {
		this._multiCursorModifier = multiCursorModifier.bindTo(contextKeyService);
		configurationService.onDidChangeConfiguration((e) => {
			if (e.affectsConfiguration('editor.multiCursorModifier')) {
				this._update();
			}
		});
	}

	private _update(): void {
		const editorConf = this.configurationService.getValue<{ multiCursorModifier: 'ctrlCmd' | 'alt' }>('editor');
		const value = (editorConf.multiCursorModifier === 'ctrlCmd' ? 'ctrlCmd' : 'altKey');
		this._multiCursorModifier.set(value);
	}
}

Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench).registerWorkbenchContribution(MultiCursorModifierContextKeyController, LifecyclePhase.Running);


const registry = Registry.as<IWorkbenchActionRegistry>(Extensions.WorkbenchActions);
registry.registerWorkbenchAction(new SyncActionDescriptor(ToggleMultiCursorModifierAction, ToggleMultiCursorModifierAction.ID, ToggleMultiCursorModifierAction.LABEL), 'Toggle Multi-Cursor Modifier');
MenuRegistry.appendMenuItem(MenuId.MenubarSelectionMenu, {
	group: '3_multi',
	command: {
		id: ToggleMultiCursorModifierAction.ID,
		title: nls.localize('miMultiCursorAlt', "Switch to Alt+Click for Multi-Cursor")
	},
	when: multiCursorModifier.isEqualTo('ctrlCmd'),
	order: 1
});
MenuRegistry.appendMenuItem(MenuId.MenubarSelectionMenu, {
	group: '3_multi',
	command: {
		id: ToggleMultiCursorModifierAction.ID,
		title: (
			platform.isMacintosh
				? nls.localize('miMultiCursorCmd', "Switch to Cmd+Click for Multi-Cursor")
				: nls.localize('miMultiCursorCtrl', "Switch to Ctrl+Click for Multi-Cursor")
		)
	},
	when: multiCursorModifier.isEqualTo('altKey'),
	order: 1
});