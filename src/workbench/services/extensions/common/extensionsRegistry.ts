/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as nls from 'base/nls';
import { onUnexpectedError } from 'base/common/errors';
import { IJSONSchema } from 'base/common/jsonSchema';
import Severity from 'base/common/severity';
import { EXTENSION_IDENTIFIER_PATTERN } from 'platform/extensionManagement/common/extensionManagement';
import { Extensions, IJSONContributionRegistry } from 'platform/jsonschemas/common/jsonContributionRegistry';
import { Registry } from 'platform/registry/common/platform';
import { IExtensionDescription, IMessage } from 'workbench/services/extensions/common/extensions';

const hasOwnProperty = Object.hasOwnProperty;
const schemaRegistry = Registry.as<IJSONContributionRegistry>(Extensions.JSONContribution);

export class ExtensionMessageCollector {

	private readonly _messageHandler: (msg: IMessage) => void;
	private readonly _extension: IExtensionDescription;
	private readonly _extensionPointId: string;

	constructor(
		messageHandler: (msg: IMessage) => void,
		extension: IExtensionDescription,
		extensionPointId: string
	) {
		this._messageHandler = messageHandler;
		this._extension = extension;
		this._extensionPointId = extensionPointId;
	}

	private _msg(type: Severity, message: string): void {
		this._messageHandler({
			type: type,
			message: message,
			extensionId: this._extension.id,
			extensionPointId: this._extensionPointId
		});
	}

	public error(message: string): void {
		this._msg(Severity.Error, message);
	}

	public warn(message: string): void {
		this._msg(Severity.Warning, message);
	}

	public info(message: string): void {
		this._msg(Severity.Info, message);
	}
}

export interface IExtensionPointUser<T> {
	description: IExtensionDescription;
	value: T;
	collector: ExtensionMessageCollector;
}

export interface IExtensionPointHandler<T> {
	(extensions: IExtensionPointUser<T>[]): void;
}

export interface IExtensionPoint<T> {
	name: string;
	setHandler(handler: IExtensionPointHandler<T>): void;
}

export class ExtensionPoint<T> implements IExtensionPoint<T> {

	public readonly name: string;
	private _handler: IExtensionPointHandler<T> | null;
	private _users: IExtensionPointUser<T>[] | null;
	private _done: boolean;

	constructor(name: string) {
		this.name = name;
		this._handler = null;
		this._users = null;
		this._done = false;
	}

	setHandler(handler: IExtensionPointHandler<T>): void {
		if (this._handler !== null || this._done) {
			throw new Error('Handler already set!');
		}
		this._handler = handler;
		this._handle();
	}

	acceptUsers(users: IExtensionPointUser<T>[]): void {
		if (this._users !== null || this._done) {
			throw new Error('Users already set!');
		}
		this._users = users;
		this._handle();
	}

	private _handle(): void {
		if (this._handler === null || this._users === null) {
			return;
		}
		this._done = true;

		let handler = this._handler;
		this._handler = null;

		let users = this._users;
		this._users = null;

		try {
			handler(users);
		} catch (err) {
			onUnexpectedError(err);
		}
	}
}

const schemaId = 'hypert://schemas/hypert-extensions';
export const schema = {
	properties: {
		engines: {
			type: 'object',
			description: nls.localize('hypert.extension.engines', "Engine compatibility."),
			properties: {
				'hypert': {
					type: 'string',
					description: nls.localize('hypert.extension.engines.hypert', 'For HT Code extensions, specifies the VS Code version that the extension is compatible with. Cannot be *. For example: ^0.10.5 indicates compatibility with a minimum HT version of 0.10.5.'),
					default: '^1.22.0',
				}
			}
		},
		publisher: {
			description: nls.localize('hypert.extension.publisher', 'The publisher of the VS Code extension.'),
			type: 'string'
		},
		displayName: {
			description: nls.localize('hypert.extension.displayName', 'The display name for the extension used in the VS Code gallery.'),
			type: 'string'
		},
		categories: {
			description: nls.localize('hypert.extension.categories', 'The categories used by the VS Code gallery to categorize the extension.'),
			type: 'array',
			uniqueItems: true,
			items: {
				oneOf: [{
					type: 'string',
					enum: ['Programming Languages', 'Snippets', 'Linters', 'Themes', 'Debuggers', 'Other', 'Keymaps', 'Formatters', 'Extension Packs', 'SCM Providers', 'Azure', 'Language Packs'],
				},
				{
					type: 'string',
					const: 'Languages',
					deprecationMessage: nls.localize('hypert.extension.category.languages.deprecated', 'Use \'Programming  Languages\' instead'),
				}]
			}
		},
		galleryBanner: {
			type: 'object',
			description: nls.localize('hypert.extension.galleryBanner', 'Banner used in the VS Code marketplace.'),
			properties: {
				color: {
					description: nls.localize('hypert.extension.galleryBanner.color', 'The banner color on the VS Code marketplace page header.'),
					type: 'string'
				},
				theme: {
					description: nls.localize('hypert.extension.galleryBanner.theme', 'The color theme for the font used in the banner.'),
					type: 'string',
					enum: ['dark', 'light']
				}
			}
		},
		contributes: {
			description: nls.localize('hypert.extension.contributes', 'All contributions of the VS Code extension represented by this package.'),
			type: 'object',
			properties: {
				// extensions will fill in
			},
			default: {}
		},
		preview: {
			type: 'boolean',
			description: nls.localize('hypert.extension.preview', 'Sets the extension to be flagged as a Preview in the Marketplace.'),
		},
		activationEvents: {
			description: nls.localize('hypert.extension.activationEvents', 'Activation events for the VS Code extension.'),
			type: 'array',
			items: {
				type: 'string',
				defaultSnippets: [
					{
						label: 'onLanguage',
						description: nls.localize('hypert.extension.activationEvents.onLanguage', 'An activation event emitted whenever a file that resolves to the specified language gets opened.'),
						body: 'onLanguage:${1:languageId}'
					},
					{
						label: 'onCommand',
						description: nls.localize('hypert.extension.activationEvents.onCommand', 'An activation event emitted whenever the specified command gets invoked.'),
						body: 'onCommand:${2:commandId}'
					},
					{
						label: 'onDebug',
						description: nls.localize('hypert.extension.activationEvents.onDebug', 'An activation event emitted whenever a user is about to start debugging or about to setup debug configurations.'),
						body: 'onDebug'
					},
					{
						label: 'onDebugInitialConfigurations',
						description: nls.localize('hypert.extension.activationEvents.onDebugInitialConfigurations', 'An activation event emitted whenever a "launch.json" needs to be created (and all provideDebugConfigurations methods need to be called).'),
						body: 'onDebugInitialConfigurations'
					},
					{
						label: 'onDebugResolve',
						description: nls.localize('hypert.extension.activationEvents.onDebugResolve', 'An activation event emitted whenever a debug session with the specific type is about to be launched (and a corresponding resolveDebugConfiguration method needs to be called).'),
						body: 'onDebugResolve:${6:type}'
					},
					{
						label: 'workspaceContains',
						description: nls.localize('hypert.extension.activationEvents.workspaceContains', 'An activation event emitted whenever a folder is opened that contains at least a file matching the specified glob pattern.'),
						body: 'workspaceContains:${4:filePattern}'
					},
					{
						label: 'onFileSystem',
						description: nls.localize('hypert.extension.activationEvents.onFileSystem', 'An activation event emitted whenever a file or folder is accessed with the given scheme.'),
						body: 'onFileSystem:${1:scheme}'
					},
					{
						label: 'onSearch',
						description: nls.localize('hypert.extension.activationEvents.onSearch', 'An activation event emitted whenever a search is started in the folder with the given scheme.'),
						body: 'onSearch:${7:scheme}'
					},
					{
						label: 'onView',
						body: 'onView:${5:viewId}',
						description: nls.localize('hypert.extension.activationEvents.onView', 'An activation event emitted whenever the specified view is expanded.'),
					},
					{
						label: 'onUri',
						body: 'onUri',
						description: nls.localize('hypert.extension.activationEvents.onUri', 'An activation event emitted whenever a system-wide Uri directed towards this extension is open.'),
					},
					{
						label: '*',
						description: nls.localize('hypert.extension.activationEvents.star', 'An activation event emitted on VS Code startup. To ensure a great end user experience, please use this activation event in your extension only when no other activation events combination works in your use-case.'),
						body: '*'
					}
				],
			}
		},
		badges: {
			type: 'array',
			description: nls.localize('hypert.extension.badges', 'Array of badges to display in the sidebar of the Marketplace\'s extension page.'),
			items: {
				type: 'object',
				required: ['url', 'href', 'description'],
				properties: {
					url: {
						type: 'string',
						description: nls.localize('hypert.extension.badges.url', 'Badge image URL.')
					},
					href: {
						type: 'string',
						description: nls.localize('hypert.extension.badges.href', 'Badge link.')
					},
					description: {
						type: 'string',
						description: nls.localize('hypert.extension.badges.description', 'Badge description.')
					}
				}
			}
		},
		markdown: {
			type: 'string',
			description: nls.localize('hypert.extension.markdown', "Controls the Markdown rendering engine used in the Marketplace. Either github (default) or standard."),
			enum: ['github', 'standard'],
			default: 'github'
		},
		qna: {
			default: 'marketplace',
			description: nls.localize('hypert.extension.qna', "Controls the Q&A link in the Marketplace. Set to marketplace to enable the default Marketplace Q & A site. Set to a string to provide the URL of a custom Q & A site. Set to false to disable Q & A altogether."),
			anyOf: [
				{
					type: ['string', 'boolean'],
					enum: ['marketplace', false]
				},
				{
					type: 'string'
				}
			]
		},
		extensionDependencies: {
			description: nls.localize('hypert.extension.extensionDependencies', 'Dependencies to other extensions. The identifier of an extension is always ${publisher}.${name}. For example: hypert.csharp.'),
			type: 'array',
			uniqueItems: true,
			items: {
				type: 'string',
				pattern: EXTENSION_IDENTIFIER_PATTERN
			}
		},
		extensionPack: {
			description: nls.localize('hypert.extension.contributes.extensionPack', "A set of extensions that can be installed together. The identifier of an extension is always ${publisher}.${name}. For example: hypert.csharp."),
			type: 'array',
			uniqueItems: true,
			items: {
				type: 'string',
				pattern: EXTENSION_IDENTIFIER_PATTERN
			}
		},
		scripts: {
			type: 'object',
			properties: {
				'hypert:prepublish': {
					description: nls.localize('hypert.extension.scripts.prepublish', 'Script executed before the package is published as a VS Code extension.'),
					type: 'string'
				},
				'hypert:uninstall': {
					description: nls.localize('hypert.extension.scripts.uninstall', 'Uninstall hook for VS Code extension. Script that gets executed when the extension is completely uninstalled from VS Code which is when VS Code is restarted (shutdown and start) after the extension is uninstalled. Only Node scripts are supported.'),
					type: 'string'
				}
			}
		},
		icon: {
			type: 'string',
			description: nls.localize('hypert.extension.icon', 'The path to a 128x128 pixel icon.')
		}
	}
};

export class ExtensionsRegistryImpl {

	private _extensionPoints: { [extPoint: string]: ExtensionPoint<any>; };

	constructor() {
		this._extensionPoints = {};
	}

	public registerExtensionPoint<T>(extensionPoint: string, deps: IExtensionPoint<any>[], jsonSchema: IJSONSchema): IExtensionPoint<T> {
		if (hasOwnProperty.call(this._extensionPoints, extensionPoint)) {
			throw new Error('Duplicate extension point: ' + extensionPoint);
		}
		let result = new ExtensionPoint<T>(extensionPoint);
		this._extensionPoints[extensionPoint] = result;

		schema.properties['contributes'].properties[extensionPoint] = jsonSchema;
		schemaRegistry.registerSchema(schemaId, schema);

		return result;
	}

	public getExtensionPoints(): ExtensionPoint<any>[] {
		return Object.keys(this._extensionPoints).map(point => this._extensionPoints[point]);
	}
}

const PRExtensions = {
	ExtensionsRegistry: 'ExtensionsRegistry'
};
Registry.add(PRExtensions.ExtensionsRegistry, new ExtensionsRegistryImpl());
export const ExtensionsRegistry: ExtensionsRegistryImpl = Registry.as(PRExtensions.ExtensionsRegistry);

schemaRegistry.registerSchema(schemaId, schema);
