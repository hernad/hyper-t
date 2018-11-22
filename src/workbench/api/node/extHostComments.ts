/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { asThenable } from 'base/common/async';
import { URI, UriComponents } from 'base/common/uri';
import * as modes from 'editor/common/modes';
import { ExtHostDocuments } from 'workbench/api/node/extHostDocuments';
import * as extHostTypeConverter from 'workbench/api/node/extHostTypeConverters';
import * as hypert from 'hypert';
import { ExtHostCommentsShape, IMainContext, MainContext, MainThreadCommentsShape } from './extHost.protocol';
import { CommandsConverter } from './extHostCommands';
import { IRange } from 'editor/common/core/range';
import { CancellationToken } from 'base/common/cancellation';

export class ExtHostComments implements ExtHostCommentsShape {
	private static handlePool = 0;

	private _proxy: MainThreadCommentsShape;

	private _documentProviders = new Map<number, hypert.DocumentCommentProvider>();
	private _workspaceProviders = new Map<number, hypert.WorkspaceCommentProvider>();

	constructor(
		mainContext: IMainContext,
		private readonly _commandsConverter: CommandsConverter,
		private readonly _documents: ExtHostDocuments,
	) {
		this._proxy = mainContext.getProxy(MainContext.MainThreadComments);
	}

	registerWorkspaceCommentProvider(
		extensionId: string,
		provider: hypert.WorkspaceCommentProvider
	): hypert.Disposable {
		const handle = ExtHostComments.handlePool++;
		this._workspaceProviders.set(handle, provider);
		this._proxy.$registerWorkspaceCommentProvider(handle, extensionId);
		this.registerListeners(handle, provider);

		return {
			dispose: () => {
				this._proxy.$unregisterWorkspaceCommentProvider(handle);
				this._workspaceProviders.delete(handle);
			}
		};
	}

	registerDocumentCommentProvider(
		provider: hypert.DocumentCommentProvider
	): hypert.Disposable {
		const handle = ExtHostComments.handlePool++;
		this._documentProviders.set(handle, provider);
		this._proxy.$registerDocumentCommentProvider(handle);
		this.registerListeners(handle, provider);

		return {
			dispose: () => {
				this._proxy.$unregisterDocumentCommentProvider(handle);
				this._documentProviders.delete(handle);
			}
		};
	}

	$createNewCommentThread(handle: number, uri: UriComponents, range: IRange, text: string): Thenable<modes.CommentThread> {
		const data = this._documents.getDocumentData(URI.revive(uri));
		const ran = <hypert.Range>extHostTypeConverter.Range.to(range);

		if (!data || !data.document) {
			return Promise.resolve(null);
		}

		const provider = this._documentProviders.get(handle);
		return asThenable(() => {
			return provider.createNewCommentThread(data.document, ran, text, CancellationToken.None);
		}).then(commentThread => commentThread ? convertToCommentThread(provider, commentThread, this._commandsConverter) : null);
	}

	$replyToCommentThread(handle: number, uri: UriComponents, range: IRange, thread: modes.CommentThread, text: string): Thenable<modes.CommentThread> {
		const data = this._documents.getDocumentData(URI.revive(uri));
		const ran = <hypert.Range>extHostTypeConverter.Range.to(range);

		if (!data || !data.document) {
			return Promise.resolve(null);
		}

		const provider = this._documentProviders.get(handle);
		return asThenable(() => {
			return provider.replyToCommentThread(data.document, ran, convertFromCommentThread(thread), text, CancellationToken.None);
		}).then(commentThread => commentThread ? convertToCommentThread(provider, commentThread, this._commandsConverter) : null);
	}

	$editComment(handle: number, uri: UriComponents, comment: modes.Comment, text: string): Thenable<void> {
		const data = this._documents.getDocumentData(URI.revive(uri));

		if (!data || !data.document) {
			throw new Error('Unable to retrieve document from URI');
		}

		const provider = this._documentProviders.get(handle);
		return asThenable(() => {
			return provider.editComment(data.document, convertFromComment(comment), text, CancellationToken.None);
		});
	}

	$deleteComment(handle: number, uri: UriComponents, comment: modes.Comment): Thenable<void> {
		const data = this._documents.getDocumentData(URI.revive(uri));

		if (!data || !data.document) {
			throw new Error('Unable to retrieve document from URI');
		}

		const provider = this._documentProviders.get(handle);
		return asThenable(() => {
			return provider.deleteComment(data.document, convertFromComment(comment), CancellationToken.None);
		});
	}

	$provideDocumentComments(handle: number, uri: UriComponents): Thenable<modes.CommentInfo> {
		const data = this._documents.getDocumentData(URI.revive(uri));
		if (!data || !data.document) {
			return Promise.resolve(null);
		}

		const provider = this._documentProviders.get(handle);
		return asThenable(() => {
			return provider.provideDocumentComments(data.document, CancellationToken.None);
		}).then(commentInfo => commentInfo ? convertCommentInfo(handle, provider, commentInfo, this._commandsConverter) : null);
	}

	$provideWorkspaceComments(handle: number): Thenable<modes.CommentThread[]> {
		const provider = this._workspaceProviders.get(handle);
		if (!provider) {
			return Promise.resolve(null);
		}

		return asThenable(() => {
			return provider.provideWorkspaceComments(CancellationToken.None);
		}).then(comments =>
			comments.map(comment => convertToCommentThread(provider, comment, this._commandsConverter)
			));
	}

	private registerListeners(handle: number, provider: hypert.DocumentCommentProvider | hypert.WorkspaceCommentProvider) {
		provider.onDidChangeCommentThreads(event => {

			this._proxy.$onDidCommentThreadsChange(handle, {
				changed: event.changed.map(thread => convertToCommentThread(provider, thread, this._commandsConverter)),
				added: event.added.map(thread => convertToCommentThread(provider, thread, this._commandsConverter)),
				removed: event.removed.map(thread => convertToCommentThread(provider, thread, this._commandsConverter))
			});
		});
	}
}

function convertCommentInfo(owner: number, provider: hypert.DocumentCommentProvider, vscodeCommentInfo: hypert.CommentInfo, commandsConverter: CommandsConverter): modes.CommentInfo {
	return {
		threads: vscodeCommentInfo.threads.map(x => convertToCommentThread(provider, x, commandsConverter)),
		commentingRanges: vscodeCommentInfo.commentingRanges ? vscodeCommentInfo.commentingRanges.map(range => extHostTypeConverter.Range.from(range)) : []
	};
}

function convertToCommentThread(provider: hypert.DocumentCommentProvider | hypert.WorkspaceCommentProvider, vscodeCommentThread: hypert.CommentThread, commandsConverter: CommandsConverter): modes.CommentThread {
	return {
		threadId: vscodeCommentThread.threadId,
		resource: vscodeCommentThread.resource.toString(),
		range: extHostTypeConverter.Range.from(vscodeCommentThread.range),
		comments: vscodeCommentThread.comments.map(comment => convertToComment(provider, comment, commandsConverter)),
		collapsibleState: vscodeCommentThread.collapsibleState
	};
}

function convertFromCommentThread(commentThread: modes.CommentThread): hypert.CommentThread {
	return {
		threadId: commentThread.threadId,
		resource: URI.parse(commentThread.resource),
		range: extHostTypeConverter.Range.to(commentThread.range),
		comments: commentThread.comments.map(convertFromComment),
		collapsibleState: commentThread.collapsibleState
	};
}

function convertFromComment(comment: modes.Comment): hypert.Comment {
	let userIconPath: URI;
	if (comment.userIconPath) {
		try {
			userIconPath = URI.parse(comment.userIconPath);
		} catch (e) {
			// Ignore
		}
	}

	return {
		commentId: comment.commentId,
		body: extHostTypeConverter.MarkdownString.to(comment.body),
		userName: comment.userName,
		userIconPath: userIconPath,
		canEdit: comment.canEdit,
		canDelete: comment.canDelete
	};
}

function convertToComment(provider: hypert.DocumentCommentProvider | hypert.WorkspaceCommentProvider, vscodeComment: hypert.Comment, commandsConverter: CommandsConverter): modes.Comment {
	const canEdit = !!(provider as hypert.DocumentCommentProvider).editComment && vscodeComment.canEdit;
	const canDelete = !!(provider as hypert.DocumentCommentProvider).deleteComment && vscodeComment.canDelete;
	const iconPath = vscodeComment.userIconPath ? vscodeComment.userIconPath.toString() : vscodeComment.gravatar;
	return {
		commentId: vscodeComment.commentId,
		body: extHostTypeConverter.MarkdownString.from(vscodeComment.body),
		userName: vscodeComment.userName,
		userIconPath: iconPath,
		canEdit: canEdit,
		canDelete: canDelete,
		command: vscodeComment.command ? commandsConverter.toInternal(vscodeComment.command) : null
	};
}
