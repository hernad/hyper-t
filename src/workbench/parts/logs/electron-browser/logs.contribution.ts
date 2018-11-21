/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as nls from 'base/nls';
import { join } from 'base/common/paths';
import { Registry } from 'platform/registry/common/platform';
import { IWorkbenchContributionsRegistry, Extensions as WorkbenchExtensions, IWorkbenchContribution } from 'workbench/common/contributions';
import { IOutputChannelRegistry, Extensions as OutputExt, } from 'workbench/parts/output/common/output';
import { LifecyclePhase } from 'platform/lifecycle/common/lifecycle';
import { IEnvironmentService } from 'platform/environment/common/environment';
import { IWindowService } from 'platform/windows/common/windows';
import { Disposable } from 'base/common/lifecycle';
import { URI } from 'base/common/uri';
import * as Constants from 'workbench/parts/logs/common/logConstants';
import { IWorkbenchActionRegistry, Extensions as WorkbenchActionExtensions } from 'workbench/common/actions';
import { SyncActionDescriptor } from 'platform/actions/common/actions';
import { OpenLogsFolderAction, SetLogLevelAction } from 'workbench/parts/logs/electron-browser/logsActions';
import { ILogService, LogLevel } from 'platform/log/common/log';

class LogOutputChannels extends Disposable implements IWorkbenchContribution {

	constructor(
		@IWindowService windowService: IWindowService,
		@IEnvironmentService environmentService: IEnvironmentService,
		@ILogService logService: ILogService
	) {
		super();
		let outputChannelRegistry = Registry.as<IOutputChannelRegistry>(OutputExt.OutputChannels);
		outputChannelRegistry.registerChannel({ id: Constants.mainLogChannelId, label: nls.localize('mainLog', "Main"), file: URI.file(join(environmentService.logsPath, `main.log`)), log: true });
		outputChannelRegistry.registerChannel({ id: Constants.sharedLogChannelId, label: nls.localize('sharedLog', "Shared"), file: URI.file(join(environmentService.logsPath, `sharedprocess.log`)), log: true });
		outputChannelRegistry.registerChannel({ id: Constants.rendererLogChannelId, label: nls.localize('rendererLog', "Window"), file: URI.file(join(environmentService.logsPath, `renderer${windowService.getCurrentWindowId()}.log`)), log: true });

		const registerTelemetryChannel = (level) => {
			if (level === LogLevel.Trace && !outputChannelRegistry.getChannel(Constants.telemetryLogChannelId)) {
				outputChannelRegistry.registerChannel({ id: Constants.telemetryLogChannelId, label: nls.localize('telemetryLog', "Telemetry"), file: URI.file(join(environmentService.logsPath, `telemetry.log`)), log: true });
			}
		};
		registerTelemetryChannel(logService.getLevel());
		logService.onDidChangeLogLevel(registerTelemetryChannel);

		const workbenchActionsRegistry = Registry.as<IWorkbenchActionRegistry>(WorkbenchActionExtensions.WorkbenchActions);
		const devCategory = nls.localize('developer', "Developer");
		workbenchActionsRegistry.registerWorkbenchAction(new SyncActionDescriptor(OpenLogsFolderAction, OpenLogsFolderAction.ID, OpenLogsFolderAction.LABEL), 'Developer: Open Log Folder', devCategory);
		workbenchActionsRegistry.registerWorkbenchAction(new SyncActionDescriptor(SetLogLevelAction, SetLogLevelAction.ID, SetLogLevelAction.LABEL), 'Developer: Set Log Level', devCategory);
	}
}

Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench).registerWorkbenchContribution(LogOutputChannels, LifecyclePhase.Eventually);