/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from 'base/common/lifecycle';
import { onUnexpectedError } from 'base/common/errors';
import { ConfigurationModelParser, ConfigurationModel } from 'platform/configuration/common/configurationModels';
import { ConfigWatcher } from 'base/node/config';
import { Event, Emitter } from 'base/common/event';

export class UserConfiguration extends Disposable {

	private userConfigModelWatcher: ConfigWatcher<ConfigurationModelParser>;

	private readonly _onDidChangeConfiguration: Emitter<ConfigurationModel> = this._register(new Emitter<ConfigurationModel>());
	readonly onDidChangeConfiguration: Event<ConfigurationModel> = this._onDidChangeConfiguration.event;

	constructor(settingsPath: string) {
		super();
		this.userConfigModelWatcher = new ConfigWatcher(settingsPath, {
			changeBufferDelay: 300, onError: error => onUnexpectedError(error), defaultConfig: new ConfigurationModelParser(settingsPath), parse: (content: string, parseErrors: any[]) => {
				const userConfigModelParser = new ConfigurationModelParser(settingsPath);
				userConfigModelParser.parse(content);
				parseErrors = [...userConfigModelParser.errors];
				return userConfigModelParser;
			}
		});
		this._register(this.userConfigModelWatcher);

		// Listeners
		this._register(this.userConfigModelWatcher.onDidUpdateConfiguration(() => this._onDidChangeConfiguration.fire(this.configurationModel)));
	}

	get configurationModel(): ConfigurationModel {
		return this.userConfigModelWatcher.getConfig().configurationModel;
	}

	reload(): Promise<void> {
		return new Promise<void>(c => this.userConfigModelWatcher.reload(() => c()));
	}

}