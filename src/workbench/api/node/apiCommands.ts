/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { URI } from 'base/common/uri';
import { isMalformedFileUri } from 'base/common/resources';
import * as hypert from 'hypert';
import * as typeConverters from 'workbench/api/node/extHostTypeConverters';
import { CommandsRegistry, ICommandService, ICommandHandler } from 'platform/commands/common/commands';
import { ITextEditorOptions } from 'platform/editor/common/editor';
import { EditorViewColumn } from 'workbench/api/shared/editor';
import { EditorGroupLayout } from 'workbench/services/group/common/editorGroupsService';

// -----------------------------------------------------------------
// The following commands are registered on both sides separately.
//
// We are trying to maintain backwards compatibility for cases where
// API commands are encoded as markdown links, for example.
// -----------------------------------------------------------------

export interface ICommandsExecutor {
	executeCommand<T>(id: string, ...args: any[]): Thenable<T>;
}

function adjustHandler(handler: (executor: ICommandsExecutor, ...args: any[]) => any): ICommandHandler {
	return (accessor, ...args: any[]) => {
		return handler(accessor.get(ICommandService), ...args);
	};
}

export class PreviewHTMLAPICommand {
	public static ID = 'hypert.previewHtml';
	public static execute(executor: ICommandsExecutor, uri: URI, position?: hypert.ViewColumn, label?: string, options?: any): Thenable<any> {
		return executor.executeCommand('_workbench.previewHtml',
			uri,
			typeof position === 'number' && typeConverters.ViewColumn.from(position),
			label,
			options
		);
	}
}
CommandsRegistry.registerCommand(PreviewHTMLAPICommand.ID, adjustHandler(PreviewHTMLAPICommand.execute));

export class OpenFolderAPICommand {
	public static ID = 'hypert.openFolder';
	public static execute(executor: ICommandsExecutor, uri?: URI, forceNewWindow?: boolean): Thenable<any> {
		if (!uri) {
			return executor.executeCommand('_files.pickFolderAndOpen', forceNewWindow);
		}
		let correctedUri = isMalformedFileUri(uri);
		if (correctedUri) {
			// workaround for #55916 and #55891, will be removed in 1.28
			console.warn(`'hypert.openFolder' command invoked with an invalid URI (file:// scheme missing): '${uri}'. Converted to a 'file://' URI: ${correctedUri}`);
			uri = correctedUri;
		}

		return executor.executeCommand('_files.windowOpen', [uri], forceNewWindow);
	}
}
CommandsRegistry.registerCommand(OpenFolderAPICommand.ID, adjustHandler(OpenFolderAPICommand.execute));

export class DiffAPICommand {
	public static ID = 'hypert.diff';
	public static execute(executor: ICommandsExecutor, left: URI, right: URI, label: string, options?: hypert.TextDocumentShowOptions): Thenable<any> {
		return executor.executeCommand('_workbench.diff', [
			left, right,
			label,
			undefined,
			typeConverters.TextEditorOptions.from(options),
			options ? typeConverters.ViewColumn.from(options.viewColumn) : undefined
		]);
	}
}
CommandsRegistry.registerCommand(DiffAPICommand.ID, adjustHandler(DiffAPICommand.execute));

export class OpenAPICommand {
	public static ID = 'hypert.open';
	public static execute(executor: ICommandsExecutor, resource: URI, columnOrOptions?: hypert.ViewColumn | hypert.TextDocumentShowOptions, label?: string): Thenable<any> {
		let options: ITextEditorOptions;
		let position: EditorViewColumn;

		if (columnOrOptions) {
			if (typeof columnOrOptions === 'number') {
				position = typeConverters.ViewColumn.from(columnOrOptions);
			} else {
				options = typeConverters.TextEditorOptions.from(columnOrOptions);
				position = typeConverters.ViewColumn.from(columnOrOptions.viewColumn);
			}
		}

		return executor.executeCommand('_workbench.open', [
			resource,
			options,
			position,
			label
		]);
	}
}
CommandsRegistry.registerCommand(OpenAPICommand.ID, adjustHandler(OpenAPICommand.execute));

export class RemoveFromRecentlyOpenedAPICommand {
	public static ID = 'hypert.removeFromRecentlyOpened';
	public static execute(executor: ICommandsExecutor, path: string): Thenable<any> {
		return executor.executeCommand('_workbench.removeFromRecentlyOpened', path);
	}
}
CommandsRegistry.registerCommand(RemoveFromRecentlyOpenedAPICommand.ID, adjustHandler(RemoveFromRecentlyOpenedAPICommand.execute));

export class SetEditorLayoutAPICommand {
	public static ID = 'hypert.setEditorLayout';
	public static execute(executor: ICommandsExecutor, layout: EditorGroupLayout): Thenable<any> {
		return executor.executeCommand('layoutEditorGroups', layout);
	}
}
CommandsRegistry.registerCommand(SetEditorLayoutAPICommand.ID, adjustHandler(SetEditorLayoutAPICommand.execute));