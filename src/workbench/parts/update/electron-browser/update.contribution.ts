/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'css!./media/update.contribution';
import 'platform/update/node/update.config.contribution';
import * as platform from 'base/common/platform';
import { Registry } from 'platform/registry/common/platform';
import { IWorkbenchContributionsRegistry, Extensions as WorkbenchExtensions } from 'workbench/common/contributions';
import { IGlobalActivityRegistry, GlobalActivityExtensions } from 'workbench/common/activity';
import { IWorkbenchActionRegistry, Extensions as ActionExtensions } from 'workbench/common/actions';
import { SyncActionDescriptor } from 'platform/actions/common/actions';
import { ShowCurrentReleaseNotesAction, ProductContribution, UpdateContribution, Win3264BitContribution } from './update';
import { LifecyclePhase } from 'platform/lifecycle/common/lifecycle';

const workbench = Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench);

workbench.registerWorkbenchContribution(ProductContribution, LifecyclePhase.Running);

if (platform.isWindows) {
	if (process.arch === 'ia32') {
		workbench.registerWorkbenchContribution(Win3264BitContribution, LifecyclePhase.Running);
	}
}

Registry.as<IGlobalActivityRegistry>(GlobalActivityExtensions)
	.registerActivity(UpdateContribution);

// Editor
Registry.as<IWorkbenchActionRegistry>(ActionExtensions.WorkbenchActions)
	.registerWorkbenchAction(new SyncActionDescriptor(ShowCurrentReleaseNotesAction, ShowCurrentReleaseNotesAction.ID, ShowCurrentReleaseNotesAction.LABEL), 'Show Release Notes');
