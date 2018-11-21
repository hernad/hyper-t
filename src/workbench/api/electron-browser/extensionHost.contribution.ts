/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IWorkbenchContribution, IWorkbenchContributionsRegistry, Extensions as WorkbenchExtensions } from 'workbench/common/contributions';
import { Registry } from 'platform/registry/common/platform';
import { IInstantiationService } from 'platform/instantiation/common/instantiation';
import { LifecyclePhase } from 'platform/lifecycle/common/lifecycle';

// --- other interested parties
import { JSONValidationExtensionPoint } from 'workbench/services/jsonschemas/common/jsonValidationExtensionPoint';
import { ColorExtensionPoint } from 'workbench/services/themes/common/colorExtensionPoint';
import { LanguageConfigurationFileHandler } from 'workbench/parts/codeEditor/electron-browser/languageConfiguration/languageConfigurationExtensionPoint';

// --- mainThread participants
import 'workbench/api/node/apiCommands';
import './mainThreadClipboard';
import './mainThreadCommands';
import './mainThreadConfiguration';
// import './mainThreadDebugService';  hernad out-debug
import './mainThreadDecorations';
import './mainThreadDiagnostics';
import './mainThreadDialogs';
import './mainThreadDocumentContentProviders';
import './mainThreadDocuments';
import './mainThreadDocumentsAndEditors';
import './mainThreadEditor';
import './mainThreadEditors';
import './mainThreadErrors';
import './mainThreadExtensionService';
import './mainThreadFileSystem';
import './mainThreadFileSystemEventService';
import './mainThreadHeapService';
import './mainThreadLanguageFeatures';
import './mainThreadLanguages';
import './mainThreadMessageService';
import './mainThreadOutputService';
import './mainThreadProgress';
import './mainThreadQuickOpen';
import './mainThreadSCM';
import './mainThreadSearch';
import './mainThreadSaveParticipant';
import './mainThreadStatusBar';
import './mainThreadStorage';
import './mainThreadTask';
import './mainThreadTelemetry';
import './mainThreadTerminalService';
import './mainThreadTreeViews';
import './mainThreadLogService';
import './mainThreadWebview';
import './mainThreadComments';
import './mainThreadUrls';
import './mainThreadWindow';
import './mainThreadWorkspace';

export class ExtensionPoints implements IWorkbenchContribution {

	constructor(
		@IInstantiationService private instantiationService: IInstantiationService
	) {
		// Classes that handle extension points...
		this.instantiationService.createInstance(JSONValidationExtensionPoint);
		this.instantiationService.createInstance(ColorExtensionPoint);
		this.instantiationService.createInstance(LanguageConfigurationFileHandler);
	}
}

Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench).registerWorkbenchContribution(ExtensionPoints, LifecyclePhase.Starting);
