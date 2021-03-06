/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { registerEditorAction, registerEditorCommand, registerEditorContribution } from 'editor/browser/editorExtensions';
import { CodeActionCommand, OrganizeImportsAction, QuickFixAction, QuickFixController, RefactorAction, SourceAction } from 'editor/contrib/codeAction/codeActionCommands';


registerEditorContribution(QuickFixController);
registerEditorAction(QuickFixAction);
registerEditorAction(RefactorAction);
registerEditorAction(SourceAction);
registerEditorAction(OrganizeImportsAction);
registerEditorCommand(new CodeActionCommand());
