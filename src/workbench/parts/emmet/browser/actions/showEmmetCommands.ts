/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as nls from 'base/nls';

import { registerEditorAction, EditorAction, ServicesAccessor } from 'editor/browser/editorExtensions';
import { IQuickOpenService } from 'platform/quickOpen/common/quickOpen';
import { EditorContextKeys } from 'editor/common/editorContextKeys';
import { ICodeEditor } from 'editor/browser/editorBrowser';
import { MenuId } from 'platform/actions/common/actions';

const EMMET_COMMANDS_PREFIX = '>Emmet: ';

class ShowEmmetCommandsAction extends EditorAction {

	constructor() {
		super({
			id: 'workbench.action.showEmmetCommands',
			label: nls.localize('showEmmetCommands', "Show Emmet Commands"),
			alias: 'Show Emmet Commands',
			precondition: EditorContextKeys.writable,
			menubarOpts: {
				menuId: MenuId.MenubarEditMenu,
				group: '5_insert',
				title: nls.localize({ key: 'miShowEmmetCommands', comment: ['&& denotes a mnemonic'] }, "E&&mmet..."),
				order: 4
			}
		});
	}

	public run(accessor: ServicesAccessor, editor: ICodeEditor): Promise<void> {
		const quickOpenService = accessor.get(IQuickOpenService);
		quickOpenService.show(EMMET_COMMANDS_PREFIX);
		return Promise.resolve(void 0);
	}
}

registerEditorAction(ShowEmmetCommandsAction);
