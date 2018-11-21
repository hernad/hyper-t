/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as nls from 'base/nls';
import { Action } from 'base/common/actions';
import { MenuId, MenuRegistry, SyncActionDescriptor } from 'platform/actions/common/actions';
import { ConfigurationTarget, IConfigurationService } from 'platform/configuration/common/configuration';
import { ContextKeyExpr } from 'platform/contextkey/common/contextkey';
import { Registry } from 'platform/registry/common/platform';
import { Extensions as ActionExtensions, IWorkbenchActionRegistry } from 'workbench/common/actions';

export class ToggleRenderControlCharacterAction extends Action {

	public static readonly ID = 'editor.action.toggleRenderControlCharacter';
	public static readonly LABEL = nls.localize('toggleRenderControlCharacters', "View: Toggle Control Characters");

	constructor(
		id: string,
		label: string,
		@IConfigurationService private readonly _configurationService: IConfigurationService
	) {
		super(id, label);
	}

	public run(): Promise<any> {
		let newRenderControlCharacters = !this._configurationService.getValue<boolean>('editor.renderControlCharacters');
		return this._configurationService.updateValue('editor.renderControlCharacters', newRenderControlCharacters, ConfigurationTarget.USER);
	}
}

const registry = Registry.as<IWorkbenchActionRegistry>(ActionExtensions.WorkbenchActions);
registry.registerWorkbenchAction(new SyncActionDescriptor(ToggleRenderControlCharacterAction, ToggleRenderControlCharacterAction.ID, ToggleRenderControlCharacterAction.LABEL), 'View: Toggle Control Characters');

MenuRegistry.appendMenuItem(MenuId.MenubarViewMenu, {
	group: '5_editor',
	command: {
		id: ToggleRenderControlCharacterAction.ID,
		title: nls.localize({ key: 'miToggleRenderControlCharacters', comment: ['&& denotes a mnemonic'] }, "Toggle &&Control Characters"),
		toggled: ContextKeyExpr.equals('config.editor.renderControlCharacters', true)
	},
	order: 4
});
