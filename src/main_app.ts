import { app, ipcMain as ipc, Event, protocol, contentTracing, systemPreferences } from "electron";
import * as platform from 'base/common/platform';

import * as path from "path";
import { ILogService } from 'platform/log/common/log';
import { IStateService } from 'platform/state/common/state';

import * as errors from 'base/common/errors';
import { IWindowsMainService, ICodeWindow } from 'platform/windows/electron-main/windows';
import { Server as ElectronIPCServer } from 'base/parts/ipc/electron-main/ipc.electron-main';
import { IDisposable, dispose } from "base/common/lifecycle";
import { TPromise } from "base/common/winjs.base";

import { IWindowsService, OpenContext, ActiveWindowManager } from 'platform/windows/common/windows';

import { SharedProcess } from 'code/electron-main/sharedProcess';
import { WindowsManager } from 'code/electron-main/windows';
import { WindowsService } from 'platform/windows/electron-main/windowsService';

import { Server, connect, Client } from 'base/parts/ipc/node/ipc.net';
import { IInstantiationService, ServicesAccessor } from 'platform/instantiation/common/instantiation';
import { ServiceCollection } from 'platform/instantiation/common/serviceCollection';
import { SyncDescriptor } from 'platform/instantiation/common/descriptors';

import { MenubarService } from 'platform/menubar/electron-main/menubarService';
// import { MenubarChannel } from 'platform/menubar/node/menubarIpc';
import { IUpdateService } from 'platform/update/common/update';
import { UpdateChannel } from 'platform/update/node/updateIpc';
import { MenubarChannel } from 'platform/menubar/node/menubarIpc';
import { URLHandlerChannelClient, URLServiceChannel } from 'platform/url/node/urlIpc';
import { LogLevelSetterChannel } from 'platform/log/node/logIpc';

import { IEnvironmentService } from 'platform/environment/common/environment';

import { Win32UpdateService } from 'platform/update/electron-main/updateService.win32';
import { LinuxUpdateService } from 'platform/update/electron-main/updateService.linux';
import { DarwinUpdateService } from 'platform/update/electron-main/updateService.darwin';
import { SnapUpdateService } from 'platform/update/electron-main/updateService.snap';

import { LaunchService, ILaunchService, LaunchChannel } from 'platform/launch/electron-main/launchService';
import { IMenubarService } from 'platform/menubar/common/menubar';

import { ITelemetryService } from 'platform/telemetry/common/telemetry';

import { NullTelemetryService } from 'platform/telemetry/common/telemetryUtils';
// import { TelemetryAppenderClient } from 'platform/telemetry/node/telemetryIpc';
//import { TelemetryService, ITelemetryServiceConfig } from 'platform/telemetry/common/telemetryService';

import { registerContextMenuListener } from 'base/parts/contextmenu/electron-main/contextmenu';

import { getMachineId } from 'base/node/id';
import { URI } from 'base/common/uri';

import { ResolvedAuthority } from 'platform/remote/common/remoteAuthorityResolver';
import { connectRemoteAgentManagement, RemoteAgentConnectionContext } from 'platform/remote/node/remoteAgentConnection'
import { RemoteAuthorityResolverChannelClient } from 'platform/remote/node/remoteAuthorityResolverChannel';
import { REMOTE_FILE_SYSTEM_CHANNEL_NAME } from 'platform/remote/node/remoteAgentFileSystemChannel';
import { RunOnceScheduler } from 'base/common/async';
import { REMOTE_HOST_SCHEME } from 'platform/remote/common/remoteHosts';
import { getDelayedChannel, StaticRouter } from 'base/parts/ipc/node/ipc';
import { getShellEnvironment } from 'code/node/shellEnv';

import { ILifecycleService } from 'platform/lifecycle/electron-main/lifecycleMain';
//import { isUndefinedOrNull } from 'base/common/types';

import { KeyboardLayoutMonitor } from 'code/electron-main/keyboard';

import { ElectronURLListener } from 'platform/url/electron-main/electronUrlListener';
import { hasArgs } from 'platform/environment/node/argv';
import { ProxyAuthHandler } from 'code/electron-main/auth';

import { Mutex } from 'windows-mutex';
import { join } from 'base/common/paths';
import { homedir } from 'os';

import { serve as serveDriver } from 'platform/driver/electron-main/driver';

import 'code/code.main';

//let mainWindow: Electron.BrowserWindow;

export class HyperApplication {

  private static readonly MACHINE_ID_KEY = 'telemetry.machineId';

  private windowsMainService: IWindowsMainService
  private toDispose: IDisposable[]
  private electronIpcServer: ElectronIPCServer;
  private sharedProcess: SharedProcess;
  private sharedProcessClient: TPromise<Client>;;

  constructor(
	private mainIpcServer: Server,
	private userEnv: platform.IProcessEnvironment,
	@IInstantiationService private instantiationService: IInstantiationService,
	@ILogService private logService: ILogService,
	@ILifecycleService private lifecycleService: ILifecycleService,
	@IConfigurationService private configurationService: ConfigurationService,
	@IEnvironmentService private environmentService: IEnvironmentService,
	@IStateService private stateService: IStateService,
	@IHistoryMainService private historyMainService: IHistoryMainService
  ) {
	this.toDispose = [mainIpcServer, configurationService];

    this.registerListeners();
  }

  startup(): TPromise<void> {

	this.logService.debug('Starting hyper-t')


	// Make sure we associate the program with the app user model id
		// This will help Windows to associate the running program with
		// any shortcut that is pinned to the taskbar and prevent showing
		// two icons in the taskbar for the same app.
		if (platform.isWindows && product.win32AppUserModelId) {
			app.setAppUserModelId(product.win32AppUserModelId);
		}

		// Fix native tabs on macOS 10.13
		// macOS enables a compatibility patch for any bundle ID beginning with
		// "com.microsoft.", which breaks native tabs for VS Code when using this
		// identifier (from the official build).
		// Explicitly opt out of the patch here before creating any windows.
		// See: https://github.com/Microsoft/vscode/issues/35361#issuecomment-399794085
		try {
			if (platform.isMacintosh && this.configurationService.getValue<boolean>('window.nativeTabs') === true && !systemPreferences.getUserDefault('NSUseImprovedLayoutPass', 'boolean')) {
				systemPreferences.setUserDefault('NSUseImprovedLayoutPass', 'boolean', true as any);
			}
		} catch (error) {
			this.logService.error(error);
		}

	this.electronIpcServer = new ElectronIPCServer()

	this.logService.trace('Resolving machine identifier...')


	return this.resolveMachineId().then(machineId => {
		this.logService.trace(`Resolved machine identifier: ${machineId}`);

		// Spawn shared process
		this.sharedProcess = this.instantiationService.createInstance(SharedProcess, machineId, this.userEnv);
		this.sharedProcessClient = this.sharedProcess.whenReady().then(() => connect(this.environmentService.sharedIPCHandle, 'main'));

		// Services
		const appInstantiationService = this.initServices(machineId);

		let promise: TPromise<any> = TPromise.as(null);

		if (this.environmentService.driverHandle) {
			serveDriver(this.electronIpcServer, this.environmentService.driverHandle, this.environmentService, appInstantiationService).then(server => {
				this.logService.info('Driver started at:', this.environmentService.driverHandle);
				this.toDispose.push(server);
			});
		}

		return promise.then(() => {

				// Setup Auth Handler
				const authHandler = appInstantiationService.createInstance(ProxyAuthHandler);
				this.toDispose.push(authHandler);

				// Open Windows
				const windows = appInstantiationService.invokeFunction(accessor => this.openFirstWindow(accessor));

				// Post Open Windows Tasks
				appInstantiationService.invokeFunction(accessor => this.afterWindowOpen(accessor));

				// Tracing: Stop tracing after windows are ready if enabled
				if (this.environmentService.args.trace) {
					this.logService.info(`Tracing: waiting for windows to get ready...`);

					let recordingStopped = false;
					const stopRecording = (timeout) => {
						if (recordingStopped) {
							return;
						}

						recordingStopped = true; // only once

						contentTracing.stopRecording(join(homedir(), `${product.applicationName}-${Math.random().toString(16).slice(-4)}.trace.txt`), path => {
							if (!timeout) {
								this.windowsMainService.showMessageBox({
									type: 'info',
									message: localize('trace.message', "Successfully created trace."),
									detail: localize('trace.detail', "Please create an issue and manually attach the following file:\n{0}", path),
									buttons: [localize('trace.ok', "Ok")]
								}, this.windowsMainService.getLastActiveWindow());
							} else {
								this.logService.info(`Tracing: data recorded (after 30s timeout) to ${path}`);
							}
						});
					};

					// Wait up to 30s before creating the trace anyways
					const timeoutHandle = setTimeout(() => stopRecording(true), 30000);

					// Wait for all windows to get ready and stop tracing then
					TPromise.join(windows.map(window => window.ready())).then(() => {
						clearTimeout(timeoutHandle);
						stopRecording(false);
					});
				}
		})
	})

  }


  private openFirstWindow(accessor: ServicesAccessor): ICodeWindow[] {
	const appInstantiationService = accessor.get(IInstantiationService);

	// Register more Main IPC services
	const launchService = accessor.get(ILaunchService);
	const launchChannel = new LaunchChannel(launchService);
	this.mainIpcServer.registerChannel('launch', launchChannel);

	// Register more Electron IPC services
	const updateService = accessor.get(IUpdateService);
	const updateChannel = new UpdateChannel(updateService);
	this.electronIpcServer.registerChannel('update', updateChannel);

    //const issueService = accessor.get(IIssueService);
	//const issueChannel = new IssueChannel(issueService);
	//this.electronIpcServer.registerChannel('issue', issueChannel);

	const workspacesService = accessor.get(IWorkspacesMainService);
	const workspacesChannel = appInstantiationService.createInstance(WorkspacesChannel, workspacesService);
	this.electronIpcServer.registerChannel('workspaces', workspacesChannel);

	const windowsService = accessor.get(IWindowsService);
	const windowsChannel = new WindowsChannel(windowsService);
	this.electronIpcServer.registerChannel('windows', windowsChannel);
	this.sharedProcessClient.then(client => client.registerChannel('windows', windowsChannel));

	const menubarService = accessor.get(IMenubarService);
	const menubarChannel = new MenubarChannel(menubarService);
	this.electronIpcServer.registerChannel('menubar', menubarChannel);

	const urlService = accessor.get(IURLService);
	const urlChannel = new URLServiceChannel(urlService);
	this.electronIpcServer.registerChannel('url', urlChannel);

	// Log level management
	const logLevelChannel = new LogLevelSetterChannel(accessor.get(ILogService));
	this.electronIpcServer.registerChannel('loglevel', logLevelChannel);
	this.sharedProcessClient.then(client => client.registerChannel('loglevel', logLevelChannel));

	// Lifecycle
	this.lifecycleService.ready();

	// Propagate to clients
	const windowsMainService = this.windowsMainService = accessor.get(IWindowsMainService); // TODO@Joao: unfold this

	const args = this.environmentService.args;

	// Create a URL handler which forwards to the last active window
	const activeWindowManager = new ActiveWindowManager(windowsService);
	const activeWindowRouter = new StaticRouter(ctx => activeWindowManager.getActiveClientId().then(id => ctx === id));
	const urlHandlerChannel = this.electronIpcServer.getChannel('urlHandler', activeWindowRouter);
	const multiplexURLHandler = new URLHandlerChannelClient(urlHandlerChannel);

	// On Mac, Code can be running without any open windows, so we must create a window to handle urls,
	// if there is none
	if (platform.isMacintosh) {
		const environmentService = accessor.get(IEnvironmentService);

		urlService.registerHandler({
			handleURL(uri: URI): TPromise<boolean> {
				if (windowsMainService.getWindowCount() === 0) {
					const cli = { ...environmentService.args, goto: true };
					const [window] = windowsMainService.open({ context: OpenContext.API, cli, forceEmpty: true });

					return window.ready().then(() => urlService.open(uri));
				}

				return TPromise.as(false);
			}
		});
	}

	
	// Register the multiple URL handker
	urlService.registerHandler(multiplexURLHandler);

	// Watch Electron URLs and forward them to the UrlService
	const urls = args['open-url'] ? args._urls : [];
	const urlListener = new ElectronURLListener(urls, urlService, this.windowsMainService);
	this.toDispose.push(urlListener);

	this.windowsMainService.ready(this.userEnv);

	// Open our first window
	const macOpenFiles = (<any>global).macOpenFiles as string[];
	const context = !!process.env['VSCODE_CLI'] ? OpenContext.CLI : OpenContext.DESKTOP;
	const hasCliArgs = hasArgs(args._);
	const hasFolderURIs = hasArgs(args['folder-uri']);
	const hasFileURIs = hasArgs(args['file-uri']);

	if (args['new-window'] && !hasCliArgs && !hasFolderURIs && !hasFileURIs) {
		return this.windowsMainService.open({ context, cli: args, forceNewWindow: true, forceEmpty: true, initialStartup: true }); // new window if "-n" was used without paths
	}

	if (macOpenFiles && macOpenFiles.length && !hasCliArgs && !hasFolderURIs && !hasFileURIs) {
		return this.windowsMainService.open({ context: OpenContext.DOCK, cli: args, urisToOpen: macOpenFiles.map(file => URI.file(file)), initialStartup: true }); // mac: open-file event received on startup
	}

	return this.windowsMainService.open({ context, cli: args, forceNewWindow: args['new-window'] || (!hasCliArgs && args['unity-launch']), diffMode: args.diff, initialStartup: true }); // default: read paths from cli
  }

  private afterWindowOpen(accessor: ServicesAccessor): void {
	const windowsMainService = accessor.get(IWindowsMainService);

	let windowsMutex: Mutex | null = null;
	if (platform.isWindows) {

		// Setup Windows mutex
		try {
			const Mutex = (require.__$__nodeRequire('windows-mutex') as any).Mutex;
			windowsMutex = new Mutex(product.win32MutexName);
			this.toDispose.push({ dispose: () => windowsMutex.release() });
		} catch (e) {
			if (!this.environmentService.isBuilt) {
				windowsMainService.showMessageBox({
					title: product.nameLong,
					type: 'warning',
					message: 'Failed to load windows-mutex!',
					detail: e.toString(),
					noLink: true
				});
			}
		}

		// Ensure Windows foreground love module
		try {
			// tslint:disable-next-line:no-unused-expression
			<any>require.__$__nodeRequire('windows-foreground-love');
		} catch (e) {
			if (!this.environmentService.isBuilt) {
				windowsMainService.showMessageBox({
					title: product.nameLong,
					type: 'warning',
					message: 'Failed to load windows-foreground-love!',
					detail: e.toString(),
					noLink: true
				});
			}
		}
	}


	

	// Jump List
	this.historyMainService.updateWindowsJumpList();
	this.historyMainService.onRecentlyOpenedChange(() => this.historyMainService.updateWindowsJumpList());

	// Start shared process after a while
	const sharedProcess = new RunOnceScheduler(() => this.sharedProcess.spawn(), 3000);
	sharedProcess.schedule();
	this.toDispose.push(sharedProcess);
  }

  private initServices(machineId: string): IInstantiationService {
	const services = new ServiceCollection();

	if (process.platform === 'win32') {
		services.set(IUpdateService, new SyncDescriptor(Win32UpdateService));
	} else if (process.platform === 'linux') {
		if (process.env.SNAP && process.env.SNAP_REVISION) {
			services.set(IUpdateService, new SyncDescriptor(SnapUpdateService));
		} else {
			services.set(IUpdateService, new SyncDescriptor(LinuxUpdateService));
		}
	} else if (process.platform === 'darwin') {
		services.set(IUpdateService, new SyncDescriptor(DarwinUpdateService));
	}

	services.set(IWindowsMainService, new SyncDescriptor(WindowsManager, [machineId]));
	services.set(IWindowsService, new SyncDescriptor(WindowsService, [this.sharedProcess]));
	services.set(ILaunchService, new SyncDescriptor(LaunchService));
	//services.set(IIssueService, new SyncDescriptor(IssueService, [machineId, this.userEnv]));
	services.set(IMenubarService, new SyncDescriptor(MenubarService));

	/*
	// Telemtry
	if (!this.environmentService.isExtensionDevelopment && !this.environmentService.args['disable-telemetry'] && !!product.enableTelemetry) {
		const channel = getDelayedChannel(this.sharedProcessClient.then(c => c.getChannel('telemetryAppender')));
		const appender = combinedAppender(new TelemetryAppenderClient(channel), new LogAppender(this.logService));
		const commonProperties = resolveCommonProperties(product.commit, pkg.version, machineId, this.environmentService.installSourcePath);
		const piiPaths = [this.environmentService.appRoot, this.environmentService.extensionsPath];
		const config: ITelemetryServiceConfig = { appender, commonProperties, piiPaths };

		services.set(ITelemetryService, new SyncDescriptor(TelemetryService, [config]));
	} else {
		services.set(ITelemetryService, NullTelemetryService);
	}
	*/
	services.set(ITelemetryService, NullTelemetryService);

	return this.instantiationService.createChild(services);
  }

  private resolveMachineId(): TPromise<string> {
	const machineId = this.stateService.getItem<string>(HyperApplication.MACHINE_ID_KEY);
	if (machineId) {
		return TPromise.wrap(machineId);
	}

	return getMachineId().then(machineId => {

		// Remember in global storage
		this.stateService.setItem(HyperApplication.MACHINE_ID_KEY, machineId);

		return machineId;
	});
}

  private registerListeners(): void {

		// We handle uncaught exceptions here to prevent electron from opening a dialog to the user
		errors.setUnexpectedErrorHandler(err => this.onUnexpectedError(err));
		process.on('uncaughtException', err => this.onUnexpectedError(err));
		process.on('unhandledRejection', (reason: any, promise: Promise<any>) => errors.onUnexpectedError(reason));

		// Contextmenu via IPC support
		registerContextMenuListener();

		app.on('will-quit', () => {
			this.logService.trace('App#will-quit: disposing resources');
			this.dispose();
		});

		app.on('accessibility-support-changed', (event: Event, accessibilitySupportEnabled: boolean) => {
			if (this.windowsMainService) {
				this.windowsMainService.sendToAll('vscode:accessibilitySupportChanged', accessibilitySupportEnabled);
			}
		});

		app.on('activate', (event: Event, hasVisibleWindows: boolean) => {
			this.logService.trace('App#activate');

			// Mac only event: open new window when we get activated
			if (!hasVisibleWindows && this.windowsMainService) {
				this.windowsMainService.openNewWindow(OpenContext.DOCK);
			}
		});

	/*	
		// Security related measures (https://electronjs.org/docs/tutorial/security)
		// DO NOT CHANGE without consulting the documentation
		app.on('web-contents-created', (event: any, contents) => {
			contents.on('will-attach-webview', (event: Electron.Event, webPreferences, params) => {

				// Ensure defaults
				delete webPreferences.preload;
				webPreferences.nodeIntegration = false;

				// Verify URLs being loaded
				if (this.isValidWebviewSource(params.src) && this.isValidWebviewSource(webPreferences.preloadURL)) {
					return;
				}

				delete webPreferences.preloadUrl;

				// Otherwise prevent loading
				this.logService.error('webContents#web-contents-created: Prevented webview attach');

				event.preventDefault();
			});

			contents.on('will-navigate', event => {
				this.logService.error('webContents#will-navigate: Prevented webcontent navigation');

				event.preventDefault();
			});

			contents.on('new-window', (event: Event, url: string) => {
				event.preventDefault(); // prevent code that wants to open links

				shell.openExternal(url);
			});
		});
	*/

		const connectionPool: Map<string, ActiveConnection> = new Map<string, ActiveConnection>();

		class ActiveConnection {
			private _authority: string;
			private _client: TPromise<Client<RemoteAgentConnectionContext>>;
			private _disposeRunner: RunOnceScheduler;

			constructor(authority: string, connectionInfo: TPromise<ResolvedAuthority>) {
				this._authority = authority;
				this._client = connectionInfo.then(({ host, port }) => {
					return connectRemoteAgentManagement(authority, host, port, `main`);
				});
				this._disposeRunner = new RunOnceScheduler(() => this._dispose(), 5000);
			}

			private _dispose(): void {
				this._disposeRunner.dispose();
				connectionPool.delete(this._authority);
				this._client.then((connection) => {
					connection.dispose();
				});
			}

			public getClient(): TPromise<Client<RemoteAgentConnectionContext>> {
				this._disposeRunner.schedule();
				return this._client;
			}
		}

		protocol.registerBufferProtocol(REMOTE_HOST_SCHEME, async (request, callback) => {
			if (request.method !== 'GET') {
				return callback(null);
			}
			const uri = URI.parse(request.url);

			let activeConnection: ActiveConnection = null;
			if (connectionPool.has(uri.authority)) {
				activeConnection = connectionPool.get(uri.authority);
			} else {
				if (this.sharedProcessClient) {
					const remoteAuthorityResolverChannel = getDelayedChannel(this.sharedProcessClient.then(c => c.getChannel('remoteAuthorityResolver')));
					const remoteAuthorityResolverChannelClient = new RemoteAuthorityResolverChannelClient(remoteAuthorityResolverChannel);
					activeConnection = new ActiveConnection(uri.authority, remoteAuthorityResolverChannelClient.resolveAuthority(uri.authority));
					connectionPool.set(uri.authority, activeConnection);
				}
			}
			try {
				const rawClient = await activeConnection.getClient();
				if (connectionPool.has(uri.authority)) { // not disposed in the meantime
					const channel = rawClient.getChannel(REMOTE_FILE_SYSTEM_CHANNEL_NAME);

					// TODO@alex don't use call directly, wrap it around a `RemoteExtensionsFileSystemProvider`
					const fileContents = await channel.call<Uint8Array>('readFile', [uri]);
					callback(Buffer.from(fileContents));
				} else {
					callback(null);
				}
			} catch (err) {
				errors.onUnexpectedError(err);
				callback(null);
			}
		});

		let macOpenFileURIs: URI[] = [];
		let runningTimeout: any = null;
		app.on('open-file', (event: Event, path: string) => {
			this.logService.trace('App#open-file: ', path);
			event.preventDefault();

			// Keep in array because more might come!
			macOpenFileURIs.push(URI.file(path));

			// Clear previous handler if any
			if (runningTimeout !== null) {
				clearTimeout(runningTimeout);
				runningTimeout = null;
			}

			// Handle paths delayed in case more are coming!
			runningTimeout = setTimeout(() => {
				if (this.windowsMainService) {
					this.windowsMainService.open({
						context: OpenContext.DOCK /* can also be opening from finder while app is running */,
						cli: this.environmentService.args,
						urisToOpen: macOpenFileURIs,
						preferNewWindow: true /* dropping on the dock or opening from finder prefers to open in a new window */
					});
					macOpenFileURIs = [];
					runningTimeout = null;
				}
			}, 100);
		});

		app.on('new-window-for-tab', () => {
			this.windowsMainService.openNewWindow(OpenContext.DESKTOP); //macOS native tab "+" button
		});

		ipc.on('vscode:exit', (event: Event, code: number) => {
			this.logService.trace('IPC#vscode:exit', code);

			this.dispose();
			this.lifecycleService.kill(code);
		});

		ipc.on('vscode:fetchShellEnv', (event: Event) => {
			const webContents = event.sender;
			getShellEnvironment().then(shellEnv => {
				if (!webContents.isDestroyed()) {
					webContents.send('vscode:acceptShellEnv', shellEnv);
				}
			}, err => {
				if (!webContents.isDestroyed()) {
					webContents.send('vscode:acceptShellEnv', {});
				}

				this.logService.error('Error fetching shell env', err);
			});
		});

/*
		ipc.on('vscode:broadcast', (event: Event, windowId: number, broadcast: { channel: string; payload: any; }) => {
			if (this.windowsMainService && broadcast.channel && !isUndefinedOrNull(broadcast.payload)) {
				this.logService.trace('IPC#vscode:broadcast', broadcast.channel, broadcast.payload);

				// Handle specific events on main side
				this.onBroadcast(broadcast.channel, broadcast.payload);

				// Send to all windows (except sender window)
				this.windowsMainService.sendToAll('vscode:broadcast', broadcast, [windowId]);
			}
		});

		ipc.on('vscode:labelRegisterFormatter', (event: any, data: RegisterFormatterEvent) => {
			this.labelService.registerFormatter(data.selector, data.formatter);
		});

*/
		ipc.on('vscode:toggleDevTools', (event: Event) => {
			event.sender.toggleDevTools();
		});

		ipc.on('vscode:openDevTools', (event: Event) => {
			event.sender.openDevTools();
		});

		ipc.on('vscode:reloadWindow', (event: Event) => {
			event.sender.reload();
		});

		// Keyboard layout changes
		KeyboardLayoutMonitor.INSTANCE.onDidChangeKeyboardLayout(() => {
			if (this.windowsMainService) {
				this.windowsMainService.sendToAll('vscode:keyboardLayoutChanged', false);
			}
		});
  }
  
  private onUnexpectedError(err: Error): void {
		if (err) {

			// take only the message and stack property
			const friendlyError = {
				message: err.message,
				stack: err.stack
			};

			// handle on client side
			if (this.windowsMainService) {
				this.windowsMainService.sendToFocused('vscode:reportError', JSON.stringify(friendlyError));
			}
		}

		this.logService.error(`[uncaught exception in main]: ${err}`);
		if (err.stack) {
			this.logService.error(err.stack);
		}
	}

	private dispose(): void {
		this.toDispose = dispose(this.toDispose);
	}


}

/*
function createWindow() {

  const iconPath = path.resolve(__dirname, '../resources/Icon.png')

  mainWindow = new BrowserWindow({
    icon: iconPath,
    height: 600,
    width: 800,
    webPreferences: {
      webSecurity: false
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, "../index.html"));

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on("closed", () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it"s common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

*/

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.



import { parseMainProcessArgv } from 'platform/environment/node/argv';
import { setUnexpectedErrorHandler } from 'base/common/errors';
import { ParsedArgs } from 'platform/environment/common/environment';
import { validatePaths } from 'code/node/paths';
import { createWaitMarkerFile } from 'code/node/wait';
import { BufferLogService } from 'platform/log/common/bufferLog';
import { ConsoleLogMainService, MultiplexLogService, getLogLevel } from 'platform/log/common/log';
import { EnvironmentService } from 'platform/environment/node/environmentService';
import { ILabelService, LabelService } from 'platform/label/common/label';

import { WorkspacesMainService } from 'platform/workspaces/electron-main/workspacesMainService';
import { IWorkspacesMainService } from 'platform/workspaces/common/workspaces';
import { WorkspacesChannel } from 'platform/workspaces/node/workspacesIpc';
import { WindowsChannel } from 'platform/windows/node/windowsIpc';

import { LifecycleService } from 'platform/lifecycle/electron-main/lifecycleMain';

import { HistoryMainService } from 'platform/history/electron-main/historyMainService';
import { IHistoryMainService } from 'platform/history/common/history';

import { StateService } from 'platform/state/node/stateService';

import { IConfigurationService } from 'platform/configuration/common/configuration';
import { ConfigurationService } from 'platform/configuration/node/configurationService';

import { IURLService } from 'platform/url/common/url';
import { URLService } from 'platform/url/common/urlService';

import { IRequestService } from 'platform/request/node/request';
import { RequestService } from 'platform/request/electron-main/requestService';

import { IDialogService } from 'platform/dialogs/common/dialogs';
import { CommandLineDialogService } from 'platform/dialogs/node/dialogService';

import { IBackupMainService } from 'platform/backup/common/backup';
import { BackupMainService } from 'platform/backup/electron-main/backupMainService';

import { IDiagnosticsService, DiagnosticsService } from 'platform/diagnostics/electron-main/diagnosticsService';
import { InstantiationService } from 'platform/instantiation/node/instantiationService';

import { mkdirp, readdir, rimraf } from 'base/node/pfs';
import { assign } from 'base/common/objects';

import { createSpdLogService } from 'platform/log/node/spdlogService';

import { LaunchChannelClient } from 'platform/launch/electron-main/launchService';
import { serve } from 'base/parts/ipc/node/ipc.net';

import { localize } from 'base/nls';
import { uploadLogs } from 'code/electron-main/logUploader';
import { dialog } from 'electron';
import * as fs from 'fs';

import product from 'platform/node/product';
import { mnemonicButtonLabel } from 'base/common/labels';

async function cleanupOlderLogs(environmentService: EnvironmentService): Promise<void> {
	const currentLog = path.basename(environmentService.logsPath);
	const logsRoot = path.dirname(environmentService.logsPath);
	const children = await readdir(logsRoot);
	const allSessions = children.filter(name => /^\d{8}T\d{6}$/.test(name));
	const oldSessions = allSessions.sort().filter((d, i) => d !== currentLog);
	const toDelete = oldSessions.slice(0, Math.max(0, oldSessions.length - 9));

	await TPromise.join(toDelete.map(name => rimraf(path.join(logsRoot, name))));
}


function createServices(args: ParsedArgs, bufferLogService: BufferLogService): IInstantiationService {
	const services = new ServiceCollection();

	const environmentService = new EnvironmentService(args, process.execPath);
	const consoleLogService = new ConsoleLogMainService(getLogLevel(environmentService));
	const logService = new MultiplexLogService([consoleLogService, bufferLogService]);
	const labelService = new LabelService(environmentService, undefined, undefined);

	process.once('exit', () => logService.dispose());

	// Eventually cleanup
	setTimeout(() => cleanupOlderLogs(environmentService).then(null, err => console.error(err)), 10000);

	services.set(IEnvironmentService, environmentService);
	services.set(ILabelService, labelService);
	services.set(ILogService, logService);
	services.set(IWorkspacesMainService, new SyncDescriptor(WorkspacesMainService));
	services.set(IHistoryMainService, new SyncDescriptor(HistoryMainService));
	services.set(ILifecycleService, new SyncDescriptor(LifecycleService));
	services.set(IStateService, new SyncDescriptor(StateService));
	services.set(IConfigurationService, new SyncDescriptor(ConfigurationService));
	services.set(IRequestService, new SyncDescriptor(RequestService));
	services.set(IURLService, new SyncDescriptor(URLService));
	services.set(IBackupMainService, new SyncDescriptor(BackupMainService));
	services.set(IDialogService, new SyncDescriptor(CommandLineDialogService));
	services.set(IDiagnosticsService, new SyncDescriptor(DiagnosticsService));

	return new InstantiationService(services, true);
}


function createPaths(environmentService: IEnvironmentService): TPromise<any> {
	const paths = [
		environmentService.extensionsPath,
		environmentService.nodeCachedDataDir,
		environmentService.logsPath,
		environmentService.workspaceStorageHome
	];

	return TPromise.join(paths.map(p => p && mkdirp(p))) as TPromise<any>;
}

function startup(args: ParsedArgs): void {
	// We need to buffer the spdlog logs until we are sure
	// we are the only instance running, otherwise we'll have concurrent
	// log file access on Windows
	// https://github.com/Microsoft/vscode/issues/41218
	const bufferLogService = new BufferLogService();
	const instantiationService = createServices(args, bufferLogService);

	instantiationService.invokeFunction(accessor => {

		// Patch `process.env` with the instance's environment
		const environmentService = accessor.get(IEnvironmentService);
		const instanceEnv: typeof process.env = {
			VSCODE_IPC_HOOK: environmentService.mainIPCHandle,
			VSCODE_NLS_CONFIG: process.env['VSCODE_NLS_CONFIG'],
			VSCODE_LOGS: process.env['VSCODE_LOGS']
		};

		if (process.env['VSCODE_PORTABLE']) {
			instanceEnv['VSCODE_PORTABLE'] = process.env['VSCODE_PORTABLE'];
		}

		assign(process.env, instanceEnv);

		// Startup
		return instantiationService.invokeFunction(a => createPaths(a.get(IEnvironmentService)))
			.then(() => instantiationService.invokeFunction(setupIPC))
			.then(mainIpcServer => {
				bufferLogService.logger = createSpdLogService('main', bufferLogService.getLevel(), environmentService.logsPath);
				return instantiationService.createInstance(HyperApplication, mainIpcServer, instanceEnv).startup();
			});
	}).then(null, err => instantiationService.invokeFunction(quit, err));
}


function setupIPC(accessor: ServicesAccessor): Thenable<Server> {
	const logService = accessor.get(ILogService);
	const environmentService = accessor.get(IEnvironmentService);
	const requestService = accessor.get(IRequestService);
	const diagnosticsService = accessor.get(IDiagnosticsService);

	function allowSetForegroundWindow(service: LaunchChannelClient): TPromise<void> {
		let promise = TPromise.wrap<void>(void 0);
		if (platform.isWindows) {
			promise = service.getMainProcessId()
				.then(processId => {
					logService.trace('Sending some foreground love to the running instance:', processId);

					try {
						const { allowSetForegroundWindow } = <any>require.__$__nodeRequire('windows-foreground-love');
						allowSetForegroundWindow(processId);
					} catch (e) {
						// noop
					}
				});
		}

		return promise;
	}

	function setup(retry: boolean): Thenable<Server> {
		return serve(environmentService.mainIPCHandle).then(server => {

			// Print --status usage info
			if (environmentService.args.status) {
				logService.warn('Warning: The --status argument can only be used if Code is already running. Please run it again after Code has started.');
				throw new ExpectedError('Terminating...');
			}

			// Log uploader usage info
			if (typeof environmentService.args['upload-logs'] !== 'undefined') {
				logService.warn('Warning: The --upload-logs argument can only be used if Code is already running. Please run it again after Code has started.');
				throw new ExpectedError('Terminating...');
			}

			// dock might be hidden at this case due to a retry
			if (platform.isMacintosh) {
				app.dock.show();
			}

			// Set the VSCODE_PID variable here when we are sure we are the first
			// instance to startup. Otherwise we would wrongly overwrite the PID
			process.env['VSCODE_PID'] = String(process.pid);

			return server;
		}, err => {
			if (err.code !== 'EADDRINUSE') {
				return Promise.reject<Server>(err);
			}

			// Since we are the second instance, we do not want to show the dock
			if (platform.isMacintosh) {
				app.dock.hide();
			}

			// there's a running instance, let's connect to it
			return connect(environmentService.mainIPCHandle, 'main').then(
				client => {

					// Tests from CLI require to be the only instance currently
					if (environmentService.extensionTestsPath && !environmentService.debugExtensionHost.break) {
						const msg = 'Running extension tests from the command line is currently only supported if no other instance of Code is running.';
						logService.error(msg);
						client.dispose();

						return Promise.reject(new Error(msg));
					}

					// Show a warning dialog after some timeout if it takes long to talk to the other instance
					// Skip this if we are running with --wait where it is expected that we wait for a while.
					// Also skip when gathering diagnostics (--status) which can take a longer time.
					let startupWarningDialogHandle: any;
					if (!environmentService.wait && !environmentService.status && !environmentService.args['upload-logs']) {
						startupWarningDialogHandle = setTimeout(() => {
							showStartupWarningDialog(
								localize('secondInstanceNoResponse', "Another instance of {0} is running but not responding", product.nameShort),
								localize('secondInstanceNoResponseDetail', "Please close all other instances and try again.")
							);
						}, 10000);
					}

					const channel = client.getChannel('launch');
					const service = new LaunchChannelClient(channel);

					// Process Info
					if (environmentService.args.status) {
						return service.getMainProcessInfo().then(info => {
							return diagnosticsService.printDiagnostics(info).then(() => Promise.reject(new ExpectedError()));
						});
					}

					// Log uploader
					if (typeof environmentService.args['upload-logs'] !== 'undefined') {
						return uploadLogs(service, requestService, environmentService)
							.then(() => Promise.reject(new ExpectedError()));
					}

					logService.trace('Sending env to running instance...');

					return allowSetForegroundWindow(service)
						.then(() => service.start(environmentService.args, process.env))
						.then(() => client.dispose())
						.then(() => {

							// Now that we started, make sure the warning dialog is prevented
							if (startupWarningDialogHandle) {
								clearTimeout(startupWarningDialogHandle);
							}

							return Promise.reject(new ExpectedError('Sent env to running instance. Terminating...'));
						});
				},
				err => {
					if (!retry || platform.isWindows || err.code !== 'ECONNREFUSED') {
						if (err.code === 'EPERM') {
							showStartupWarningDialog(
								localize('secondInstanceAdmin', "A second instance of {0} is already running as administrator.", product.nameShort),
								localize('secondInstanceAdminDetail', "Please close the other instance and try again.")
							);
						}

						return Promise.reject<Server>(err);
					}

					// it happens on Linux and OS X that the pipe is left behind
					// let's delete it, since we can't connect to it
					// and then retry the whole thing
					try {
						fs.unlinkSync(environmentService.mainIPCHandle);
					} catch (e) {
						logService.warn('Could not delete obsolete instance handle', e);
						return Promise.reject<Server>(e);
					}

					return setup(false);
				}
			);
		});
	}

	return setup(true);
}

function showStartupWarningDialog(message: string, detail: string): void {
	dialog.showMessageBox({
		title: product.nameLong,
		type: 'warning',
		buttons: [mnemonicButtonLabel(localize({ key: 'close', comment: ['&& denotes a mnemonic'] }, "&&Close"))],
		message,
		detail,
		noLink: true
	});
}

function main(): void {

	// Set the error handler early enough so that we are not getting the
	// default electron error dialog popping up
	setUnexpectedErrorHandler(err => console.error(err));

	// Parse arguments
	let args: ParsedArgs;
	try {
		args = parseMainProcessArgv(process.argv);
		args = validatePaths(args);
	} catch (err) {
		console.error(err.message);
		app.exit(1);

		return void 0;
	}

	// If we are started with --wait create a random temporary file
	// and pass it over to the starting instance. We can use this file
	// to wait for it to be deleted to monitor that the edited file
	// is closed and then exit the waiting process.
	//
	// Note: we are not doing this if the wait marker has been already
	// added as argument. This can happen if Code was started from CLI.
	if (args.wait && !args.waitMarkerFilePath) {
		createWaitMarkerFile(args.verbose).then(waitMarkerFilePath => {
			if (waitMarkerFilePath) {
				process.argv.push('--waitMarkerFilePath', waitMarkerFilePath);
				args.waitMarkerFilePath = waitMarkerFilePath;
			}

			startup(args);
		});
	}

	// Otherwise just startup normally
	else {
		startup(args);
	}
}

class ExpectedError extends Error {
	public readonly isExpected = true;
}

function quit(accessor: ServicesAccessor, reason?: ExpectedError | Error): void {
	const logService = accessor.get(ILogService);
	const lifecycleService = accessor.get(ILifecycleService);

	let exitCode = 0;

	if (reason) {
		if ((reason as ExpectedError).isExpected) {
			if (reason.message) {
				logService.trace(reason.message);
			}
		} else {
			exitCode = 1; // signal error to the outside

			if (reason.stack) {
				logService.error(reason.stack);
			} else {
				logService.error(`Startup error: ${reason.toString()}`);
			}
		}
	}

	lifecycleService.kill(exitCode);
}

main();
