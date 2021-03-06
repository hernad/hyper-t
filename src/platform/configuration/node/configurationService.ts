/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Registry } from 'platform/registry/common/platform';
import { IConfigurationRegistry, Extensions } from 'platform/configuration/common/configurationRegistry';
import { IDisposable, Disposable } from 'base/common/lifecycle';
import { IConfigurationService, IConfigurationChangeEvent, IConfigurationOverrides, ConfigurationTarget, compare, isConfigurationOverrides, IConfigurationData } from 'platform/configuration/common/configuration';
import { DefaultConfigurationModel, Configuration, ConfigurationChangeEvent } from 'platform/configuration/common/configurationModels';
import { Event, Emitter } from 'base/common/event';
import { IEnvironmentService } from 'platform/environment/common/environment';
import { equals } from 'base/common/objects';
import { IWorkspaceFolder } from 'platform/workspace/common/workspace';
import { UserConfiguration } from 'platform/configuration/node/configuration';

export class ConfigurationService extends Disposable implements IConfigurationService, IDisposable {

	_serviceBrand: any;

	private _configuration: Configuration;
	private userConfiguration: UserConfiguration;

	private readonly _onDidChangeConfiguration: Emitter<IConfigurationChangeEvent> = this._register(new Emitter<IConfigurationChangeEvent>());
	readonly onDidChangeConfiguration: Event<IConfigurationChangeEvent> = this._onDidChangeConfiguration.event;

	constructor(
		@IEnvironmentService environmentService: IEnvironmentService
	) {
		super();

		this.userConfiguration = this._register(new UserConfiguration(environmentService.appSettingsPath));

		this.reset();

		// Listeners
		this._register(this.userConfiguration.onDidChangeConfiguration(() => this.onDidChangeUserConfiguration()));
		this._register(Registry.as<IConfigurationRegistry>(Extensions.Configuration).onDidRegisterConfiguration(configurationProperties => this.onDidRegisterConfiguration(configurationProperties)));
	}

	get configuration(): Configuration {
		return this._configuration;
	}

	getConfigurationData(): IConfigurationData {
		return this.configuration.toData();
	}

	getValue<T>(): T;
	getValue<T>(section: string): T;
	getValue<T>(overrides: IConfigurationOverrides): T;
	getValue<T>(section: string, overrides: IConfigurationOverrides): T;
	getValue(arg1?: any, arg2?: any): any {
		const section = typeof arg1 === 'string' ? arg1 : void 0;
		const overrides = isConfigurationOverrides(arg1) ? arg1 : isConfigurationOverrides(arg2) ? arg2 : {};
		return this.configuration.getValue(section, overrides, null);
	}

	updateValue(key: string, value: any): Promise<void>;
	updateValue(key: string, value: any, overrides: IConfigurationOverrides): Promise<void>;
	updateValue(key: string, value: any, target: ConfigurationTarget): Promise<void>;
	updateValue(key: string, value: any, overrides: IConfigurationOverrides, target: ConfigurationTarget): Promise<void>;
	updateValue(key: string, value: any, arg3?: any, arg4?: any): Promise<void> {
		return Promise.reject(new Error('not supported'));
	}

	inspect<T>(key: string): {
		default: T,
		user: T,
		workspace?: T,
		workspaceFolder?: T
		value: T
	} {
		return this.configuration.inspect<T>(key, {}, null);
	}

	keys(): {
		default: string[];
		user: string[];
		workspace: string[];
		workspaceFolder: string[];
	} {
		return this.configuration.keys(null);
	}

	reloadConfiguration(folder?: IWorkspaceFolder): Promise<void> {
		return folder ? Promise.resolve(null) :
			this.userConfiguration.reload().then(() => this.onDidChangeUserConfiguration());
	}

	private onDidChangeUserConfiguration(): void {
		let changedKeys: string[] = [];
		const { added, updated, removed } = compare(this._configuration.user, this.userConfiguration.configurationModel);
		changedKeys = [...added, ...updated, ...removed];
		if (changedKeys.length) {
			const oldConfiguartion = this._configuration;
			this.reset();
			changedKeys = changedKeys.filter(key => !equals(oldConfiguartion.getValue(key, {}, null), this._configuration.getValue(key, {}, null)));
			if (changedKeys.length) {
				this.trigger(changedKeys, ConfigurationTarget.USER);
			}
		}
	}

	private onDidRegisterConfiguration(keys: string[]): void {
		this.reset(); // reset our caches
		this.trigger(keys, ConfigurationTarget.DEFAULT);
	}

	private reset(): void {
		const defaults = new DefaultConfigurationModel();
		const user = this.userConfiguration.configurationModel;
		this._configuration = new Configuration(defaults, user);
	}

	private trigger(keys: string[], source: ConfigurationTarget): void {
		this._onDidChangeConfiguration.fire(new ConfigurationChangeEvent().change(keys).telemetryData(source, this.getTargetConfiguration(source)));
	}

	private getTargetConfiguration(target: ConfigurationTarget): any {
		switch (target) {
			case ConfigurationTarget.DEFAULT:
				return this._configuration.defaults.contents;
			case ConfigurationTarget.USER:
				return this._configuration.user.contents;
		}
		return {};
	}
}