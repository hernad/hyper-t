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

export class ToggleRenderWhitespaceAction extends Action {

	public static readonly ID = 'editor.action.toggleRenderWhitespace';
	public static readonly LABEL = nls.localize('toggleRenderWhitespace', "View: Toggle Render Whitespace");

	constructor(
		id: string,
		label: string,
		@IConfigurationService private readonly _configurationService: IConfigurationService
	) {
		super(id, label);
	}

	public run(): Promise<any> {
		const renderWhitespace = this._configurationService.getValue<string>('editor.renderWhitespace');

		let newRenderWhitespace: string;
		if (renderWhitespace === 'none') {
			newRenderWhitespace = 'all';
		} else {
			newRenderWhitespace = 'none';
		}

		return this._configurationService.updateValue('editor.renderWhitespace', newRenderWhitespace, ConfigurationTarget.USER);
	}
}

const registry = Registry.as<IWorkbenchActionRegistry>(ActionExtensions.WorkbenchActions);
registry.registerWorkbenchAction(new SyncActionDescriptor(ToggleRenderWhitespaceAction, ToggleRenderWhitespaceAction.ID, ToggleRenderWhitespaceAction.LABEL), 'View: Toggle Render Whitespace');

MenuRegistry.appendMenuItem(MenuId.MenubarViewMenu, {
	group: '5_editor',
	command: {
		id: ToggleRenderWhitespaceAction.ID,
		title: nls.localize({ key: 'miToggleRenderWhitespace', comment: ['&& denotes a mnemonic'] }, "Toggle &&Render Whitespace"),
		toggled: ContextKeyExpr.notEquals('config.editor.renderWhitespace', 'none')
	},
	order: 3
});
