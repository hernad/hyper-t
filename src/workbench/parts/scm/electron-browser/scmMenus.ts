/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'css!./media/scmViewlet';
import { Event, Emitter } from 'base/common/event';
import { IDisposable, dispose } from 'base/common/lifecycle';
import { IContextKeyService } from 'platform/contextkey/common/contextkey';
import { IMenuService, MenuId, IMenu } from 'platform/actions/common/actions';
import { IAction } from 'base/common/actions';
import { fillInContextMenuActions, fillInActionBarActions } from 'platform/actions/browser/menuItemActionItem';
import { ISCMProvider, ISCMResource, ISCMResourceGroup } from 'workbench/services/scm/common/scm';
import { getSCMResourceContextKey } from './scmUtil';
import { IContextMenuService } from 'platform/contextview/browser/contextView';

export class SCMMenus implements IDisposable {

	private contextKeyService: IContextKeyService;
	private titleMenu: IMenu;
	private titleActions: IAction[] = [];
	private titleSecondaryActions: IAction[] = [];

	private _onDidChangeTitle = new Emitter<void>();
	get onDidChangeTitle(): Event<void> { return this._onDidChangeTitle.event; }

	private disposables: IDisposable[] = [];

	constructor(
		provider: ISCMProvider | undefined,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IMenuService private menuService: IMenuService,
		@IContextMenuService private contextMenuService: IContextMenuService
	) {
		this.contextKeyService = contextKeyService.createScoped();
		const scmProviderKey = this.contextKeyService.createKey<string | undefined>('scmProvider', void 0);

		if (provider) {
			scmProviderKey.set(provider.contextValue);
		} else {
			scmProviderKey.set('');
		}

		this.titleMenu = this.menuService.createMenu(MenuId.SCMTitle, this.contextKeyService);
		this.disposables.push(this.titleMenu);

		this.titleMenu.onDidChange(this.updateTitleActions, this, this.disposables);
		this.updateTitleActions();
	}

	private updateTitleActions(): void {
		this.titleActions = [];
		this.titleSecondaryActions = [];
		// TODO@joao: second arg used to be null
		fillInActionBarActions(this.titleMenu, { shouldForwardArgs: true }, { primary: this.titleActions, secondary: this.titleSecondaryActions });
		this._onDidChangeTitle.fire();
	}

	getTitleActions(): IAction[] {
		return this.titleActions;
	}

	getTitleSecondaryActions(): IAction[] {
		return this.titleSecondaryActions;
	}

	getResourceGroupActions(group: ISCMResourceGroup): IAction[] {
		return this.getActions(MenuId.SCMResourceGroupContext, group).primary;
	}

	getResourceGroupContextActions(group: ISCMResourceGroup): IAction[] {
		return this.getActions(MenuId.SCMResourceGroupContext, group).secondary;
	}

	getResourceActions(resource: ISCMResource): IAction[] {
		return this.getActions(MenuId.SCMResourceContext, resource).primary;
	}

	getResourceContextActions(resource: ISCMResource): IAction[] {
		return this.getActions(MenuId.SCMResourceContext, resource).secondary;
	}

	private getActions(menuId: MenuId, resource: ISCMResourceGroup | ISCMResource): { primary: IAction[]; secondary: IAction[]; } {
		const contextKeyService = this.contextKeyService.createScoped();
		contextKeyService.createKey('scmResourceGroup', getSCMResourceContextKey(resource));

		const menu = this.menuService.createMenu(menuId, contextKeyService);
		const primary: IAction[] = [];
		const secondary: IAction[] = [];
		const result = { primary, secondary };
		fillInContextMenuActions(menu, { shouldForwardArgs: true }, result, this.contextMenuService, g => /^inline/.test(g));

		menu.dispose();
		contextKeyService.dispose();

		return result;
	}

	dispose(): void {
		this.disposables = dispose(this.disposables);
	}
}
