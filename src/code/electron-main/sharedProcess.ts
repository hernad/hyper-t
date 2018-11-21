/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { assign } from 'base/common/objects';
import { memoize } from 'base/common/decorators';
import { IEnvironmentService } from 'platform/environment/common/environment';
import { TPromise } from 'base/common/winjs.base';
import { IProcessEnvironment } from 'base/common/platform';
import { BrowserWindow, ipcMain } from 'electron';
import { ISharedProcess } from 'platform/windows/electron-main/windows';
import { Barrier } from 'base/common/async';
import { ILogService } from 'platform/log/common/log';
import { ILifecycleService } from 'platform/lifecycle/electron-main/lifecycleMain';
import { IStateService } from 'platform/state/common/state';
import { getBackgroundColor } from 'code/electron-main/theme';
import { dispose, toDisposable, IDisposable } from 'base/common/lifecycle';

export class SharedProcess implements ISharedProcess {

	private barrier = new Barrier();

	private window: Electron.BrowserWindow | null;

	constructor(
		private readonly machineId: string,
		private readonly userEnv: IProcessEnvironment,
		@IEnvironmentService private readonly environmentService: IEnvironmentService,
		@ILifecycleService private readonly lifecycleService: ILifecycleService,
		@IStateService private readonly stateService: IStateService,
		@ILogService private readonly logService: ILogService
	) {
	}

	@memoize
	private get _whenReady(): TPromise<void> {
		this.window = new BrowserWindow({
			show: false,
			backgroundColor: getBackgroundColor(this.stateService),
			webPreferences: {
				images: false,
				webaudio: false,
				webgl: false,
				disableBlinkFeatures: 'Auxclick' // do NOT change, allows us to identify this window as shared-process in the process explorer
			}
		});
		const config = assign({
			appRoot: this.environmentService.appRoot,
			machineId: this.machineId,
			nodeCachedDataDir: this.environmentService.nodeCachedDataDir,
			userEnv: this.userEnv
		});

		const url = `${require.toUrl('code/electron-browser/sharedProcess/sharedProcess.html')}?config=${encodeURIComponent(JSON.stringify(config))}`;
		this.window.loadURL(url);

		// Prevent the window from dying
		const onClose = (e: Event) => {
			this.logService.trace('SharedProcess#close prevented');

			// We never allow to close the shared process unless we get explicitly disposed()
			e.preventDefault();

			// Still hide the window though if visible
			if (this.window && this.window.isVisible()) {
				this.window.hide();
			}
		};

		this.window.on('close', onClose);

		const disposables: IDisposable[] = [];

		this.lifecycleService.onShutdown(() => {
			dispose(disposables);

			// Shut the shared process down when we are quitting
			//
			// Note: because we veto the window close, we must first remove our veto.
			// Otherwise the application would never quit because the shared process
			// window is refusing to close!
			//
			if (this.window) {
				this.window.removeListener('close', onClose);
			}

			// Electron seems to crash on Windows without this setTimeout :|
			setTimeout(() => {
				try {
					if (this.window) {
						this.window.close();
					}
				} catch (err) {
					// ignore, as electron is already shutting down
				}

				this.window = null;
			}, 0);
		});

		return new TPromise<void>((c, e) => {
			ipcMain.once('handshake:hello', ({ sender }: { sender: any }) => {
				sender.send('handshake:hey there', {
					sharedIPCHandle: this.environmentService.sharedIPCHandle,
					args: this.environmentService.args,
					logLevel: this.logService.getLevel()
				});

				disposables.push(toDisposable(() => sender.send('handshake:goodbye')));
				ipcMain.once('handshake:im ready', () => c(void 0));
			});
		});
	}

	spawn(): void {
		this.barrier.open();
	}

	whenReady(): TPromise<void> {
		return this.barrier.wait().then(() => this._whenReady);
	}

	toggle(): void {
		if (!this.window || this.window.isVisible()) {
			this.hide();
		} else {
			this.show();
		}
	}

	show(): void {
		if (this.window) {
			this.window.show();
			this.window.webContents.openDevTools();
		}
	}

	hide(): void {
		if (this.window) {
			this.window.webContents.closeDevTools();
			this.window.hide();
		}
	}
}
