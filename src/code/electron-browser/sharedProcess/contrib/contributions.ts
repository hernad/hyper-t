/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { NodeCachedDataCleaner } from 'code/electron-browser/sharedProcess/contrib/nodeCachedDataCleaner';
import { LanguagePackCachedDataCleaner } from 'code/electron-browser/sharedProcess/contrib/languagePackCachedDataCleaner';
import { IInstantiationService } from 'platform/instantiation/common/instantiation';
import { IDisposable, combinedDisposable } from 'base/common/lifecycle';

export function createSharedProcessContributions(service: IInstantiationService): IDisposable {
	return combinedDisposable([
		service.createInstance(NodeCachedDataCleaner),
		service.createInstance(LanguagePackCachedDataCleaner)
	]);
}
