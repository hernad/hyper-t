/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KeyCode, KeyMod } from 'base/common/keyCodes';
import { localize } from 'base/nls';
import { SyncActionDescriptor } from 'platform/actions/common/actions';
import { ContextKeyExpr } from 'platform/contextkey/common/contextkey';
import { SyncDescriptor } from 'platform/instantiation/common/descriptors';
import { registerSingleton } from 'platform/instantiation/common/extensions';
import { KeybindingWeight } from 'platform/keybinding/common/keybindingsRegistry';
import { Registry } from 'platform/registry/common/platform';
import { EditorDescriptor, Extensions as EditorExtensions, IEditorRegistry } from 'workbench/browser/editor';
import { Extensions as ActionExtensions, IWorkbenchActionRegistry } from 'workbench/common/actions';
import { Extensions as EditorInputExtensions, IEditorInputFactoryRegistry } from 'workbench/common/editor';
import { WebviewEditorInputFactory } from 'workbench/parts/webview/electron-browser/webviewEditorInputFactory';
import { KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_VISIBLE } from './baseWebviewEditor';
import { HideWebViewEditorFindCommand, OpenWebviewDeveloperToolsAction, ReloadWebviewAction, ShowWebViewEditorFindWidgetCommand, SelectAllWebviewEditorCommand } from './webviewCommands';
import { WebviewEditor } from './webviewEditor';
import { WebviewEditorInput } from './webviewEditorInput';
import { IWebviewEditorService, WebviewEditorService } from './webviewEditorService';
import { InputFocusedContextKey } from 'platform/workbench/common/contextkeys';

(Registry.as<IEditorRegistry>(EditorExtensions.Editors)).registerEditor(new EditorDescriptor(
	WebviewEditor,
	WebviewEditor.ID,
	localize('webview.editor.label', "webview editor")),
	[new SyncDescriptor(WebviewEditorInput)]);

Registry.as<IEditorInputFactoryRegistry>(EditorInputExtensions.EditorInputFactories).registerEditorInputFactory(
	WebviewEditorInputFactory.ID,
	WebviewEditorInputFactory);

registerSingleton(IWebviewEditorService, WebviewEditorService);


const webviewDeveloperCategory = localize('developer', "Developer");

const actionRegistry = Registry.as<IWorkbenchActionRegistry>(ActionExtensions.WorkbenchActions);

export function registerWebViewCommands(editorId: string): void {
	const contextKeyExpr = ContextKeyExpr.and(ContextKeyExpr.equals('activeEditor', editorId), ContextKeyExpr.not('editorFocus') /* https://github.com/hernad/hyper-t/issues/58668 */);

	const showNextFindWidgetCommand = new ShowWebViewEditorFindWidgetCommand({
		id: ShowWebViewEditorFindWidgetCommand.ID,
		precondition: contextKeyExpr,
		kbOpts: {
			primary: KeyMod.CtrlCmd | KeyCode.KEY_F,
			weight: KeybindingWeight.EditorContrib
		}
	});
	showNextFindWidgetCommand.register();

	const hideCommand = new HideWebViewEditorFindCommand({
		id: HideWebViewEditorFindCommand.ID,
		precondition: ContextKeyExpr.and(
			contextKeyExpr,
			KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_VISIBLE),
		kbOpts: {
			primary: KeyCode.Escape,
			weight: KeybindingWeight.EditorContrib
		}
	});
	hideCommand.register();

	const selectAllCommand = new SelectAllWebviewEditorCommand({
		id: SelectAllWebviewEditorCommand.ID,
		precondition: ContextKeyExpr.and(contextKeyExpr, ContextKeyExpr.not(InputFocusedContextKey)),
		kbOpts: {
			primary: KeyMod.CtrlCmd | KeyCode.KEY_A,
			weight: KeybindingWeight.EditorContrib
		}
	});
	selectAllCommand.register();
}

registerWebViewCommands(WebviewEditor.ID);

actionRegistry.registerWorkbenchAction(
	new SyncActionDescriptor(OpenWebviewDeveloperToolsAction, OpenWebviewDeveloperToolsAction.ID, OpenWebviewDeveloperToolsAction.LABEL),
	'Webview Tools',
	webviewDeveloperCategory);

actionRegistry.registerWorkbenchAction(
	new SyncActionDescriptor(ReloadWebviewAction, ReloadWebviewAction.ID, ReloadWebviewAction.LABEL),
	'Reload Webview',
	webviewDeveloperCategory);