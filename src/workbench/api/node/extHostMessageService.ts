/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import Severity from 'base/common/severity';
import * as hypert from 'hypert';
import { MainContext, MainThreadMessageServiceShape, MainThreadMessageOptions, IMainContext } from './extHost.protocol';
import { IExtensionDescription } from 'workbench/services/extensions/common/extensions';

function isMessageItem(item: any): item is hypert.MessageItem {
	return item && item.title;
}

export class ExtHostMessageService {

	private _proxy: MainThreadMessageServiceShape;

	constructor(mainContext: IMainContext) {
		this._proxy = mainContext.getProxy(MainContext.MainThreadMessageService);
	}

	showMessage(extension: IExtensionDescription, severity: Severity, message: string, optionsOrFirstItem: hypert.MessageOptions | string, rest: string[]): Thenable<string | undefined>;
	showMessage(extension: IExtensionDescription, severity: Severity, message: string, optionsOrFirstItem: hypert.MessageOptions | hypert.MessageItem, rest: hypert.MessageItem[]): Thenable<hypert.MessageItem | undefined>;
	showMessage(extension: IExtensionDescription, severity: Severity, message: string, optionsOrFirstItem: hypert.MessageOptions | string | hypert.MessageItem, rest: (string | hypert.MessageItem)[]): Thenable<string | hypert.MessageItem | undefined> {

		let options: MainThreadMessageOptions = { extension };
		let items: (string | hypert.MessageItem)[];

		if (typeof optionsOrFirstItem === 'string' || isMessageItem(optionsOrFirstItem)) {
			items = [optionsOrFirstItem, ...rest];
		} else {
			options.modal = optionsOrFirstItem && optionsOrFirstItem.modal;
			items = rest;
		}

		const commands: { title: string; isCloseAffordance: boolean; handle: number; }[] = [];

		for (let handle = 0; handle < items.length; handle++) {
			let command = items[handle];
			if (typeof command === 'string') {
				commands.push({ title: command, handle, isCloseAffordance: false });
			} else if (typeof command === 'object') {
				let { title, isCloseAffordance } = command;
				commands.push({ title, isCloseAffordance, handle });
			} else {
				console.warn('Invalid message item:', command);
			}
		}

		return this._proxy.$showMessage(severity, message, options, commands).then(handle => {
			if (typeof handle === 'number') {
				return items[handle];
			}
			return undefined;
		});
	}
}
