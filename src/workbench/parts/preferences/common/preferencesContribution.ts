/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IModelService } from 'editor/common/services/modelService';
import { IModeService } from 'editor/common/services/modeService';
import { URI } from 'base/common/uri';
import { ITextModel } from 'editor/common/model';
import * as JSONContributionRegistry from 'platform/jsonschemas/common/jsonContributionRegistry';
import { Registry } from 'platform/registry/common/platform';
import { IWorkbenchContribution } from 'workbench/common/contributions';
import { ITextModelService } from 'editor/common/services/resolverService';
import { IPreferencesService, FOLDER_SETTINGS_PATH, DEFAULT_SETTINGS_EDITOR_SETTING } from 'workbench/services/preferences/common/preferences';
import { dispose, IDisposable } from 'base/common/lifecycle';
import { IEditorService, IOpenEditorOverride } from 'workbench/services/editor/common/editorService';
import { IEditorOptions, ITextEditorOptions } from 'platform/editor/common/editor';
import { IEditorGroup } from 'workbench/services/group/common/editorGroupsService';
import { endsWith } from 'base/common/strings';
import { IEnvironmentService } from 'platform/environment/common/environment';
import { IEditorInput } from 'workbench/common/editor';
import { IWorkspaceContextService, WorkbenchState } from 'platform/workspace/common/workspace';
import { IConfigurationService } from 'platform/configuration/common/configuration';
import { isLinux } from 'base/common/platform';
import { isEqual } from 'base/common/resources';

const schemaRegistry = Registry.as<JSONContributionRegistry.IJSONContributionRegistry>(JSONContributionRegistry.Extensions.JSONContribution);

export class PreferencesContribution implements IWorkbenchContribution {
	private editorOpeningListener: IDisposable;
	private settingsListener: IDisposable;

	constructor(
		@IModelService private modelService: IModelService,
		@ITextModelService private textModelResolverService: ITextModelService,
		@IPreferencesService private preferencesService: IPreferencesService,
		@IModeService private modeService: IModeService,
		@IEditorService private editorService: IEditorService,
		@IEnvironmentService private environmentService: IEnvironmentService,
		@IWorkspaceContextService private workspaceService: IWorkspaceContextService,
		@IConfigurationService private configurationService: IConfigurationService
	) {
		this.settingsListener = this.configurationService.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration(DEFAULT_SETTINGS_EDITOR_SETTING)) {
				this.handleSettingsEditorOverride();
			}
		});
		this.handleSettingsEditorOverride();

		this.start();
	}

	private handleSettingsEditorOverride(): void {

		// dispose any old listener we had
		this.editorOpeningListener = dispose(this.editorOpeningListener);

		// install editor opening listener unless user has disabled this
		if (!!this.configurationService.getValue(DEFAULT_SETTINGS_EDITOR_SETTING)) {
			this.editorOpeningListener = this.editorService.overrideOpenEditor((editor, options, group) => this.onEditorOpening(editor, options, group));
		}
	}

	private onEditorOpening(editor: IEditorInput, options: IEditorOptions | ITextEditorOptions, group: IEditorGroup): IOpenEditorOverride {
		const resource = editor.getResource();
		if (
			!resource ||
			!endsWith(resource.path, 'settings.json') ||								// resource must end in settings.json
			!this.configurationService.getValue(DEFAULT_SETTINGS_EDITOR_SETTING)	// user has not disabled default settings editor
		) {
			return void 0;
		}

		// If the resource was already opened before in the group, do not prevent
		// the opening of that resource. Otherwise we would have the same settings
		// opened twice (https://github.com/hernad/hyper-t/issues/36447)
		if (group.isOpened(editor)) {
			return void 0;
		}

		// Global User Settings File
		if (isEqual(resource, URI.file(this.environmentService.appSettingsPath), !isLinux)) {
			return { override: this.preferencesService.openGlobalSettings(true, options, group) };
		}

		// Single Folder Workspace Settings File
		const state = this.workspaceService.getWorkbenchState();
		if (state === WorkbenchState.FOLDER) {
			const folders = this.workspaceService.getWorkspace().folders;
			if (isEqual(resource, folders[0].toResource(FOLDER_SETTINGS_PATH))) {
				return { override: this.preferencesService.openWorkspaceSettings(true, options, group) };
			}
		}

		// Multi Folder Workspace Settings File
		else if (state === WorkbenchState.WORKSPACE) {
			const folders = this.workspaceService.getWorkspace().folders;
			for (let i = 0; i < folders.length; i++) {
				if (isEqual(resource, folders[i].toResource(FOLDER_SETTINGS_PATH))) {
					return { override: this.preferencesService.openFolderSettings(folders[i].uri, true, options, group) };
				}
			}
		}

		return void 0;
	}

	private start(): void {

		this.textModelResolverService.registerTextModelContentProvider('hypert', {
			provideTextContent: (uri: URI): Thenable<ITextModel> => {
				if (uri.scheme !== 'hypert') {
					return null;
				}
				if (uri.authority === 'schemas') {
					const schemaModel = this.getSchemaModel(uri);
					if (schemaModel) {
						return Promise.resolve(schemaModel);
					}
				}
				return this.preferencesService.resolveModel(uri);
			}
		});
	}

	private getSchemaModel(uri: URI): ITextModel {
		let schema = schemaRegistry.getSchemaContributions().schemas[uri.toString()];
		if (schema) {
			const modelContent = JSON.stringify(schema);
			const languageSelection = this.modeService.create('jsonc');
			const model = this.modelService.createModel(modelContent, languageSelection, uri);

			let disposables: IDisposable[] = [];
			disposables.push(schemaRegistry.onDidChangeSchema(schemaUri => {
				if (schemaUri === uri.toString()) {
					schema = schemaRegistry.getSchemaContributions().schemas[uri.toString()];
					model.setValue(JSON.stringify(schema));
				}
			}));
			disposables.push(model.onWillDispose(() => dispose(disposables)));

			return model;
		}
		return null;
	}

	public dispose(): void {
		this.editorOpeningListener = dispose(this.editorOpeningListener);
		this.settingsListener = dispose(this.settingsListener);
	}
}
