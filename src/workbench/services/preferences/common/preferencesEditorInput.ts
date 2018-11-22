/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { OS } from 'base/common/platform';
import { URI } from 'base/common/uri';
import { ITextModelService } from 'editor/common/services/resolverService';
import * as nls from 'base/nls';
import { IInstantiationService } from 'platform/instantiation/common/instantiation';
import { EditorInput, SideBySideEditorInput, Verbosity } from 'workbench/common/editor';
import { ResourceEditorInput } from 'workbench/common/editor/resourceEditorInput';
import { IHashService } from 'workbench/services/hash/common/hashService';
import { KeybindingsEditorModel } from 'workbench/services/preferences/common/keybindingsEditorModel';
import { IPreferencesService } from 'workbench/services/preferences/common/preferences';
import { Settings2EditorModel } from 'workbench/services/preferences/common/preferencesModels';

export class PreferencesEditorInput extends SideBySideEditorInput {
	public static readonly ID: string = 'workbench.editorinputs.preferencesEditorInput';

	getTypeId(): string {
		return PreferencesEditorInput.ID;
	}

	public getTitle(verbosity: Verbosity): string {
		return this.master.getTitle(verbosity);
	}
}

export class DefaultPreferencesEditorInput extends ResourceEditorInput {
	public static readonly ID = 'workbench.editorinputs.defaultpreferences';
	constructor(defaultSettingsResource: URI,
		@ITextModelService textModelResolverService: ITextModelService,
		@IHashService hashService: IHashService
	) {
		super(nls.localize('settingsEditorName', "Default Settings"), '', defaultSettingsResource, textModelResolverService, hashService);
	}

	getTypeId(): string {
		return DefaultPreferencesEditorInput.ID;
	}

	matches(other: any): boolean {
		if (other instanceof DefaultPreferencesEditorInput) {
			return true;
		}
		if (!super.matches(other)) {
			return false;
		}
		return true;
	}
}

export class KeybindingsEditorInput extends EditorInput {

	public static readonly ID: string = 'workbench.input.keybindings';
	public readonly keybindingsModel: KeybindingsEditorModel;

	constructor(@IInstantiationService instantiationService: IInstantiationService) {
		super();
		this.keybindingsModel = instantiationService.createInstance(KeybindingsEditorModel, OS);
	}

	getTypeId(): string {
		return KeybindingsEditorInput.ID;
	}

	getName(): string {
		return nls.localize('keybindingsInputName', "Keyboard Shortcuts");
	}

	resolve(): Promise<KeybindingsEditorModel> {
		return Promise.resolve(this.keybindingsModel);
	}

	matches(otherInput: any): boolean {
		return otherInput instanceof KeybindingsEditorInput;
	}
}

export class SettingsEditor2Input extends EditorInput {

	public static readonly ID: string = 'workbench.input.settings2';
	private readonly _settingsModel: Settings2EditorModel;

	constructor(
		@IPreferencesService _preferencesService: IPreferencesService,
	) {
		super();

		this._settingsModel = _preferencesService.createSettings2EditorModel();
	}

	matches(otherInput: any): boolean {
		return otherInput instanceof SettingsEditor2Input;
	}

	getTypeId(): string {
		return SettingsEditor2Input.ID;
	}

	getName(): string {
		return nls.localize('settingsEditor2InputName', "Settings");
	}

	resolve(): Promise<Settings2EditorModel> {
		return Promise.resolve(this._settingsModel);
	}

	public getResource(): URI {
		return URI.from({
			scheme: 'hypert-settings',
			path: `settingseditor`
		});
	}
}
