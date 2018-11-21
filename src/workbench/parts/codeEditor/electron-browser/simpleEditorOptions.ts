/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ICodeEditorWidgetOptions } from 'editor/browser/widget/codeEditorWidget';
import { ContextMenuController } from 'editor/contrib/contextmenu/contextmenu';
import { SnippetController2 } from 'editor/contrib/snippet/snippetController2';
import { SuggestController } from 'editor/contrib/suggest/suggestController';
import { MenuPreventer } from 'workbench/parts/codeEditor/browser/menuPreventer';
import { SelectionClipboard } from 'workbench/parts/codeEditor/electron-browser/selectionClipboard';
import { TabCompletionController } from 'workbench/parts/snippets/electron-browser/tabCompletion';

export function getSimpleCodeEditorWidgetOptions(): ICodeEditorWidgetOptions {
	return {
		isSimpleWidget: true,
		contributions: [
			MenuPreventer,
			SelectionClipboard,
			ContextMenuController,
			SuggestController,
			SnippetController2,
			TabCompletionController,
		]
	};
}