/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IPanelService } from 'workbench/services/panel/common/panelService';
import { ActivitybarPart } from 'workbench/browser/parts/activitybar/activitybarPart';
import { PanelPart } from 'workbench/browser/parts/panel/panelPart';
import { IActivityService, IBadge } from 'workbench/services/activity/common/activity';
import { IDisposable } from 'base/common/lifecycle';

export class ActivityService implements IActivityService {

	public _serviceBrand: any;

	constructor(
		private activitybarPart: ActivitybarPart,
		private panelPart: PanelPart,
		@IPanelService private panelService: IPanelService
	) { }

	showActivity(compositeOrActionId: string, badge: IBadge, clazz?: string, priority?: number): IDisposable {
		if (this.panelService.getPanels().filter(p => p.id === compositeOrActionId).length) {
			return this.panelPart.showActivity(compositeOrActionId, badge, clazz);
		}

		return this.activitybarPart.showActivity(compositeOrActionId, badge, clazz, priority);
	}

	getPinnedViewletIds(): string[] {
		return this.activitybarPart.getPinnedViewletIds();
	}

}
