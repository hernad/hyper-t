/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as nls from 'base/nls';
import { alert } from 'base/browser/ui/aria/aria';
import { KeyCode, KeyMod } from 'base/common/keyCodes';
import { ICodeEditor } from 'editor/browser/editorBrowser';
import { EditorAction, ServicesAccessor, registerEditorAction } from 'editor/browser/editorExtensions';
import { TabFocus } from 'editor/common/config/commonEditorConfig';
import { KeybindingWeight } from 'platform/keybinding/common/keybindingsRegistry';

export class ToggleTabFocusModeAction extends EditorAction {

	public static readonly ID = 'editor.action.toggleTabFocusMode';

	constructor() {
		super({
			id: ToggleTabFocusModeAction.ID,
			label: nls.localize({ key: 'toggle.tabMovesFocus', comment: ['Turn on/off use of tab key for moving focus around VS Code'] }, "Toggle Tab Key Moves Focus"),
			alias: 'Toggle Tab Key Moves Focus',
			precondition: null,
			kbOpts: {
				kbExpr: null,
				primary: KeyMod.CtrlCmd | KeyCode.KEY_M,
				mac: { primary: KeyMod.WinCtrl | KeyMod.Shift | KeyCode.KEY_M },
				weight: KeybindingWeight.EditorContrib
			}
		});
	}

	public run(accessor: ServicesAccessor, editor: ICodeEditor): void {
		const oldValue = TabFocus.getTabFocusMode();
		const newValue = !oldValue;
		TabFocus.setTabFocusMode(newValue);
		if (newValue) {
			alert(nls.localize('toggle.tabMovesFocus.on', "Pressing Tab will now move focus to the next focusable element"));
		} else {
			alert(nls.localize('toggle.tabMovesFocus.off', "Pressing Tab will now insert the tab character"));
		}
	}
}

registerEditorAction(ToggleTabFocusModeAction);
