/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as nls from 'base/nls';
import { BaseBinaryResourceEditor } from 'workbench/browser/parts/editor/binaryEditor';
import { ITelemetryService } from 'platform/telemetry/common/telemetry';
import { IThemeService } from 'platform/theme/common/themeService';
import { IWindowsService } from 'platform/windows/common/windows';
import { EditorInput, EditorOptions } from 'workbench/common/editor';
import { FileEditorInput } from 'workbench/parts/files/common/editors/fileEditorInput';
import { URI } from 'base/common/uri';
import { BINARY_FILE_EDITOR_ID } from 'workbench/parts/files/common/files';
import { IFileService } from 'platform/files/common/files';
import { IEditorService } from 'workbench/services/editor/common/editorService';
import { IStorageService } from 'platform/storage/common/storage';

/**
 * An implementation of editor for binary files like images.
 */
export class BinaryFileEditor extends BaseBinaryResourceEditor {

	static readonly ID = BINARY_FILE_EDITOR_ID;

	constructor(
		@ITelemetryService telemetryService: ITelemetryService,
		@IThemeService themeService: IThemeService,
		@IFileService fileService: IFileService,
		@IWindowsService private windowsService: IWindowsService,
		@IEditorService private editorService: IEditorService,
		@IStorageService storageService: IStorageService
	) {
		super(
			BinaryFileEditor.ID,
			{
				openInternal: (input, options) => this.openInternal(input, options),
				openExternal: resource => this.openExternal(resource)
			},
			telemetryService,
			themeService,
			fileService,
			storageService
		);
	}

	private openInternal(input: EditorInput, options: EditorOptions): Thenable<void> {
		if (input instanceof FileEditorInput) {
			input.setForceOpenAsText();

			return this.editorService.openEditor(input, options, this.group).then(() => void 0);
		}

		return Promise.resolve();
	}

	private openExternal(resource: URI): void {
		this.windowsService.openExternal(resource.toString()).then(didOpen => {
			if (!didOpen) {
				return this.windowsService.showItemInFolder(resource.fsPath);
			}

			return void 0;
		});
	}

	getTitle(): string {
		return this.input ? this.input.getName() : nls.localize('binaryFileEditor', "Binary File Viewer");
	}
}
