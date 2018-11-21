/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as nls from 'base/nls';
import { TPromise } from 'base/common/winjs.base';
import * as paths from 'base/common/paths';
import * as strings from 'base/common/strings';
import { isWindows } from 'base/common/platform';
import { URI } from 'base/common/uri';
import { ConfirmResult } from 'workbench/common/editor';
import { TextFileService as AbstractTextFileService } from 'workbench/services/textfile/common/textFileService';
import { IRawTextContent } from 'workbench/services/textfile/common/textfiles';
import { IUntitledEditorService } from 'workbench/services/untitled/common/untitledEditorService';
import { IFileService, IResolveContentOptions } from 'platform/files/common/files';
import { IWorkspaceContextService } from 'platform/workspace/common/workspace';
import { ILifecycleService } from 'platform/lifecycle/common/lifecycle';
import { IConfigurationService } from 'platform/configuration/common/configuration';
import { IModeService } from 'editor/common/services/modeService';
import { createTextBufferFactoryFromStream } from 'editor/common/model/textModel';
import { IEnvironmentService } from 'platform/environment/common/environment';
import { IInstantiationService } from 'platform/instantiation/common/instantiation';
import { IBackupFileService } from 'workbench/services/backup/common/backup';
import { IWindowsService, IWindowService } from 'platform/windows/common/windows';
import { IHistoryService } from 'workbench/services/history/common/history';
import { IContextKeyService } from 'platform/contextkey/common/contextkey';
import { IModelService } from 'editor/common/services/modelService';
import { INotificationService, Severity } from 'platform/notification/common/notification';
import { getConfirmMessage, IDialogService, ISaveDialogOptions, IFileDialogService } from 'platform/dialogs/common/dialogs';
import { IEditorService } from 'workbench/services/editor/common/editorService';

export class TextFileService extends AbstractTextFileService {

	constructor(
		@IWorkspaceContextService contextService: IWorkspaceContextService,
		@IFileService fileService: IFileService,
		@IUntitledEditorService untitledEditorService: IUntitledEditorService,
		@ILifecycleService lifecycleService: ILifecycleService,
		@IInstantiationService instantiationService: IInstantiationService,
		@IConfigurationService configurationService: IConfigurationService,
		@IModeService private modeService: IModeService,
		@IModelService modelService: IModelService,
		@IWindowService windowService: IWindowService,
		@IEnvironmentService environmentService: IEnvironmentService,
		@INotificationService notificationService: INotificationService,
		@IBackupFileService backupFileService: IBackupFileService,
		@IWindowsService windowsService: IWindowsService,
		@IHistoryService historyService: IHistoryService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IDialogService private dialogService: IDialogService,
		@IFileDialogService private fileDialogService: IFileDialogService,
		@IEditorService private editorService: IEditorService
	) {
		super(lifecycleService, contextService, configurationService, fileService, untitledEditorService, instantiationService, notificationService, environmentService, backupFileService, windowsService, windowService, historyService, contextKeyService, modelService);
	}

	resolveTextContent(resource: URI, options?: IResolveContentOptions): TPromise<IRawTextContent> {
		return this.fileService.resolveStreamContent(resource, options).then(streamContent => {
			return createTextBufferFactoryFromStream(streamContent.value).then(res => {
				const r: IRawTextContent = {
					resource: streamContent.resource,
					name: streamContent.name,
					mtime: streamContent.mtime,
					etag: streamContent.etag,
					encoding: streamContent.encoding,
					isReadonly: streamContent.isReadonly,
					value: res
				};
				return r;
			});
		});
	}

	confirmSave(resources?: URI[]): TPromise<ConfirmResult> {
		if (this.environmentService.isExtensionDevelopment) {
			return TPromise.wrap(ConfirmResult.DONT_SAVE); // no veto when we are in extension dev mode because we cannot assum we run interactive (e.g. tests)
		}

		const resourcesToConfirm = this.getDirty(resources);
		if (resourcesToConfirm.length === 0) {
			return TPromise.wrap(ConfirmResult.DONT_SAVE);
		}

		const message = resourcesToConfirm.length === 1 ? nls.localize('saveChangesMessage', "Do you want to save the changes you made to {0}?", paths.basename(resourcesToConfirm[0].fsPath))
			: getConfirmMessage(nls.localize('saveChangesMessages', "Do you want to save the changes to the following {0} files?", resourcesToConfirm.length), resourcesToConfirm);

		const buttons: string[] = [
			resourcesToConfirm.length > 1 ? nls.localize({ key: 'saveAll', comment: ['&& denotes a mnemonic'] }, "&&Save All") : nls.localize({ key: 'save', comment: ['&& denotes a mnemonic'] }, "&&Save"),
			nls.localize({ key: 'dontSave', comment: ['&& denotes a mnemonic'] }, "Do&&n't Save"),
			nls.localize('cancel', "Cancel")
		];

		return this.dialogService.show(Severity.Warning, message, buttons, {
			cancelId: 2,
			detail: nls.localize('saveChangesDetail', "Your changes will be lost if you don't save them.")
		}).then(index => {
			switch (index) {
				case 0: return ConfirmResult.SAVE;
				case 1: return ConfirmResult.DONT_SAVE;
				default: return ConfirmResult.CANCEL;
			}
		});
	}

	promptForPath(resource: URI, defaultUri: URI): TPromise<URI> {

		// Help user to find a name for the file by opening it first
		return this.editorService.openEditor({ resource, options: { revealIfOpened: true, preserveFocus: true, } }).then(() => {
			return this.fileDialogService.showSaveDialog(this.getSaveDialogOptions(defaultUri));
		});
	}

	private getSaveDialogOptions(defaultUri: URI): ISaveDialogOptions {
		const options: ISaveDialogOptions = {
			defaultUri,
			title: nls.localize('saveAsTitle', "Save As")
		};

		// Filters are only enabled on Windows where they work properly
		if (!isWindows) {
			return options;
		}

		interface IFilter { name: string; extensions: string[]; }

		// Build the file filter by using our known languages
		const ext: string = defaultUri ? paths.extname(defaultUri.path) : void 0;
		let matchingFilter: IFilter;
		const filters: IFilter[] = this.modeService.getRegisteredLanguageNames().map(languageName => {
			const extensions = this.modeService.getExtensions(languageName);
			if (!extensions || !extensions.length) {
				return null;
			}

			const filter: IFilter = { name: languageName, extensions: extensions.slice(0, 10).map(e => strings.trim(e, '.')) };

			if (ext && extensions.indexOf(ext) >= 0) {
				matchingFilter = filter;

				return null; // matching filter will be added last to the top
			}

			return filter;
		}).filter(f => !!f);

		// Filters are a bit weird on Windows, based on having a match or not:
		// Match: we put the matching filter first so that it shows up selected and the all files last
		// No match: we put the all files filter first
		const allFilesFilter = { name: nls.localize('allFiles', "All Files"), extensions: ['*'] };
		if (matchingFilter) {
			filters.unshift(matchingFilter);
			filters.unshift(allFilesFilter);
		} else {
			filters.unshift(allFilesFilter);
		}

		// Allow to save file without extension
		filters.push({ name: nls.localize('noExt', "No Extension"), extensions: [''] });

		options.filters = filters;

		return options;
	}
}
