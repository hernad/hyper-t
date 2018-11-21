/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as nls from 'base/nls';
import { KeyCode, KeyMod } from 'base/common/keyCodes';
import { dispose } from 'base/common/lifecycle';
import { IInstantiationService } from 'platform/instantiation/common/instantiation';
import { IEditorContribution } from 'editor/common/editorCommon';
import { EditorContextKeys } from 'editor/common/editorContextKeys';
import { ContextKeyExpr } from 'platform/contextkey/common/contextkey';
import { registerEditorAction, registerEditorContribution, ServicesAccessor, EditorAction, EditorCommand, registerEditorCommand } from 'editor/browser/editorExtensions';
import { ICodeEditor } from 'editor/browser/editorBrowser';
import { ParameterHintsWidget, TriggerContext } from './parameterHintsWidget';
import { Context } from 'editor/contrib/parameterHints/provideSignatureHelp';
import { KeybindingWeight } from 'platform/keybinding/common/keybindingsRegistry';
import * as modes from 'editor/common/modes';

class ParameterHintsController implements IEditorContribution {

	private static readonly ID = 'editor.controller.parameterHints';

	public static get(editor: ICodeEditor): ParameterHintsController {
		return editor.getContribution<ParameterHintsController>(ParameterHintsController.ID);
	}

	private editor: ICodeEditor;
	private widget: ParameterHintsWidget;

	constructor(editor: ICodeEditor, @IInstantiationService instantiationService: IInstantiationService) {
		this.editor = editor;
		this.widget = instantiationService.createInstance(ParameterHintsWidget, this.editor);
	}

	getId(): string {
		return ParameterHintsController.ID;
	}

	cancel(): void {
		this.widget.cancel();
	}

	previous(): void {
		this.widget.previous();
	}

	next(): void {
		this.widget.next();
	}

	trigger(context: TriggerContext): void {
		this.widget.trigger(context);
	}

	dispose(): void {
		this.widget = dispose(this.widget);
	}
}

export class TriggerParameterHintsAction extends EditorAction {

	constructor() {
		super({
			id: 'editor.action.triggerParameterHints',
			label: nls.localize('parameterHints.trigger.label', "Trigger Parameter Hints"),
			alias: 'Trigger Parameter Hints',
			precondition: EditorContextKeys.hasSignatureHelpProvider,
			kbOpts: {
				kbExpr: EditorContextKeys.editorTextFocus,
				primary: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.Space,
				weight: KeybindingWeight.EditorContrib
			}
		});
	}

	public run(accessor: ServicesAccessor, editor: ICodeEditor): void {
		let controller = ParameterHintsController.get(editor);
		if (controller) {
			controller.trigger({
				triggerReason: modes.SignatureHelpTriggerReason.Invoke
			});
		}
	}
}

registerEditorContribution(ParameterHintsController);
registerEditorAction(TriggerParameterHintsAction);

const weight = KeybindingWeight.EditorContrib + 75;

const ParameterHintsCommand = EditorCommand.bindToContribution<ParameterHintsController>(ParameterHintsController.get);

registerEditorCommand(new ParameterHintsCommand({
	id: 'closeParameterHints',
	precondition: Context.Visible,
	handler: x => x.cancel(),
	kbOpts: {
		weight: weight,
		kbExpr: EditorContextKeys.editorTextFocus,
		primary: KeyCode.Escape,
		secondary: [KeyMod.Shift | KeyCode.Escape]
	}
}));
registerEditorCommand(new ParameterHintsCommand({
	id: 'showPrevParameterHint',
	precondition: ContextKeyExpr.and(Context.Visible, Context.MultipleSignatures),
	handler: x => x.previous(),
	kbOpts: {
		weight: weight,
		kbExpr: EditorContextKeys.editorTextFocus,
		primary: KeyCode.UpArrow,
		secondary: [KeyMod.Alt | KeyCode.UpArrow],
		mac: { primary: KeyCode.UpArrow, secondary: [KeyMod.Alt | KeyCode.UpArrow, KeyMod.WinCtrl | KeyCode.KEY_P] }
	}
}));
registerEditorCommand(new ParameterHintsCommand({
	id: 'showNextParameterHint',
	precondition: ContextKeyExpr.and(Context.Visible, Context.MultipleSignatures),
	handler: x => x.next(),
	kbOpts: {
		weight: weight,
		kbExpr: EditorContextKeys.editorTextFocus,
		primary: KeyCode.DownArrow,
		secondary: [KeyMod.Alt | KeyCode.DownArrow],
		mac: { primary: KeyCode.DownArrow, secondary: [KeyMod.Alt | KeyCode.DownArrow, KeyMod.WinCtrl | KeyCode.KEY_N] }
	}
}));
