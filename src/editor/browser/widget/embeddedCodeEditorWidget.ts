/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as objects from 'base/common/objects';
import { ICodeEditor } from 'editor/browser/editorBrowser';
import { ICodeEditorService } from 'editor/browser/services/codeEditorService';
import { CodeEditorWidget } from 'editor/browser/widget/codeEditorWidget';
import { DiffEditorWidget } from 'editor/browser/widget/diffEditorWidget';
import { IConfigurationChangedEvent, IDiffEditorOptions, IEditorOptions } from 'editor/common/config/editorOptions';
import { IEditorWorkerService } from 'editor/common/services/editorWorkerService';
import { ICommandService } from 'platform/commands/common/commands';
import { IContextKeyService } from 'platform/contextkey/common/contextkey';
import { IInstantiationService } from 'platform/instantiation/common/instantiation';
import { INotificationService } from 'platform/notification/common/notification';
import { IThemeService } from 'platform/theme/common/themeService';

export class EmbeddedCodeEditorWidget extends CodeEditorWidget {

	private _parentEditor: ICodeEditor;
	private _overwriteOptions: IEditorOptions;

	constructor(
		domElement: HTMLElement,
		options: IEditorOptions,
		parentEditor: ICodeEditor,
		@IInstantiationService instantiationService: IInstantiationService,
		@ICodeEditorService codeEditorService: ICodeEditorService,
		@ICommandService commandService: ICommandService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IThemeService themeService: IThemeService,
		@INotificationService notificationService: INotificationService
	) {
		super(domElement, parentEditor.getRawConfiguration(), {}, instantiationService, codeEditorService, commandService, contextKeyService, themeService, notificationService);

		this._parentEditor = parentEditor;
		this._overwriteOptions = options;

		// Overwrite parent's options
		super.updateOptions(this._overwriteOptions);

		this._register(parentEditor.onDidChangeConfiguration((e: IConfigurationChangedEvent) => this._onParentConfigurationChanged(e)));
	}

	getParentEditor(): ICodeEditor {
		return this._parentEditor;
	}

	private _onParentConfigurationChanged(e: IConfigurationChangedEvent): void {
		super.updateOptions(this._parentEditor.getRawConfiguration());
		super.updateOptions(this._overwriteOptions);
	}

	updateOptions(newOptions: IEditorOptions): void {
		objects.mixin(this._overwriteOptions, newOptions, true);
		super.updateOptions(this._overwriteOptions);
	}
}

export class EmbeddedDiffEditorWidget extends DiffEditorWidget {

	private _parentEditor: ICodeEditor;
	private _overwriteOptions: IDiffEditorOptions;

	constructor(
		domElement: HTMLElement,
		options: IDiffEditorOptions,
		parentEditor: ICodeEditor,
		@IEditorWorkerService editorWorkerService: IEditorWorkerService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IInstantiationService instantiationService: IInstantiationService,
		@ICodeEditorService codeEditorService: ICodeEditorService,
		@IThemeService themeService: IThemeService,
		@INotificationService notificationService: INotificationService
	) {
		super(domElement, parentEditor.getRawConfiguration(), editorWorkerService, contextKeyService, instantiationService, codeEditorService, themeService, notificationService);

		this._parentEditor = parentEditor;
		this._overwriteOptions = options;

		// Overwrite parent's options
		super.updateOptions(this._overwriteOptions);

		this._register(parentEditor.onDidChangeConfiguration(e => this._onParentConfigurationChanged(e)));
	}

	getParentEditor(): ICodeEditor {
		return this._parentEditor;
	}

	private _onParentConfigurationChanged(e: IConfigurationChangedEvent): void {
		super.updateOptions(this._parentEditor.getRawConfiguration());
		super.updateOptions(this._overwriteOptions);
	}

	updateOptions(newOptions: IEditorOptions): void {
		objects.mixin(this._overwriteOptions, newOptions, true);
		super.updateOptions(this._overwriteOptions);
	}
}
