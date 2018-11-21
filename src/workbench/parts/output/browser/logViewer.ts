/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as paths from 'base/common/paths';
import { IEditorOptions } from 'editor/common/config/editorOptions';
import { ITelemetryService } from 'platform/telemetry/common/telemetry';
import { IStorageService } from 'platform/storage/common/storage';
import { ITextResourceConfigurationService } from 'editor/common/services/resourceConfiguration';
import { IInstantiationService } from 'platform/instantiation/common/instantiation';
import { AbstractTextResourceEditor } from 'workbench/browser/parts/editor/textResourceEditor';
import { IThemeService } from 'platform/theme/common/themeService';
import { ITextFileService } from 'workbench/services/textfile/common/textfiles';
import { IConfigurationService } from 'platform/configuration/common/configuration';
import { ResourceEditorInput } from 'workbench/common/editor/resourceEditorInput';
import { URI } from 'base/common/uri';
import { ITextModelService } from 'editor/common/services/resolverService';
import { IHashService } from 'workbench/services/hash/common/hashService';
import { LOG_SCHEME, IOutputChannelDescriptor } from 'workbench/parts/output/common/output';
import { IEditorGroupsService } from 'workbench/services/group/common/editorGroupsService';
import { IEditorService } from 'workbench/services/editor/common/editorService';
import { IWindowService } from 'platform/windows/common/windows';

export class LogViewerInput extends ResourceEditorInput {

	public static readonly ID = 'workbench.editorinputs.output';

	constructor(private outputChannelDescriptor: IOutputChannelDescriptor,
		@ITextModelService textModelResolverService: ITextModelService,
		@IHashService hashService: IHashService
	) {
		super(paths.basename(outputChannelDescriptor.file.path), paths.dirname(outputChannelDescriptor.file.path), URI.from({ scheme: LOG_SCHEME, path: outputChannelDescriptor.id }), textModelResolverService, hashService);
	}

	public getTypeId(): string {
		return LogViewerInput.ID;
	}

	public getResource(): URI {
		return this.outputChannelDescriptor.file;
	}
}

export class LogViewer extends AbstractTextResourceEditor {

	static readonly LOG_VIEWER_EDITOR_ID = 'workbench.editors.logViewer';

	constructor(
		@ITelemetryService telemetryService: ITelemetryService,
		@IInstantiationService instantiationService: IInstantiationService,
		@IStorageService storageService: IStorageService,
		@IConfigurationService baseConfigurationService: IConfigurationService,
		@ITextResourceConfigurationService textResourceConfigurationService: ITextResourceConfigurationService,
		@IThemeService themeService: IThemeService,
		@IEditorGroupsService editorGroupService: IEditorGroupsService,
		@ITextFileService textFileService: ITextFileService,
		@IEditorService editorService: IEditorService,
		@IWindowService windowService: IWindowService
	) {
		super(LogViewer.LOG_VIEWER_EDITOR_ID, telemetryService, instantiationService, storageService, textResourceConfigurationService, themeService, editorGroupService, textFileService, editorService, windowService);
	}

	protected getConfigurationOverrides(): IEditorOptions {
		const options = super.getConfigurationOverrides();
		options.wordWrap = 'off'; // all log viewers do not wrap
		options.folding = false;
		options.scrollBeyondLastLine = false;
		return options;
	}
}
