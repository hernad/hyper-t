/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { URI } from 'base/common/uri';
import { IRange } from 'editor/common/core/range';
import { IChange, ILineChange } from 'editor/common/editorCommon';
import { IInplaceReplaceSupportResult, TextEdit } from 'editor/common/modes';
import { createDecorator } from 'platform/instantiation/common/instantiation';

export const ID_EDITOR_WORKER_SERVICE = 'editorWorkerService';
export const IEditorWorkerService = createDecorator<IEditorWorkerService>(ID_EDITOR_WORKER_SERVICE);

export interface IDiffComputationResult {
	identical: boolean;
	changes: ILineChange[];
}

export interface IEditorWorkerService {
	_serviceBrand: any;

	canComputeDiff(original: URI, modified: URI): boolean;
	computeDiff(original: URI, modified: URI, ignoreTrimWhitespace: boolean): Promise<IDiffComputationResult | null>;

	canComputeDirtyDiff(original: URI, modified: URI): boolean;
	computeDirtyDiff(original: URI, modified: URI, ignoreTrimWhitespace: boolean): Promise<IChange[] | null>;

	computeMoreMinimalEdits(resource: URI, edits: TextEdit[]): Promise<TextEdit[]>;

	canComputeWordRanges(resource: URI): boolean;
	computeWordRanges(resource: URI, range: IRange): Promise<{ [word: string]: IRange[] } | null>;

	canNavigateValueSet(resource: URI): boolean;
	navigateValueSet(resource: URI, range: IRange, up: boolean): Promise<IInplaceReplaceSupportResult | null>;
}
