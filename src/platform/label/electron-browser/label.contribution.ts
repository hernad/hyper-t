/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// TODO@Isidor bad layering
// tslint:disable-next-line:import-patterns
import { IWorkbenchContribution, IWorkbenchContributionsRegistry, Extensions as WorkbenchExtensions } from 'workbench/common/contributions';
import { ILabelService } from 'platform/label/common/label';
import { ipcRenderer as ipc } from 'electron';
import { Registry } from 'platform/registry/common/platform';
import { LifecyclePhase } from 'platform/lifecycle/common/lifecycle';

/**
 * Uri display registration needs to be shared from renderer to main.
 * Since there will be another instance of the uri display service running on main.
 */
class LabelRegistrationContribution implements IWorkbenchContribution {

	constructor(@ILabelService labelService: ILabelService) {
		labelService.onDidRegisterFormatter(data => {
			ipc.send('vscode:labelRegisterFormatter', data);
		});
	}
}

Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench).registerWorkbenchContribution(LabelRegistrationContribution, LifecyclePhase.Starting);
