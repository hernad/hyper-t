/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Emitter, Event } from 'base/common/event';
import { ExtHostEditorsShape, IEditorPropertiesChangeData, IMainContext, ITextDocumentShowOptions, ITextEditorPositionData, MainContext, MainThreadTextEditorsShape } from 'workbench/api/node/extHost.protocol';
import { ExtHostDocumentsAndEditors } from 'workbench/api/node/extHostDocumentsAndEditors';
import { ExtHostTextEditor, TextEditorDecorationType } from 'workbench/api/node/extHostTextEditor';
import * as TypeConverters from 'workbench/api/node/extHostTypeConverters';
import { TextEditorSelectionChangeKind } from 'workbench/api/node/extHostTypes';
import * as hypert from 'hypert';

export class ExtHostEditors implements ExtHostEditorsShape {

	private readonly _onDidChangeTextEditorSelection = new Emitter<hypert.TextEditorSelectionChangeEvent>();
	private readonly _onDidChangeTextEditorOptions = new Emitter<hypert.TextEditorOptionsChangeEvent>();
	private readonly _onDidChangeTextEditorVisibleRanges = new Emitter<hypert.TextEditorVisibleRangesChangeEvent>();
	private readonly _onDidChangeTextEditorViewColumn = new Emitter<hypert.TextEditorViewColumnChangeEvent>();
	private readonly _onDidChangeActiveTextEditor = new Emitter<hypert.TextEditor | undefined>();
	private readonly _onDidChangeVisibleTextEditors = new Emitter<hypert.TextEditor[]>();

	readonly onDidChangeTextEditorSelection: Event<hypert.TextEditorSelectionChangeEvent> = this._onDidChangeTextEditorSelection.event;
	readonly onDidChangeTextEditorOptions: Event<hypert.TextEditorOptionsChangeEvent> = this._onDidChangeTextEditorOptions.event;
	readonly onDidChangeTextEditorVisibleRanges: Event<hypert.TextEditorVisibleRangesChangeEvent> = this._onDidChangeTextEditorVisibleRanges.event;
	readonly onDidChangeTextEditorViewColumn: Event<hypert.TextEditorViewColumnChangeEvent> = this._onDidChangeTextEditorViewColumn.event;
	readonly onDidChangeActiveTextEditor: Event<hypert.TextEditor | undefined> = this._onDidChangeActiveTextEditor.event;
	readonly onDidChangeVisibleTextEditors: Event<hypert.TextEditor[]> = this._onDidChangeVisibleTextEditors.event;


	private _proxy: MainThreadTextEditorsShape;
	private _extHostDocumentsAndEditors: ExtHostDocumentsAndEditors;

	constructor(
		mainContext: IMainContext,
		extHostDocumentsAndEditors: ExtHostDocumentsAndEditors,
	) {
		this._proxy = mainContext.getProxy(MainContext.MainThreadTextEditors);
		this._extHostDocumentsAndEditors = extHostDocumentsAndEditors;

		this._extHostDocumentsAndEditors.onDidChangeVisibleTextEditors(e => this._onDidChangeVisibleTextEditors.fire(e));
		this._extHostDocumentsAndEditors.onDidChangeActiveTextEditor(e => this._onDidChangeActiveTextEditor.fire(e));
	}

	getActiveTextEditor(): ExtHostTextEditor {
		return this._extHostDocumentsAndEditors.activeEditor();
	}

	getVisibleTextEditors(): hypert.TextEditor[] {
		return this._extHostDocumentsAndEditors.allEditors();
	}

	showTextDocument(document: hypert.TextDocument, column: hypert.ViewColumn, preserveFocus: boolean): Thenable<hypert.TextEditor>;
	showTextDocument(document: hypert.TextDocument, options: { column: hypert.ViewColumn, preserveFocus: boolean, pinned: boolean }): Thenable<hypert.TextEditor>;
	showTextDocument(document: hypert.TextDocument, columnOrOptions: hypert.ViewColumn | hypert.TextDocumentShowOptions, preserveFocus?: boolean): Thenable<hypert.TextEditor>;
	showTextDocument(document: hypert.TextDocument, columnOrOptions: hypert.ViewColumn | hypert.TextDocumentShowOptions, preserveFocus?: boolean): Thenable<hypert.TextEditor> {
		let options: ITextDocumentShowOptions;
		if (typeof columnOrOptions === 'number') {
			options = {
				position: TypeConverters.ViewColumn.from(columnOrOptions),
				preserveFocus
			};
		} else if (typeof columnOrOptions === 'object') {
			options = {
				position: TypeConverters.ViewColumn.from(columnOrOptions.viewColumn),
				preserveFocus: columnOrOptions.preserveFocus,
				selection: typeof columnOrOptions.selection === 'object' ? TypeConverters.Range.from(columnOrOptions.selection) : undefined,
				pinned: typeof columnOrOptions.preview === 'boolean' ? !columnOrOptions.preview : undefined
			};
		} else {
			options = {
				preserveFocus: false
			};
		}

		return this._proxy.$tryShowTextDocument(document.uri, options).then(id => {
			let editor = this._extHostDocumentsAndEditors.getEditor(id);
			if (editor) {
				return editor;
			} else {
				throw new Error(`Failed to show text document ${document.uri.toString()}, should show in editor #${id}`);
			}
		});
	}

	createTextEditorDecorationType(options: hypert.DecorationRenderOptions): hypert.TextEditorDecorationType {
		return new TextEditorDecorationType(this._proxy, options);
	}

	applyWorkspaceEdit(edit: hypert.WorkspaceEdit): Thenable<boolean> {
		const dto = TypeConverters.WorkspaceEdit.from(edit, this._extHostDocumentsAndEditors);
		return this._proxy.$tryApplyWorkspaceEdit(dto);
	}

	// --- called from main thread

	$acceptEditorPropertiesChanged(id: string, data: IEditorPropertiesChangeData): void {
		const textEditor = this._extHostDocumentsAndEditors.getEditor(id);

		// (1) set all properties
		if (data.options) {
			textEditor._acceptOptions(data.options);
		}
		if (data.selections) {
			const selections = data.selections.selections.map(TypeConverters.Selection.to);
			textEditor._acceptSelections(selections);
		}
		if (data.visibleRanges) {
			const visibleRanges = data.visibleRanges.map(TypeConverters.Range.to);
			textEditor._acceptVisibleRanges(visibleRanges);
		}

		// (2) fire change events
		if (data.options) {
			this._onDidChangeTextEditorOptions.fire({
				textEditor: textEditor,
				options: data.options
			});
		}
		if (data.selections) {
			const kind = TextEditorSelectionChangeKind.fromValue(data.selections.source);
			const selections = data.selections.selections.map(TypeConverters.Selection.to);
			this._onDidChangeTextEditorSelection.fire({
				textEditor,
				selections,
				kind
			});
		}
		if (data.visibleRanges) {
			const visibleRanges = data.visibleRanges.map(TypeConverters.Range.to);
			this._onDidChangeTextEditorVisibleRanges.fire({
				textEditor,
				visibleRanges
			});
		}
	}

	$acceptEditorPositionData(data: ITextEditorPositionData): void {
		for (let id in data) {
			let textEditor = this._extHostDocumentsAndEditors.getEditor(id);
			let viewColumn = TypeConverters.ViewColumn.to(data[id]);
			if (textEditor.viewColumn !== viewColumn) {
				textEditor._acceptViewColumn(viewColumn);
				this._onDidChangeTextEditorViewColumn.fire({ textEditor, viewColumn });
			}
		}
	}

	getDiffInformation(id: string): Thenable<hypert.LineChange[]> {
		return Promise.resolve(this._proxy.$getDiffInformation(id));
	}
}
