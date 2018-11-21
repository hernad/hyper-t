/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { join } from 'base/common/paths';
import { LogLevel } from 'workbench/api/node/extHostTypes';
import { ILogService, DelegatedLogService } from 'platform/log/common/log';
import { createSpdLogService } from 'platform/log/node/spdlogService';
import { ExtHostLogServiceShape } from 'workbench/api/node/extHost.protocol';
import { ExtensionHostLogFileName } from 'workbench/services/extensions/common/extensions';
import { URI } from 'base/common/uri';


export class ExtHostLogService extends DelegatedLogService implements ILogService, ExtHostLogServiceShape {

	private _logsPath: string;
	readonly logFile: URI;

	constructor(
		logLevel: LogLevel,
		logsPath: string,
	) {
		super(createSpdLogService(ExtensionHostLogFileName, logLevel, logsPath));
		this._logsPath = logsPath;
		this.logFile = URI.file(join(logsPath, `${ExtensionHostLogFileName}.log`));
	}

	$setLevel(level: LogLevel): void {
		this.setLevel(level);
	}

	getLogDirectory(extensionID: string): string {
		return join(this._logsPath, extensionID);
	}
}
