/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IContextKeyService } from 'platform/contextkey/common/contextkey';
import { MenuId, IMenu, IMenuService } from 'platform/actions/common/actions';
import { Menu } from 'platform/actions/common/menu';
import { ICommandService } from 'platform/commands/common/commands';

export class MenuService implements IMenuService {

	_serviceBrand: any;

	constructor(
		@ICommandService private readonly _commandService: ICommandService
	) {
		//
	}

	createMenu(id: MenuId, contextKeyService: IContextKeyService): IMenu {
		return new Menu(id, this._commandService, contextKeyService);
	}
}
