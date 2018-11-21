/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as nls from 'base/nls';
import * as errors from 'base/common/errors';
import * as env from 'base/common/platform';
import * as DOM from 'base/browser/dom';
import { TPromise } from 'base/common/winjs.base';
import { IAction } from 'base/common/actions';
import { Button } from 'base/browser/ui/button/button';
import { IActionItem } from 'base/browser/ui/actionbar/actionbar';
import { IViewletViewOptions } from 'workbench/browser/parts/views/viewsViewlet';
import { IInstantiationService } from 'platform/instantiation/common/instantiation';
import { OpenFolderAction, OpenFileFolderAction, AddRootFolderAction } from 'workbench/browser/actions/workspaceActions';
import { attachButtonStyler } from 'platform/theme/common/styler';
import { IThemeService } from 'platform/theme/common/themeService';
import { IKeybindingService } from 'platform/keybinding/common/keybinding';
import { IContextMenuService } from 'platform/contextview/browser/contextView';
import { IWorkspaceContextService, WorkbenchState } from 'platform/workspace/common/workspace';
import { IConfigurationService } from 'platform/configuration/common/configuration';
import { ViewletPanel, IViewletPanelOptions } from 'workbench/browser/parts/views/panelViewlet';
import { ResourcesDropHandler, DragAndDropObserver } from 'workbench/browser/dnd';
import { listDropBackground } from 'platform/theme/common/colorRegistry';
import { SIDE_BAR_BACKGROUND } from 'workbench/common/theme';

export class EmptyView extends ViewletPanel {

	public static readonly ID: string = 'workbench.explorer.emptyView';
	public static readonly NAME = nls.localize('noWorkspace', "No Folder Opened");

	private button: Button;
	private messageElement: HTMLElement;
	private titleElement: HTMLElement;

	constructor(
		options: IViewletViewOptions,
		@IThemeService private themeService: IThemeService,
		@IInstantiationService private instantiationService: IInstantiationService,
		@IKeybindingService keybindingService: IKeybindingService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IWorkspaceContextService private contextService: IWorkspaceContextService,
		@IConfigurationService configurationService: IConfigurationService
	) {
		super({ ...(options as IViewletPanelOptions), ariaHeaderLabel: nls.localize('explorerSection', "Files Explorer Section") }, keybindingService, contextMenuService, configurationService);
		this.contextService.onDidChangeWorkbenchState(() => this.setLabels());
	}

	public renderHeader(container: HTMLElement): void {
		const titleContainer = document.createElement('div');
		DOM.addClass(titleContainer, 'title');
		container.appendChild(titleContainer);

		this.titleElement = document.createElement('span');
		this.titleElement.textContent = name;
		titleContainer.appendChild(this.titleElement);
	}

	protected renderBody(container: HTMLElement): void {
		DOM.addClass(container, 'explorer-empty-view');

		const messageContainer = document.createElement('div');
		DOM.addClass(messageContainer, 'section');
		container.appendChild(messageContainer);

		this.messageElement = document.createElement('p');
		messageContainer.appendChild(this.messageElement);

		this.button = new Button(messageContainer);
		attachButtonStyler(this.button, this.themeService);

		this.disposables.push(this.button.onDidClick(() => {
			const actionClass = this.contextService.getWorkbenchState() === WorkbenchState.WORKSPACE ? AddRootFolderAction : env.isMacintosh ? OpenFileFolderAction : OpenFolderAction;
			const action = this.instantiationService.createInstance<string, string, IAction>(actionClass, actionClass.ID, actionClass.LABEL);
			this.actionRunner.run(action).then(() => {
				action.dispose();
			}, err => {
				action.dispose();
				errors.onUnexpectedError(err);
			});
		}));

		this.disposables.push(new DragAndDropObserver(container, {
			onDrop: e => {
				container.style.backgroundColor = this.themeService.getTheme().getColor(SIDE_BAR_BACKGROUND).toString();
				const dropHandler = this.instantiationService.createInstance(ResourcesDropHandler, { allowWorkspaceOpen: true });
				dropHandler.handleDrop(e, () => undefined, targetGroup => undefined);
			},
			onDragEnter: (e) => {
				container.style.backgroundColor = this.themeService.getTheme().getColor(listDropBackground).toString();
			},
			onDragEnd: () => {
				container.style.backgroundColor = this.themeService.getTheme().getColor(SIDE_BAR_BACKGROUND).toString();
			},
			onDragLeave: () => {
				container.style.backgroundColor = this.themeService.getTheme().getColor(SIDE_BAR_BACKGROUND).toString();
			},
			onDragOver: e => {
				e.dataTransfer.dropEffect = 'copy';
			}
		}));

		this.setLabels();
	}

	private setLabels(): void {
		if (this.contextService.getWorkbenchState() === WorkbenchState.WORKSPACE) {
			this.messageElement.textContent = nls.localize('noWorkspaceHelp', "You have not yet added a folder to the workspace.");
			if (this.button) {
				this.button.label = nls.localize('addFolder', "Add Folder");
			}
			this.titleElement.textContent = EmptyView.NAME;
		} else {
			this.messageElement.textContent = nls.localize('noFolderHelp', "You have not yet opened a folder.");
			if (this.button) {
				this.button.label = nls.localize('openFolder', "Open Folder");
			}
			this.titleElement.textContent = this.title;
		}
	}

	layoutBody(size: number): void {
		// no-op
	}

	public setVisible(visible: boolean): TPromise<void> {
		return Promise.resolve(null);
	}

	public focusBody(): void {
		if (this.button) {
			this.button.element.focus();
		}
	}

	protected reveal(element: any, relativeTop?: number): TPromise<void> {
		return Promise.resolve(null);
	}

	public getActions(): IAction[] {
		return [];
	}

	public getSecondaryActions(): IAction[] {
		return [];
	}

	public getActionItem(action: IAction): IActionItem {
		return null;
	}
}
