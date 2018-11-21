/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Event } from 'base/common/event';
import { URI } from 'base/common/uri';
import { ITextBufferFactory, ITextModel, ITextModelCreationOptions } from 'editor/common/model';
import { ILanguageSelection } from 'editor/common/services/modeService';
import { createDecorator } from 'platform/instantiation/common/instantiation';

export const IModelService = createDecorator<IModelService>('modelService');

export interface IModelService {
	_serviceBrand: any;

	createModel(value: string | ITextBufferFactory, languageSelection: ILanguageSelection | null, resource: URI, isForSimpleWidget?: boolean): ITextModel;

	updateModel(model: ITextModel, value: string | ITextBufferFactory): void;

	setMode(model: ITextModel, languageSelection: ILanguageSelection): void;

	destroyModel(resource: URI): void;

	getModels(): ITextModel[];

	getCreationOptions(language: string, resource: URI, isForSimpleWidget: boolean): ITextModelCreationOptions;

	getModel(resource: URI): ITextModel | null;

	onModelAdded: Event<ITextModel>;

	onModelRemoved: Event<ITextModel>;

	onModelModeChanged: Event<{ model: ITextModel; oldModeId: string; }>;
}

export function shouldSynchronizeModel(model: ITextModel): boolean {
	return (
		!model.isTooLargeForSyncing() && !model.isForSimpleWidget
	);
}
