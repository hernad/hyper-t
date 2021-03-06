/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from 'base/nls';
import { EditorInput } from 'workbench/common/editor';
import { IExtension } from 'workbench/parts/extensions/common/extensions';
import { URI } from 'base/common/uri';

export class ExtensionsInput extends EditorInput {

	static readonly ID = 'workbench.extensions.input2';
	get extension(): IExtension { return this._extension; }

	constructor(
		private _extension: IExtension,
	) {
		super();
	}

	getTypeId(): string {
		return ExtensionsInput.ID;
	}

	getName(): string {
		return localize('extensionsInputName', "Extension: {0}", this.extension.displayName);
	}

	matches(other: any): boolean {
		if (!(other instanceof ExtensionsInput)) {
			return false;
		}

		const otherExtensionInput = other as ExtensionsInput;

		// TODO@joao is this correct?
		return this.extension === otherExtensionInput.extension;
	}

	resolve(): Promise<any> {
		return Promise.resolve(null);
	}

	supportsSplitEditor(): boolean {
		return false;
	}

	getResource(): URI {
		return URI.from({
			scheme: 'extension',
			path: this.extension.id
		});
	}
}