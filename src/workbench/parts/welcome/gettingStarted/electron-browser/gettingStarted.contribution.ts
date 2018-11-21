/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Registry } from 'platform/registry/common/platform';
import { GettingStarted } from './gettingStarted';
import { TelemetryOptOut } from './telemetryOptOut';
import { IWorkbenchContributionsRegistry, Extensions as WorkbenchExtensions } from 'workbench/common/contributions';
import { LifecyclePhase } from 'platform/lifecycle/common/lifecycle';

Registry
	.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench)
	.registerWorkbenchContribution(GettingStarted, LifecyclePhase.Running);

Registry
	.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench)
	.registerWorkbenchContribution(TelemetryOptOut, LifecyclePhase.Eventually);