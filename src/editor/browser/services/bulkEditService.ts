/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ICodeEditor } from 'editor/browser/editorBrowser';
import { WorkspaceEdit } from 'editor/common/modes';
import { createDecorator } from 'platform/instantiation/common/instantiation';
import { IProgressRunner } from 'platform/progress/common/progress';

export const IBulkEditService = createDecorator<IBulkEditService>('IWorkspaceEditService');


export interface IBulkEditOptions {
	editor?: ICodeEditor;
	progress?: IProgressRunner;
}

export interface IBulkEditResult {
	ariaSummary: string;
}

export interface IBulkEditService {
	_serviceBrand: any;

	apply(edit: WorkspaceEdit, options: IBulkEditOptions): Promise<IBulkEditResult>;
}

