/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Registry } from 'platform/registry/common/platform';
import { IWorkbenchContributionsRegistry, Extensions as WorkbenchExtensions } from 'workbench/common/contributions';
import { WorkspaceStats } from 'workbench/parts/stats/node/workspaceStats';
import { LifecyclePhase } from 'platform/lifecycle/common/lifecycle';

// Register Workspace Stats Contribution
Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench).registerWorkbenchContribution(WorkspaceStats, LifecyclePhase.Eventually);