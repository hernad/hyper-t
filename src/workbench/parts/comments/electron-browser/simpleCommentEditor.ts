/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IEditorOptions } from 'editor/common/config/editorOptions';
import { EditorAction, EditorExtensionsRegistry, IEditorContributionCtor } from 'editor/browser/editorExtensions';
import { ICodeEditorService } from 'editor/browser/services/codeEditorService';
import { CodeEditorWidget } from 'editor/browser/widget/codeEditorWidget';
import { IContextKeyService } from 'platform/contextkey/common/contextkey';
import { IInstantiationService } from 'platform/instantiation/common/instantiation';
import { ICommandService } from 'platform/commands/common/commands';

// Allowed Editor Contributions:
import { MenuPreventer } from 'workbench/parts/codeEditor/browser/menuPreventer';
import { SelectionClipboard } from 'workbench/parts/codeEditor/electron-browser/selectionClipboard';
import { ContextMenuController } from 'editor/contrib/contextmenu/contextmenu';
import { SuggestController } from 'editor/contrib/suggest/suggestController';
import { SnippetController2 } from 'editor/contrib/snippet/snippetController2';
import { TabCompletionController } from 'workbench/parts/snippets/electron-browser/tabCompletion';
import { IThemeService } from 'platform/theme/common/themeService';
import { INotificationService } from 'platform/notification/common/notification';

export class SimpleCommentEditor extends CodeEditorWidget {
	constructor(
		domElement: HTMLElement,
		options: IEditorOptions,
		@IInstantiationService instantiationService: IInstantiationService,
		@ICodeEditorService codeEditorService: ICodeEditorService,
		@ICommandService commandService: ICommandService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IThemeService themeService: IThemeService,
		@INotificationService notificationService: INotificationService,
	) {
		super(domElement, options, { isSimpleWidget: true }, instantiationService, codeEditorService, commandService, contextKeyService, themeService, notificationService);
	}

	protected _getContributions(): IEditorContributionCtor[] {
		return [
			MenuPreventer,
			SelectionClipboard,
			ContextMenuController,
			SuggestController,
			SnippetController2,
			TabCompletionController,
		];
	}

	protected _getActions(): EditorAction[] {
		return EditorExtensionsRegistry.getEditorActions();
	}

	public static getEditorOptions(): IEditorOptions {
		return {
			wordWrap: 'on',
			glyphMargin: false,
			lineNumbers: 'off',
			folding: false,
			selectOnLineNumbers: false,
			scrollbar: {
				vertical: 'visible',
				verticalScrollbarSize: 14,
				horizontal: 'auto',
				useShadows: true,
				verticalHasArrows: false,
				horizontalHasArrows: false
			},
			overviewRulerLanes: 2,
			lineDecorationsWidth: 0,
			scrollBeyondLastLine: false,
			renderLineHighlight: 'none',
			fixedOverflowWidgets: true,
			acceptSuggestionOnEnter: 'smart',
			minimap: {
				enabled: false
			}
		};
	}
}
