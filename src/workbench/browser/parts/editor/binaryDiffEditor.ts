/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as nls from 'base/nls';
import { BINARY_DIFF_EDITOR_ID } from 'workbench/common/editor';
import { ITelemetryService } from 'platform/telemetry/common/telemetry';
import { IThemeService } from 'platform/theme/common/themeService';
import { SideBySideEditor } from 'workbench/browser/parts/editor/sideBySideEditor';
import { IInstantiationService } from 'platform/instantiation/common/instantiation';
import { BaseBinaryResourceEditor } from 'workbench/browser/parts/editor/binaryEditor';
import { IStorageService } from 'platform/storage/common/storage';

/**
 * An implementation of editor for diffing binary files like images or videos.
 */
export class BinaryResourceDiffEditor extends SideBySideEditor {

	static readonly ID = BINARY_DIFF_EDITOR_ID;

	constructor(
		@ITelemetryService telemetryService: ITelemetryService,
		@IInstantiationService instantiationService: IInstantiationService,
		@IThemeService themeService: IThemeService,
		@IStorageService storageService: IStorageService
	) {
		super(telemetryService, instantiationService, themeService, storageService);
	}

	getMetadata(): string {
		const master = this.masterEditor;
		const details = this.detailsEditor;

		if (master instanceof BaseBinaryResourceEditor && details instanceof BaseBinaryResourceEditor) {
			return nls.localize('metadataDiff', "{0} ↔ {1}", details.getMetadata(), master.getMetadata());
		}

		return null;
	}
}
