/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Registry } from 'platform/registry/common/platform';
import { IWorkbenchContributionsRegistry, Extensions as WorkbenchExtensions } from 'workbench/common/contributions';
import { BackupModelTracker } from 'workbench/parts/backup/common/backupModelTracker';
import { BackupRestorer } from 'workbench/parts/backup/common/backupRestorer';
import { LifecyclePhase } from 'platform/lifecycle/common/lifecycle';

// Register Backup Model Tracker
Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench).registerWorkbenchContribution(BackupModelTracker, LifecyclePhase.Starting);

// Register Backup Restorer
Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench).registerWorkbenchContribution(BackupRestorer, LifecyclePhase.Starting);