/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { registerSingleton } from 'platform/instantiation/common/extensions';
import { IReplaceService } from 'workbench/parts/search/common/replace';
import { ReplaceService, ReplacePreviewContentProvider } from 'workbench/parts/search/browser/replaceService';
import { Registry } from 'platform/registry/common/platform';
import { IWorkbenchContributionsRegistry, Extensions as WorkbenchExtensions } from 'workbench/common/contributions';
import { LifecyclePhase } from 'platform/lifecycle/common/lifecycle';

export function registerContributions(): void {
	registerSingleton(IReplaceService, ReplaceService, true);
	Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench).registerWorkbenchContribution(ReplacePreviewContentProvider, LifecyclePhase.Starting);
}
