/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fs from 'fs';
import * as platform from 'base/common/platform';
import product from 'platform/node/product';
import pkg from 'platform/node/package';
import { serve, Server, connect } from 'base/parts/ipc/node/ipc.net';
import { TPromise } from 'base/common/winjs.base';
import { ServiceCollection } from 'platform/instantiation/common/serviceCollection';
import { SyncDescriptor } from 'platform/instantiation/common/descriptors';
import { InstantiationService } from 'platform/instantiation/common/instantiationService';
import { IEnvironmentService, ParsedArgs } from 'platform/environment/common/environment';
import { EnvironmentService } from 'platform/environment/node/environmentService';
import { ExtensionManagementChannel } from 'platform/extensionManagement/node/extensionManagementIpc';
import { IExtensionManagementService, IExtensionGalleryService } from 'platform/extensionManagement/common/extensionManagement';
import { ExtensionManagementService } from 'platform/extensionManagement/node/extensionManagementService';
import { ExtensionGalleryService } from 'platform/extensionManagement/node/extensionGalleryService';
import { IConfigurationService } from 'platform/configuration/common/configuration';
import { ConfigurationService } from 'platform/configuration/node/configurationService';
import { IRequestService } from 'platform/request/node/request';
import { RequestService } from 'platform/request/electron-browser/requestService';
import { ITelemetryService } from 'platform/telemetry/common/telemetry';
import { combinedAppender, NullTelemetryService, ITelemetryAppender, NullAppender, LogAppender } from 'platform/telemetry/common/telemetryUtils';
import { resolveCommonProperties } from 'platform/telemetry/node/commonProperties';
import { TelemetryAppenderChannel } from 'platform/telemetry/node/telemetryIpc';
import { TelemetryService, ITelemetryServiceConfig } from 'platform/telemetry/common/telemetryService';
import { AppInsightsAppender } from 'platform/telemetry/node/appInsightsAppender';
import { IWindowsService, ActiveWindowManager } from 'platform/windows/common/windows';
import { WindowsChannelClient } from 'platform/windows/node/windowsIpc';
import { ipcRenderer } from 'electron';
import { createSharedProcessContributions } from 'code/electron-browser/sharedProcess/contrib/contributions';
import { createSpdLogService } from 'platform/log/node/spdlogService';
import { ILogService, LogLevel } from 'platform/log/common/log';
import { LogLevelSetterChannelClient, FollowerLogService } from 'platform/log/node/logIpc';
import { LocalizationsService } from 'platform/localizations/node/localizations';
import { ILocalizationsService } from 'platform/localizations/common/localizations';
import { LocalizationsChannel } from 'platform/localizations/node/localizationsIpc';
import { DialogChannelClient } from 'platform/dialogs/node/dialogIpc';
import { IDialogService } from 'platform/dialogs/common/dialogs';
import { IDisposable, dispose } from 'base/common/lifecycle';
import { DownloadService } from 'platform/download/node/downloadService';
import { IDownloadService } from 'platform/download/common/download';
import { RemoteAuthorityResolverService } from 'platform/remote/node/remoteAuthorityResolverService';
import { IRemoteAuthorityResolverService } from 'platform/remote/common/remoteAuthorityResolver';
import { RemoteAuthorityResolverChannel } from 'platform/remote/node/remoteAuthorityResolverChannel';
import { StaticRouter } from 'base/parts/ipc/node/ipc';
import { DefaultURITransformer } from 'base/common/uriIpc';

export interface ISharedProcessConfiguration {
	readonly machineId: string;
}

export function startup(configuration: ISharedProcessConfiguration) {
	handshake(configuration);
}

interface ISharedProcessInitData {
	sharedIPCHandle: string;
	args: ParsedArgs;
	logLevel: LogLevel;
}

const eventPrefix = 'monacoworkbench';

function main(server: Server, initData: ISharedProcessInitData, configuration: ISharedProcessConfiguration): void {
	const services = new ServiceCollection();

	const disposables: IDisposable[] = [];

	const onExit = () => dispose(disposables);
	process.once('exit', onExit);
	ipcRenderer.once('handshake:goodbye', onExit);

	disposables.push(server);

	const environmentService = new EnvironmentService(initData.args, process.execPath);

	const mainRouter = new StaticRouter(ctx => ctx === 'main');
	const logLevelClient = new LogLevelSetterChannelClient(server.getChannel('loglevel', mainRouter));
	const logService = new FollowerLogService(logLevelClient, createSpdLogService('sharedprocess', initData.logLevel, environmentService.logsPath));
	disposables.push(logService);

	logService.info('main', JSON.stringify(configuration));

	services.set(IEnvironmentService, environmentService);
	services.set(ILogService, logService);
	services.set(IConfigurationService, new SyncDescriptor(ConfigurationService));
	services.set(IRequestService, new SyncDescriptor(RequestService));
	services.set(IDownloadService, new SyncDescriptor(DownloadService));

	const windowsChannel = server.getChannel('windows', mainRouter);
	const windowsService = new WindowsChannelClient(windowsChannel);
	services.set(IWindowsService, windowsService);

	const activeWindowManager = new ActiveWindowManager(windowsService);
	const activeWindowRouter = new StaticRouter(ctx => activeWindowManager.getActiveClientId().then(id => ctx === id));
	const dialogChannel = server.getChannel('dialog', activeWindowRouter);
	services.set(IDialogService, new DialogChannelClient(dialogChannel));

	const instantiationService = new InstantiationService(services);

	instantiationService.invokeFunction(accessor => {
		const services = new ServiceCollection();
		const environmentService = accessor.get(IEnvironmentService);
		const { appRoot, extensionsPath, extensionDevelopmentLocationURI, isBuilt, installSourcePath } = environmentService;
		const telemetryLogService = new FollowerLogService(logLevelClient, createSpdLogService('telemetry', initData.logLevel, environmentService.logsPath));
		telemetryLogService.info('The below are logs for every telemetry event sent from VS Code once the log level is set to trace.');
		telemetryLogService.info('===========================================================');

		let appInsightsAppender: ITelemetryAppender | null = NullAppender;
		if (!extensionDevelopmentLocationURI && !environmentService.args['disable-telemetry'] && product.enableTelemetry) {
			if (product.aiConfig && product.aiConfig.asimovKey && isBuilt) {
				appInsightsAppender = new AppInsightsAppender(eventPrefix, null, product.aiConfig.asimovKey, telemetryLogService);
				disposables.push(appInsightsAppender); // Ensure the AI appender is disposed so that it flushes remaining data
			}
			const config: ITelemetryServiceConfig = {
				appender: combinedAppender(appInsightsAppender, new LogAppender(logService)),
				commonProperties: resolveCommonProperties(product.commit, pkg.version, configuration.machineId, installSourcePath),
				piiPaths: [appRoot, extensionsPath]
			};

			services.set(ITelemetryService, new SyncDescriptor(TelemetryService, [config]));
		} else {
			services.set(ITelemetryService, NullTelemetryService);
		}
		server.registerChannel('telemetryAppender', new TelemetryAppenderChannel(appInsightsAppender));

		services.set(IExtensionManagementService, new SyncDescriptor(ExtensionManagementService));
		services.set(IExtensionGalleryService, new SyncDescriptor(ExtensionGalleryService));
		services.set(ILocalizationsService, new SyncDescriptor(LocalizationsService));
		services.set(IRemoteAuthorityResolverService, new SyncDescriptor(RemoteAuthorityResolverService));

		const instantiationService2 = instantiationService.createChild(services);

		instantiationService2.invokeFunction(accessor => {

			const remoteAuthorityResolverService = accessor.get(IRemoteAuthorityResolverService);
			const remoteAuthorityResolverChannel = new RemoteAuthorityResolverChannel(remoteAuthorityResolverService);
			server.registerChannel('remoteAuthorityResolver', remoteAuthorityResolverChannel);

			const extensionManagementService = accessor.get(IExtensionManagementService);
			const channel = new ExtensionManagementChannel(extensionManagementService, () => DefaultURITransformer);
			server.registerChannel('extensions', channel);

			// clean up deprecated extensions
			(extensionManagementService as ExtensionManagementService).removeDeprecatedExtensions();

			const localizationsService = accessor.get(ILocalizationsService);
			const localizationsChannel = new LocalizationsChannel(localizationsService);
			server.registerChannel('localizations', localizationsChannel);

			createSharedProcessContributions(instantiationService2);
			disposables.push(extensionManagementService as ExtensionManagementService);
			disposables.push(remoteAuthorityResolverService as RemoteAuthorityResolverService);
		});
	});
}

function setupIPC(hook: string): Thenable<Server> {
	function setup(retry: boolean): Thenable<Server> {
		return serve(hook).then(null, err => {
			if (!retry || platform.isWindows || err.code !== 'EADDRINUSE') {
				return Promise.reject(err);
			}

			// should retry, not windows and eaddrinuse

			return connect(hook, '').then(
				client => {
					// we could connect to a running instance. this is not good, abort
					client.dispose();
					return Promise.reject(new Error('There is an instance already running.'));
				},
				err => {
					// it happens on Linux and OS X that the pipe is left behind
					// let's delete it, since we can't connect to it
					// and the retry the whole thing
					try {
						fs.unlinkSync(hook);
					} catch (e) {
						return Promise.reject(new Error('Error deleting the shared ipc hook.'));
					}

					return setup(false);
				}
			);
		});
	}

	return setup(true);
}

function startHandshake(): TPromise<ISharedProcessInitData> {
	return new TPromise<ISharedProcessInitData>((c, e) => {
		ipcRenderer.once('handshake:hey there', (_: any, r: ISharedProcessInitData) => c(r));
		ipcRenderer.send('handshake:hello');
	});
}

function handshake(configuration: ISharedProcessConfiguration): TPromise<void> {
	return startHandshake()
		.then(data => setupIPC(data.sharedIPCHandle).then(server => main(server, data, configuration)))
		.then(() => ipcRenderer.send('handshake:im ready'));
}