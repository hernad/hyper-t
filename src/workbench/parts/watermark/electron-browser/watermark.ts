/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'css!./watermark';
import { IDisposable, dispose } from 'base/common/lifecycle';
import { assign } from 'base/common/objects';
import { isMacintosh } from 'base/common/platform';
import { IKeybindingService } from 'platform/keybinding/common/keybinding';
import * as nls from 'base/nls';
import { Registry } from 'platform/registry/common/platform';
import { IConfigurationRegistry, Extensions as ConfigurationExtensions } from 'platform/configuration/common/configurationRegistry';
import { IWorkspaceContextService, WorkbenchState } from 'platform/workspace/common/workspace';
import { IWorkbenchContribution, IWorkbenchContributionsRegistry, Extensions as WorkbenchExtensions } from 'workbench/common/contributions';
import { ILifecycleService, LifecyclePhase } from 'platform/lifecycle/common/lifecycle';
import { IConfigurationService } from 'platform/configuration/common/configuration';
import { OpenRecentAction } from 'workbench/electron-browser/actions';
import { GlobalNewUntitledFileAction } from 'workbench/parts/files/electron-browser/fileActions';
import { OpenFolderAction, OpenFileFolderAction, OpenFileAction } from 'workbench/browser/actions/workspaceActions';
import { ShowAllCommandsAction } from 'workbench/parts/quickopen/browser/commandsHandler';
import { Parts, IPartService, IDimension } from 'workbench/services/part/common/partService';
// import { StartAction } from 'workbench/parts/debug/browser/debugActions'; hernad out-debug
import { FindInFilesActionId } from 'workbench/parts/search/common/constants';
import { escape } from 'base/common/strings';
import { QUICKOPEN_ACTION_ID } from 'workbench/browser/parts/quickopen/quickopen';
import { TERMINAL_COMMAND_ID } from 'workbench/parts/terminal/common/terminalCommands';
import * as dom from 'base/browser/dom';

const $ = dom.$;

interface WatermarkEntry {
	text: string;
	ids: string[];
	mac?: boolean;
}

const showCommands: WatermarkEntry = {
	text: nls.localize('watermark.showCommands', "Prikaz svih komandi"),
	ids: [ShowAllCommandsAction.ID]
};
const quickOpen: WatermarkEntry = {
	text: nls.localize('watermark.quickOpen', "Idi na fajl"),
	ids: [QUICKOPEN_ACTION_ID]
};
const openFileNonMacOnly: WatermarkEntry = {
	text: nls.localize('watermark.openFile', "Otvori fajl"),
	ids: [OpenFileAction.ID],
	mac: false
};
const openFolderNonMacOnly: WatermarkEntry = {
	text: nls.localize('watermark.openFolder', "Otvori direktorij"),
	ids: [OpenFolderAction.ID],
	mac: false
};
const openFileOrFolderMacOnly: WatermarkEntry = {
	text: nls.localize('watermark.openFileFolder', "Open File or Folder"),
	ids: [OpenFileFolderAction.ID],
	mac: true
};
const openRecent: WatermarkEntry = {
	text: nls.localize('watermark.openRecent', "Otvori posljednje"),
	ids: [OpenRecentAction.ID]
};
const newUntitledFile: WatermarkEntry = {
	text: nls.localize('watermark.newUntitledFile', "New Untitled File"),
	ids: [GlobalNewUntitledFileAction.ID]
};
const newUntitledFileMacOnly: WatermarkEntry = assign({ mac: true }, newUntitledFile);
const toggleTerminal: WatermarkEntry = {
	text: nls.localize({ key: 'watermark.toggleTerminal', comment: ['toggle is a verb here'] }, "Toggle Terminal"),
	ids: [TERMINAL_COMMAND_ID.TOGGLE]
};

const findInFiles: WatermarkEntry = {
	text: nls.localize('watermark.findInFiles', "Find in Files"),
	ids: [FindInFilesActionId]
};

/* hernad out-debug
const startDebugging: WatermarkEntry = {
	text: nls.localize('watermark.startDebugging', "Start Debugging"),
	ids: [StartAction.ID]
};
*/

const noFolderEntries = [
	showCommands,
	openFileNonMacOnly,
	openFolderNonMacOnly,
	openFileOrFolderMacOnly,
	openRecent,
	newUntitledFileMacOnly,
	toggleTerminal
];

const folderEntries = [
	showCommands,
	quickOpen,
	findInFiles,
	//startDebugging, hernad out-debug
	toggleTerminal
];

const UNBOUND = nls.localize('watermark.unboundCommand', "unbound");
const WORKBENCH_TIPS_ENABLED_KEY = 'workbench.tips.enabled';

export class WatermarkContribution implements IWorkbenchContribution {

	private toDispose: IDisposable[] = [];
	private watermark: HTMLElement;
	private enabled: boolean;
	private workbenchState: WorkbenchState;

	constructor(
		@ILifecycleService lifecycleService: ILifecycleService,
		@IPartService private partService: IPartService,
		@IKeybindingService private keybindingService: IKeybindingService,
		@IWorkspaceContextService private contextService: IWorkspaceContextService,
		@IConfigurationService private configurationService: IConfigurationService
	) {
		this.workbenchState = contextService.getWorkbenchState();

		lifecycleService.onShutdown(this.dispose, this);
		this.enabled = this.configurationService.getValue<boolean>(WORKBENCH_TIPS_ENABLED_KEY);
		if (this.enabled) {
			this.create();
		}
		this.toDispose.push(this.configurationService.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration(WORKBENCH_TIPS_ENABLED_KEY)) {
				const enabled = this.configurationService.getValue<boolean>(WORKBENCH_TIPS_ENABLED_KEY);
				if (enabled !== this.enabled) {
					this.enabled = enabled;
					if (this.enabled) {
						this.create();
					} else {
						this.destroy();
					}
				}
			}
		}));
		this.toDispose.push(this.contextService.onDidChangeWorkbenchState(e => {
			const previousWorkbenchState = this.workbenchState;
			this.workbenchState = this.contextService.getWorkbenchState();

			if (this.enabled && this.workbenchState !== previousWorkbenchState) {
				this.recreate();
			}
		}));
	}

	private create(): void {
		const container = this.partService.getContainer(Parts.EDITOR_PART);
		container.classList.add('has-watermark');

		this.watermark = $('.watermark');
		const box = dom.append(this.watermark, $('.watermark-box'));
		const folder = this.workbenchState !== WorkbenchState.EMPTY;
		const selected = folder ? folderEntries : noFolderEntries
			.filter(entry => !('mac' in entry) || entry.mac === isMacintosh);
		const update = () => {
			dom.clearNode(box);
			selected.map(entry => {
				const dl = dom.append(box, $('dl'));
				const dt = dom.append(dl, $('dt'));
				dt.textContent = entry.text;
				const dd = dom.append(dl, $('dd'));
				dd.innerHTML = entry.ids
					.map(id => {
						let k = this.keybindingService.lookupKeybinding(id);
						if (k) {
							return `<span class="shortcuts">${escape(k.getLabel())}</span>`;
						}
						return `<span class="unbound">${escape(UNBOUND)}</span>`;
					})
					.join(' / ');
			});
		};
		update();
		dom.prepend(container.firstElementChild as HTMLElement, this.watermark);
		this.toDispose.push(this.keybindingService.onDidUpdateKeybindings(update));
		this.toDispose.push(this.partService.onEditorLayout(({ height }: IDimension) => {
			container.classList[height <= 478 ? 'add' : 'remove']('max-height-478px');
		}));
	}

	private destroy(): void {
		if (this.watermark) {
			this.watermark.remove();
			this.partService.getContainer(Parts.EDITOR_PART).classList.remove('has-watermark');
			this.dispose();
		}
	}

	private recreate(): void {
		this.destroy();
		this.create();
	}

	public dispose(): void {
		this.toDispose = dispose(this.toDispose);
	}
}

Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench)
	.registerWorkbenchContribution(WatermarkContribution, LifecyclePhase.Running);

Registry.as<IConfigurationRegistry>(ConfigurationExtensions.Configuration)
	.registerConfiguration({
		'id': 'workbench',
		'order': 7,
		'title': nls.localize('workbenchConfigurationTitle', "Workbench"),
		'properties': {
			'workbench.tips.enabled': {
				'type': 'boolean',
				'default': true,
				'description': nls.localize('tips.enabled', "When enabled, will show the watermark tips when no editor is open.")
			},
		}
	});