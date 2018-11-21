/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IPath } from 'platform/windows/common/windows';
import { Event as CommonEvent } from 'base/common/event';
import { createDecorator } from 'platform/instantiation/common/instantiation';
import { IWorkspaceIdentifier, ISingleFolderWorkspaceIdentifier } from 'platform/workspaces/common/workspaces';
import { URI } from 'base/common/uri';

export const IHistoryMainService = createDecorator<IHistoryMainService>('historyMainService');

export interface IRecentlyOpened {
	workspaces: (IWorkspaceIdentifier | ISingleFolderWorkspaceIdentifier)[];
	files: URI[];
}

export interface IHistoryMainService {
	_serviceBrand: any;

	onRecentlyOpenedChange: CommonEvent<void>;

	addRecentlyOpened(workspaces: (IWorkspaceIdentifier | ISingleFolderWorkspaceIdentifier)[], files: URI[]): void;
	getRecentlyOpened(currentWorkspace?: IWorkspaceIdentifier | ISingleFolderWorkspaceIdentifier, currentFiles?: IPath[]): IRecentlyOpened;
	removeFromRecentlyOpened(paths: (IWorkspaceIdentifier | ISingleFolderWorkspaceIdentifier | URI | string)[]): void;
	clearRecentlyOpened(): void;

	updateWindowsJumpList(): void;
}