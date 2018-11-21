/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { registerSingleton } from 'platform/instantiation/common/extensions';
import { IExperimentService, ExperimentService } from 'workbench/parts/experiments/node/experimentService';
import { Registry } from 'platform/registry/common/platform';
import { IWorkbenchContributionsRegistry, Extensions as WorkbenchExtensions } from 'workbench/common/contributions';
import { LifecyclePhase } from 'platform/lifecycle/common/lifecycle';
import { ExperimentalPrompts } from 'workbench/parts/experiments/electron-browser/experimentalPrompt';

registerSingleton(IExperimentService, ExperimentService);

Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench).registerWorkbenchContribution(ExperimentalPrompts, LifecyclePhase.Eventually);
