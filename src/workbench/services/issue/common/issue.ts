/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TPromise } from 'base/common/winjs.base';
import { createDecorator } from 'platform/instantiation/common/instantiation';
import { IssueReporterData } from 'platform/issue/common/issue';

export const IWorkbenchIssueService = createDecorator<IWorkbenchIssueService>('workbenchIssueService');

export interface IWorkbenchIssueService {
	_serviceBrand: any;
	openReporter(dataOverrides?: Partial<IssueReporterData>): TPromise<void>;
	openProcessExplorer(): TPromise<void>;
}
