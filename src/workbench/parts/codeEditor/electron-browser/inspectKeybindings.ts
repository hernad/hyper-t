/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as nls from 'base/nls';
import { ICodeEditor } from 'editor/browser/editorBrowser';
import { EditorAction, ServicesAccessor, registerEditorAction } from 'editor/browser/editorExtensions';
import { IKeybindingService } from 'platform/keybinding/common/keybinding';
import { IUntitledResourceInput } from 'workbench/common/editor';
import { IEditorService } from 'workbench/services/editor/common/editorService';
import { WorkbenchKeybindingService } from 'workbench/services/keybinding/electron-browser/keybindingService';

class InspectKeyMap extends EditorAction {

	constructor() {
		super({
			id: 'workbench.action.inspectKeyMappings',
			label: nls.localize('workbench.action.inspectKeyMap', "Developer: Inspect Key Mappings"),
			alias: 'Developer: Inspect Key Mappings',
			precondition: null
		});
	}

	public run(accessor: ServicesAccessor, editor: ICodeEditor): void {
		const keybindingService = accessor.get(IKeybindingService);
		const editorService = accessor.get(IEditorService);

		if (keybindingService instanceof WorkbenchKeybindingService) {
			editorService.openEditor({ contents: keybindingService.dumpDebugInfo(), options: { pinned: true } } as IUntitledResourceInput);
		}
	}
}

registerEditorAction(InspectKeyMap);
