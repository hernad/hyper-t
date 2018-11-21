/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Server } from 'base/parts/ipc/node/ipc.cp';
import { WatcherChannel } from 'workbench/services/files/node/watcher/unix/watcherIpc';
import { ChokidarWatcherService } from 'workbench/services/files/node/watcher/unix/chokidarWatcherService';

const server = new Server('watcher');
const service = new ChokidarWatcherService();
const channel = new WatcherChannel(service);
server.registerChannel('watcher', channel);