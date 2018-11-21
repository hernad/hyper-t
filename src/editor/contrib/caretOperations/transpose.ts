/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as nls from 'base/nls';
import { KeyCode, KeyMod } from 'base/common/keyCodes';
import { isHighSurrogate, isLowSurrogate } from 'base/common/strings';
import { ICodeEditor } from 'editor/browser/editorBrowser';
import { EditorAction, ServicesAccessor, registerEditorAction } from 'editor/browser/editorExtensions';
import { ReplaceCommand } from 'editor/common/commands/replaceCommand';
import { IPosition, Position } from 'editor/common/core/position';
import { Range } from 'editor/common/core/range';
import { ICommand } from 'editor/common/editorCommon';
import { EditorContextKeys } from 'editor/common/editorContextKeys';
import { ITextModel } from 'editor/common/model';
import { KeybindingWeight } from 'platform/keybinding/common/keybindingsRegistry';

class TransposeLettersAction extends EditorAction {

	private positionLeftOf(start: IPosition, model: ITextModel): Position {
		let column = start.column;
		let lineNumber = start.lineNumber;

		if (column > model.getLineMinColumn(lineNumber)) {
			if (isLowSurrogate(model.getLineContent(lineNumber).charCodeAt(column - 2))) {
				// character before column is a low surrogate
				column = column - 2;
			} else {
				column = column - 1;
			}
		} else if (lineNumber > 1) {
			lineNumber = lineNumber - 1;
			column = model.getLineMaxColumn(lineNumber);
		}

		return new Position(lineNumber, column);
	}

	private positionRightOf(start: IPosition, model: ITextModel): Position {
		let column = start.column;
		let lineNumber = start.lineNumber;

		if (column < model.getLineMaxColumn(lineNumber)) {
			if (isHighSurrogate(model.getLineContent(lineNumber).charCodeAt(column - 1))) {
				// character after column is a high surrogate
				column = column + 2;
			} else {
				column = column + 1;
			}
		} else if (lineNumber < model.getLineCount()) {
			lineNumber = lineNumber + 1;
			column = 0;
		}

		return new Position(lineNumber, column);
	}

	constructor() {
		super({
			id: 'editor.action.transposeLetters',
			label: nls.localize('transposeLetters.label', "Transpose Letters"),
			alias: 'Transpose Letters',
			precondition: EditorContextKeys.writable,
			kbOpts: {
				kbExpr: EditorContextKeys.textInputFocus,
				primary: 0,
				mac: {
					primary: KeyMod.WinCtrl | KeyCode.KEY_T
				},
				weight: KeybindingWeight.EditorContrib
			}
		});
	}

	public run(accessor: ServicesAccessor, editor: ICodeEditor): void {
		if (!editor.hasModel()) {
			return;
		}

		let model = editor.getModel();
		let commands: ICommand[] = [];
		let selections = editor.getSelections();

		for (let selection of selections) {
			if (!selection.isEmpty()) {
				continue;
			}

			let lineNumber = selection.startLineNumber;
			let column = selection.startColumn;

			let lastColumn = model.getLineMaxColumn(lineNumber);

			if (lineNumber === 1 && (column === 1 || (column === 2 && lastColumn === 2))) {
				// at beginning of file, nothing to do
				continue;
			}

			// handle special case: when at end of line, transpose left two chars
			// otherwise, transpose left and right chars
			let endPosition = (column === lastColumn) ?
				selection.getPosition() :
				this.positionRightOf(selection.getPosition(), model);

			let middlePosition = this.positionLeftOf(endPosition, model);
			let beginPosition = this.positionLeftOf(middlePosition, model);

			let leftChar = model.getValueInRange(Range.fromPositions(beginPosition, middlePosition));
			let rightChar = model.getValueInRange(Range.fromPositions(middlePosition, endPosition));

			let replaceRange = Range.fromPositions(beginPosition, endPosition);
			commands.push(new ReplaceCommand(replaceRange, rightChar + leftChar));
		}

		if (commands.length > 0) {
			editor.pushUndoStop();
			editor.executeCommands(this.id, commands);
			editor.pushUndoStop();
		}
	}
}

registerEditorAction(TransposeLettersAction);
