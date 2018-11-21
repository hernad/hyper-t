/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'css!./media/output';
import * as nls from 'base/nls';
import { Action, IAction } from 'base/common/actions';
import { IActionItem } from 'base/browser/ui/actionbar/actionbar';
import { IEditorOptions } from 'editor/common/config/editorOptions';
import { ITelemetryService } from 'platform/telemetry/common/telemetry';
import { IStorageService } from 'platform/storage/common/storage';
import { ITextResourceConfigurationService } from 'editor/common/services/resourceConfiguration';
import { IInstantiationService } from 'platform/instantiation/common/instantiation';
import { ServiceCollection } from 'platform/instantiation/common/serviceCollection';
import { IContextKeyService } from 'platform/contextkey/common/contextkey';
import { EditorInput, EditorOptions } from 'workbench/common/editor';
import { AbstractTextResourceEditor } from 'workbench/browser/parts/editor/textResourceEditor';
import { OUTPUT_PANEL_ID, IOutputService, CONTEXT_IN_OUTPUT } from 'workbench/parts/output/common/output';
import { SwitchOutputAction, SwitchOutputActionItem, ClearOutputAction, ToggleOutputScrollLockAction, OpenLogOutputFile } from 'workbench/parts/output/browser/outputActions';
import { IThemeService } from 'platform/theme/common/themeService';
import { ITextFileService } from 'workbench/services/textfile/common/textfiles';
import { IConfigurationService } from 'platform/configuration/common/configuration';
import { IEditorGroupsService } from 'workbench/services/group/common/editorGroupsService';
import { CancellationToken } from 'base/common/cancellation';
import { IEditorService } from 'workbench/services/editor/common/editorService';
import { IWindowService } from 'platform/windows/common/windows';

export class OutputPanel extends AbstractTextResourceEditor {
	private actions: IAction[];
	private scopedInstantiationService: IInstantiationService;
	private _focus: boolean;

	constructor(
		@ITelemetryService telemetryService: ITelemetryService,
		@IInstantiationService instantiationService: IInstantiationService,
		@IStorageService storageService: IStorageService,
		@IConfigurationService private baseConfigurationService: IConfigurationService,
		@ITextResourceConfigurationService textResourceConfigurationService: ITextResourceConfigurationService,
		@IThemeService themeService: IThemeService,
		@IOutputService private outputService: IOutputService,
		@IContextKeyService private contextKeyService: IContextKeyService,
		@IEditorGroupsService editorGroupService: IEditorGroupsService,
		@ITextFileService textFileService: ITextFileService,
		@IEditorService editorService: IEditorService,
		@IWindowService windowService: IWindowService
	) {
		super(OUTPUT_PANEL_ID, telemetryService, instantiationService, storageService, textResourceConfigurationService, themeService, editorGroupService, textFileService, editorService, windowService);

		this.scopedInstantiationService = instantiationService;
	}

	public getId(): string {
		return OUTPUT_PANEL_ID;
	}

	public getTitle(): string {
		return nls.localize('output', "Output");
	}

	public getActions(): IAction[] {
		if (!this.actions) {
			this.actions = [
				this.instantiationService.createInstance(SwitchOutputAction),
				this.instantiationService.createInstance(ClearOutputAction, ClearOutputAction.ID, ClearOutputAction.LABEL),
				this.instantiationService.createInstance(ToggleOutputScrollLockAction, ToggleOutputScrollLockAction.ID, ToggleOutputScrollLockAction.LABEL),
				this.instantiationService.createInstance(OpenLogOutputFile)
			];

			this.actions.forEach(a => this._register(a));
		}

		return this.actions;
	}

	public getActionItem(action: Action): IActionItem {
		if (action.id === SwitchOutputAction.ID) {
			return this.instantiationService.createInstance(SwitchOutputActionItem, action);
		}

		return super.getActionItem(action);
	}

	protected getConfigurationOverrides(): IEditorOptions {
		const options = super.getConfigurationOverrides();
		options.wordWrap = 'on';				// all output editors wrap
		options.lineNumbers = 'off';			// all output editors hide line numbers
		options.glyphMargin = false;
		options.lineDecorationsWidth = 20;
		options.rulers = [];
		options.folding = false;
		options.scrollBeyondLastLine = false;
		options.renderLineHighlight = 'none';
		options.minimap = { enabled: false };

		const outputConfig = this.baseConfigurationService.getValue('[Log]');
		if (outputConfig) {
			if (outputConfig['editor.minimap.enabled']) {
				options.minimap = { enabled: true };
			}
			if ('editor.wordWrap' in outputConfig) {
				options.wordWrap = outputConfig['editor.wordWrap'];
			}
		}

		return options;
	}

	protected getAriaLabel(): string {
		const channel = this.outputService.getActiveChannel();

		return channel ? nls.localize('outputPanelWithInputAriaLabel', "{0}, Output panel", channel.label) : nls.localize('outputPanelAriaLabel', "Output panel");
	}

	public setInput(input: EditorInput, options: EditorOptions, token: CancellationToken): Thenable<void> {
		this._focus = !options.preserveFocus;
		if (input.matches(this.input)) {
			return Promise.resolve(null);
		}

		if (this.input) {
			// Dispose previous input (Output panel is not a workbench editor)
			this.input.dispose();
		}
		return super.setInput(input, options, token).then(() => {
			if (this._focus) {
				this.focus();
			}
			this.revealLastLine(false);
		});
	}

	public clearInput(): void {
		if (this.input) {
			// Dispose current input (Output panel is not a workbench editor)
			this.input.dispose();
		}
		super.clearInput();
	}

	protected createEditor(parent: HTMLElement): void {
		// First create the scoped instantation service and only then construct the editor using the scoped service
		const scopedContextKeyService = this._register(this.contextKeyService.createScoped(parent));
		this.scopedInstantiationService = this.instantiationService.createChild(new ServiceCollection([IContextKeyService, scopedContextKeyService]));
		super.createEditor(parent);

		CONTEXT_IN_OUTPUT.bindTo(scopedContextKeyService).set(true);
	}

	public get instantiationService(): IInstantiationService {
		return this.scopedInstantiationService;
	}
}
