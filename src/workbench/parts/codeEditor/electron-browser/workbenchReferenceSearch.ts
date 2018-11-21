/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ICodeEditor } from 'editor/browser/editorBrowser';
import { registerEditorContribution } from 'editor/browser/editorExtensions';
import { ICodeEditorService } from 'editor/browser/services/codeEditorService';
import { ReferencesController } from 'editor/contrib/referenceSearch/referencesController';
import { IConfigurationService } from 'platform/configuration/common/configuration';
import { IContextKeyService } from 'platform/contextkey/common/contextkey';
import { IInstantiationService } from 'platform/instantiation/common/instantiation';
import { INotificationService } from 'platform/notification/common/notification';
import { IStorageService } from 'platform/storage/common/storage';

export class WorkbenchReferencesController extends ReferencesController {

	public constructor(
		editor: ICodeEditor,
		@IContextKeyService contextKeyService: IContextKeyService,
		@ICodeEditorService editorService: ICodeEditorService,
		@INotificationService notificationService: INotificationService,
		@IInstantiationService instantiationService: IInstantiationService,
		@IStorageService storageService: IStorageService,
		@IConfigurationService configurationService: IConfigurationService,
	) {
		super(
			false,
			editor,
			contextKeyService,
			editorService,
			notificationService,
			instantiationService,
			storageService,
			configurationService
		);
	}
}

registerEditorContribution(WorkbenchReferencesController);
