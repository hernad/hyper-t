/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'css!./media/actions';
import * as nls from 'base/nls';
import { Registry } from 'platform/registry/common/platform';
import { Action } from 'base/common/actions';
import { SyncActionDescriptor, MenuRegistry, MenuId } from 'platform/actions/common/actions';
import { IWorkbenchActionRegistry, Extensions } from 'workbench/common/actions';
import { KeyMod, KeyCode } from 'base/common/keyCodes';
import { dispose, IDisposable } from 'base/common/lifecycle';
import { CommandsRegistry } from 'platform/commands/common/commands';
import { ServicesAccessor } from 'platform/instantiation/common/instantiation';
import { IEditorGroupsService, GroupOrientation } from 'workbench/services/group/common/editorGroupsService';

export class ToggleEditorLayoutAction extends Action {

	static readonly ID = 'workbench.action.toggleEditorGroupLayout';
	static readonly LABEL = nls.localize('flipLayout', "Toggle Vertical/Horizontal Editor Layout");

	private toDispose: IDisposable[];

	constructor(
		id: string,
		label: string,
		@IEditorGroupsService private editorGroupService: IEditorGroupsService
	) {
		super(id, label);

		this.toDispose = [];

		this.class = 'flip-editor-layout';
		this.updateEnablement();

		this.registerListeners();
	}

	private registerListeners(): void {
		this.toDispose.push(this.editorGroupService.onDidAddGroup(() => this.updateEnablement()));
		this.toDispose.push(this.editorGroupService.onDidRemoveGroup(() => this.updateEnablement()));
	}

	private updateEnablement(): void {
		this.enabled = this.editorGroupService.count > 1;
	}

	run(): Promise<any> {
		const newOrientation = (this.editorGroupService.orientation === GroupOrientation.VERTICAL) ? GroupOrientation.HORIZONTAL : GroupOrientation.VERTICAL;
		this.editorGroupService.setGroupOrientation(newOrientation);

		return Promise.resolve(null);
	}

	dispose(): void {
		this.toDispose = dispose(this.toDispose);

		super.dispose();
	}
}

CommandsRegistry.registerCommand('_workbench.editor.setGroupOrientation', function (accessor: ServicesAccessor, args: [GroupOrientation]) {
	const editorGroupService = accessor.get(IEditorGroupsService);
	const [orientation] = args;

	editorGroupService.setGroupOrientation(orientation);

	return Promise.resolve(null);
});

const registry = Registry.as<IWorkbenchActionRegistry>(Extensions.WorkbenchActions);
const group = nls.localize('view', "View");
registry.registerWorkbenchAction(new SyncActionDescriptor(ToggleEditorLayoutAction, ToggleEditorLayoutAction.ID, ToggleEditorLayoutAction.LABEL, { primary: KeyMod.Shift | KeyMod.Alt | KeyCode.KEY_0, mac: { primary: KeyMod.CtrlCmd | KeyMod.Alt | KeyCode.KEY_0 } }), 'View: Flip Editor Group Layout', group);

MenuRegistry.appendMenuItem(MenuId.MenubarLayoutMenu, {
	group: 'z_flip',
	command: {
		id: ToggleEditorLayoutAction.ID,
		title: nls.localize({ key: 'miToggleEditorLayout', comment: ['&& denotes a mnemonic'] }, "Flip &&Layout")
	},
	order: 1
});
