/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createDecorator } from 'platform/instantiation/common/instantiation';
import { URI } from 'base/common/uri';
import { Event } from 'base/common/event';
import { ColorIdentifier } from 'platform/theme/common/colorRegistry';
import { IDisposable } from 'base/common/lifecycle';
import { CancellationToken } from 'base/common/cancellation';

export const IDecorationsService = createDecorator<IDecorationsService>('IFileDecorationsService');

export interface IDecorationData {
	readonly weight?: number;
	readonly color?: ColorIdentifier;
	readonly letter?: string;
	readonly tooltip?: string;
	readonly bubble?: boolean;
	readonly source?: string;
}

export interface IDecoration {
	readonly tooltip: string;
	readonly labelClassName: string;
	readonly badgeClassName: string;
	update(data: IDecorationData): IDecoration;
}

export interface IDecorationsProvider {
	readonly label: string;
	readonly onDidChange: Event<URI[]>;
	provideDecorations(uri: URI, token: CancellationToken): IDecorationData | Thenable<IDecorationData> | undefined;
}

export interface IResourceDecorationChangeEvent {
	affectsResource(uri: URI): boolean;
}

export interface IDecorationsService {

	readonly _serviceBrand: any;

	readonly onDidChangeDecorations: Event<IResourceDecorationChangeEvent>;

	registerDecorationsProvider(provider: IDecorationsProvider): IDisposable;

	getDecoration(uri: URI, includeChildren: boolean, overwrite?: IDecorationData): IDecoration | undefined;
}
