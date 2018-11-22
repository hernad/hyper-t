/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { flatten } from 'base/common/arrays';
import { AsyncEmitter, Emitter, Event } from 'base/common/event';
import { IRelativePattern, parse } from 'base/common/glob';
import { URI, UriComponents } from 'base/common/uri';
import { ExtHostDocumentsAndEditors } from 'workbench/api/node/extHostDocumentsAndEditors';
import { IExtensionDescription } from 'workbench/services/extensions/common/extensions';
import * as hypert from 'hypert';
import { ExtHostFileSystemEventServiceShape, FileSystemEvents, IMainContext, MainContext, ResourceFileEditDto, ResourceTextEditDto, MainThreadTextEditorsShape } from './extHost.protocol';
import * as typeConverter from './extHostTypeConverters';
import { Disposable, WorkspaceEdit } from './extHostTypes';

class FileSystemWatcher implements hypert.FileSystemWatcher {

	private _onDidCreate = new Emitter<hypert.Uri>();
	private _onDidChange = new Emitter<hypert.Uri>();
	private _onDidDelete = new Emitter<hypert.Uri>();
	private _disposable: Disposable;
	private _config: number;

	get ignoreCreateEvents(): boolean {
		return Boolean(this._config & 0b001);
	}

	get ignoreChangeEvents(): boolean {
		return Boolean(this._config & 0b010);
	}

	get ignoreDeleteEvents(): boolean {
		return Boolean(this._config & 0b100);
	}

	constructor(dispatcher: Event<FileSystemEvents>, globPattern: string | IRelativePattern, ignoreCreateEvents?: boolean, ignoreChangeEvents?: boolean, ignoreDeleteEvents?: boolean) {

		this._config = 0;
		if (ignoreCreateEvents) {
			this._config += 0b001;
		}
		if (ignoreChangeEvents) {
			this._config += 0b010;
		}
		if (ignoreDeleteEvents) {
			this._config += 0b100;
		}

		const parsedPattern = parse(globPattern);

		let subscription = dispatcher(events => {
			if (!ignoreCreateEvents) {
				for (let created of events.created) {
					let uri = URI.revive(created);
					if (parsedPattern(uri.fsPath)) {
						this._onDidCreate.fire(uri);
					}
				}
			}
			if (!ignoreChangeEvents) {
				for (let changed of events.changed) {
					let uri = URI.revive(changed);
					if (parsedPattern(uri.fsPath)) {
						this._onDidChange.fire(uri);
					}
				}
			}
			if (!ignoreDeleteEvents) {
				for (let deleted of events.deleted) {
					let uri = URI.revive(deleted);
					if (parsedPattern(uri.fsPath)) {
						this._onDidDelete.fire(uri);
					}
				}
			}
		});

		this._disposable = Disposable.from(this._onDidCreate, this._onDidChange, this._onDidDelete, subscription);
	}

	dispose() {
		this._disposable.dispose();
	}

	get onDidCreate(): Event<hypert.Uri> {
		return this._onDidCreate.event;
	}

	get onDidChange(): Event<hypert.Uri> {
		return this._onDidChange.event;
	}

	get onDidDelete(): Event<hypert.Uri> {
		return this._onDidDelete.event;
	}
}

interface WillRenameListener {
	extension: IExtensionDescription;
	(e: hypert.FileWillRenameEvent): any;
}

export class ExtHostFileSystemEventService implements ExtHostFileSystemEventServiceShape {

	private readonly _onFileEvent = new Emitter<FileSystemEvents>();
	private readonly _onDidRenameFile = new Emitter<hypert.FileRenameEvent>();
	private readonly _onWillRenameFile = new AsyncEmitter<hypert.FileWillRenameEvent>();

	readonly onDidRenameFile: Event<hypert.FileRenameEvent> = this._onDidRenameFile.event;

	constructor(
		mainContext: IMainContext,
		private readonly _extHostDocumentsAndEditors: ExtHostDocumentsAndEditors,
		private readonly _mainThreadTextEditors: MainThreadTextEditorsShape = mainContext.getProxy(MainContext.MainThreadTextEditors)
	) {
		//
	}

	public createFileSystemWatcher(globPattern: string | IRelativePattern, ignoreCreateEvents?: boolean, ignoreChangeEvents?: boolean, ignoreDeleteEvents?: boolean): hypert.FileSystemWatcher {
		return new FileSystemWatcher(this._onFileEvent.event, globPattern, ignoreCreateEvents, ignoreChangeEvents, ignoreDeleteEvents);
	}

	$onFileEvent(events: FileSystemEvents) {
		this._onFileEvent.fire(events);
	}

	$onFileRename(oldUri: UriComponents, newUri: UriComponents) {
		this._onDidRenameFile.fire(Object.freeze({ oldUri: URI.revive(oldUri), newUri: URI.revive(newUri) }));
	}

	getOnWillRenameFileEvent(extension: IExtensionDescription): Event<hypert.FileWillRenameEvent> {
		return (listener, thisArg, disposables) => {
			let wrappedListener = <WillRenameListener><any>function () {
				listener.apply(thisArg, arguments);
			};
			wrappedListener.extension = extension;
			return this._onWillRenameFile.event(wrappedListener, undefined, disposables);
		};
	}

	$onWillRename(oldUriDto: UriComponents, newUriDto: UriComponents): Thenable<any> {
		const oldUri = URI.revive(oldUriDto);
		const newUri = URI.revive(newUriDto);

		const edits: WorkspaceEdit[] = [];
		return Promise.resolve(this._onWillRenameFile.fireAsync((bucket, _listener) => {
			return {
				oldUri,
				newUri,
				waitUntil: (thenable: Thenable<hypert.WorkspaceEdit>): void => {
					if (Object.isFrozen(bucket)) {
						throw new TypeError('waitUntil cannot be called async');
					}
					const index = bucket.length;
					const wrappedThenable = Promise.resolve(thenable).then(result => {
						// ignore all results except for WorkspaceEdits. Those
						// are stored in a spare array
						if (result instanceof WorkspaceEdit) {
							edits[index] = result;
						}
					});
					bucket.push(wrappedThenable);
				}
			};
		}).then(() => {
			if (edits.length === 0) {
				return undefined;
			}
			// flatten all WorkspaceEdits collected via waitUntil-call
			// and apply them in one go.
			let allEdits = new Array<(ResourceFileEditDto | ResourceTextEditDto)[]>();
			for (let edit of edits) {
				if (edit) { // sparse array
					let { edits } = typeConverter.WorkspaceEdit.from(edit, this._extHostDocumentsAndEditors);
					allEdits.push(edits);
				}
			}
			return this._mainThreadTextEditors.$tryApplyWorkspaceEdit({ edits: flatten(allEdits) });
		}));
	}
}
