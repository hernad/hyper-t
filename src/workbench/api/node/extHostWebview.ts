/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Emitter, Event } from 'base/common/event';
import { URI } from 'base/common/uri';
import * as typeConverters from 'workbench/api/node/extHostTypeConverters';
import { EditorViewColumn } from 'workbench/api/shared/editor';
import * as hypert from 'hypert';
import { ExtHostWebviewsShape, IMainContext, MainContext, MainThreadWebviewsShape, WebviewPanelHandle, WebviewPanelViewState } from './extHost.protocol';
import { Disposable } from './extHostTypes';
import { IExtensionDescription } from 'workbench/services/extensions/common/extensions';

type IconPath = URI | { light: URI, dark: URI };

export class ExtHostWebview implements hypert.Webview {
	private readonly _handle: WebviewPanelHandle;
	private readonly _proxy: MainThreadWebviewsShape;
	private _html: string;
	private _options: hypert.WebviewOptions;
	private _isDisposed: boolean = false;

	public readonly _onMessageEmitter = new Emitter<any>();
	public readonly onDidReceiveMessage: Event<any> = this._onMessageEmitter.event;

	constructor(
		handle: WebviewPanelHandle,
		proxy: MainThreadWebviewsShape,
		options: hypert.WebviewOptions
	) {
		this._handle = handle;
		this._proxy = proxy;
		this._options = options;
	}

	public dispose() {
		this._onMessageEmitter.dispose();
	}

	public get html(): string {
		this.assertNotDisposed();
		return this._html;
	}

	public set html(value: string) {
		this.assertNotDisposed();
		if (this._html !== value) {
			this._html = value;
			this._proxy.$setHtml(this._handle, value);
		}
	}

	public get options(): hypert.WebviewOptions {
		this.assertNotDisposed();
		return this._options;
	}

	public set options(newOptions: hypert.WebviewOptions) {
		this.assertNotDisposed();
		this._proxy.$setOptions(this._handle, newOptions);
		this._options = newOptions;
	}

	public postMessage(message: any): Thenable<boolean> {
		this.assertNotDisposed();
		return this._proxy.$postMessage(this._handle, message);
	}

	private assertNotDisposed() {
		if (this._isDisposed) {
			throw new Error('Webview is disposed');
		}
	}
}

export class ExtHostWebviewPanel implements hypert.WebviewPanel {

	private readonly _handle: WebviewPanelHandle;
	private readonly _proxy: MainThreadWebviewsShape;
	private readonly _viewType: string;
	private _title: string;
	private _iconPath: IconPath;

	private readonly _options: hypert.WebviewPanelOptions;
	private readonly _webview: ExtHostWebview;
	private _isDisposed: boolean = false;
	private _viewColumn: hypert.ViewColumn;
	private _visible: boolean = true;
	private _active: boolean = true;

	readonly _onDisposeEmitter = new Emitter<void>();
	public readonly onDidDispose: Event<void> = this._onDisposeEmitter.event;

	readonly _onDidChangeViewStateEmitter = new Emitter<hypert.WebviewPanelOnDidChangeViewStateEvent>();
	public readonly onDidChangeViewState: Event<hypert.WebviewPanelOnDidChangeViewStateEvent> = this._onDidChangeViewStateEmitter.event;


	constructor(
		handle: WebviewPanelHandle,
		proxy: MainThreadWebviewsShape,
		viewType: string,
		title: string,
		viewColumn: hypert.ViewColumn,
		editorOptions: hypert.WebviewPanelOptions,
		webview: ExtHostWebview
	) {
		this._handle = handle;
		this._proxy = proxy;
		this._viewType = viewType;
		this._options = editorOptions;
		this._viewColumn = viewColumn;
		this._title = title;
		this._webview = webview;
	}

	public dispose() {
		if (this._isDisposed) {
			return;
		}

		this._isDisposed = true;
		this._onDisposeEmitter.fire();

		this._proxy.$disposeWebview(this._handle);

		this._webview.dispose();

		this._onDisposeEmitter.dispose();
		this._onDidChangeViewStateEmitter.dispose();
	}

	get webview() {
		this.assertNotDisposed();
		return this._webview;
	}

	get viewType(): string {
		this.assertNotDisposed();
		return this._viewType;
	}

	get title(): string {
		this.assertNotDisposed();
		return this._title;
	}

	set title(value: string) {
		this.assertNotDisposed();
		if (this._title !== value) {
			this._title = value;
			this._proxy.$setTitle(this._handle, value);
		}
	}

	get iconPath(): IconPath | undefined {
		this.assertNotDisposed();
		return this._iconPath;
	}

	set iconPath(value: IconPath | undefined) {
		this.assertNotDisposed();
		if (this._iconPath !== value) {
			this._iconPath = value;

			this._proxy.$setIconPath(this._handle, URI.isUri(value) ? { light: value, dark: value } : value);
		}
	}

	get options() {
		return this._options;
	}

	get viewColumn(): hypert.ViewColumn {
		this.assertNotDisposed();
		return this._viewColumn;
	}

	_setViewColumn(value: hypert.ViewColumn) {
		this.assertNotDisposed();
		this._viewColumn = value;
	}

	public get active(): boolean {
		this.assertNotDisposed();
		return this._active;
	}

	_setActive(value: boolean) {
		this.assertNotDisposed();
		this._active = value;
	}

	public get visible(): boolean {
		this.assertNotDisposed();
		return this._visible;
	}

	_setVisible(value: boolean) {
		this.assertNotDisposed();
		this._visible = value;
	}

	public postMessage(message: any): Thenable<boolean> {
		this.assertNotDisposed();
		return this._proxy.$postMessage(this._handle, message);
	}

	public reveal(viewColumn?: hypert.ViewColumn, preserveFocus?: boolean): void {
		this.assertNotDisposed();
		this._proxy.$reveal(this._handle, {
			viewColumn: viewColumn ? typeConverters.ViewColumn.from(viewColumn) : undefined,
			preserveFocus: !!preserveFocus
		});
	}

	private assertNotDisposed() {
		if (this._isDisposed) {
			throw new Error('Webview is disposed');
		}
	}
}

export class ExtHostWebviews implements ExtHostWebviewsShape {
	private static webviewHandlePool = 1;

	private static newHandle(): WebviewPanelHandle {
		return ExtHostWebviews.webviewHandlePool++ + '';
	}

	private readonly _proxy: MainThreadWebviewsShape;
	private readonly _webviewPanels = new Map<WebviewPanelHandle, ExtHostWebviewPanel>();
	private readonly _serializers = new Map<string, hypert.WebviewPanelSerializer>();

	constructor(
		mainContext: IMainContext
	) {
		this._proxy = mainContext.getProxy(MainContext.MainThreadWebviews);
	}

	public createWebview(
		extension: IExtensionDescription,
		viewType: string,
		title: string,
		showOptions: hypert.ViewColumn | { viewColumn: hypert.ViewColumn, preserveFocus?: boolean },
		options: (hypert.WebviewPanelOptions & hypert.WebviewOptions) = {},
	): hypert.WebviewPanel {
		const viewColumn = typeof showOptions === 'object' ? showOptions.viewColumn : showOptions;
		const webviewShowOptions = {
			viewColumn: typeConverters.ViewColumn.from(viewColumn),
			preserveFocus: typeof showOptions === 'object' && !!showOptions.preserveFocus
		};

		const handle = ExtHostWebviews.newHandle();
		this._proxy.$createWebviewPanel(handle, viewType, title, webviewShowOptions, options, extension.id, extension.extensionLocation);

		const webview = new ExtHostWebview(handle, this._proxy, options);
		const panel = new ExtHostWebviewPanel(handle, this._proxy, viewType, title, viewColumn, options, webview);
		this._webviewPanels.set(handle, panel);
		return panel;
	}

	public registerWebviewPanelSerializer(
		viewType: string,
		serializer: hypert.WebviewPanelSerializer
	): hypert.Disposable {
		if (this._serializers.has(viewType)) {
			throw new Error(`Serializer for '${viewType}' already registered`);
		}

		this._serializers.set(viewType, serializer);
		this._proxy.$registerSerializer(viewType);

		return new Disposable(() => {
			this._serializers.delete(viewType);
			this._proxy.$unregisterSerializer(viewType);
		});
	}

	public $onMessage(
		handle: WebviewPanelHandle,
		message: any
	): void {
		const panel = this.getWebviewPanel(handle);
		if (panel) {
			panel.webview._onMessageEmitter.fire(message);
		}
	}

	public $onDidChangeWebviewPanelViewState(
		handle: WebviewPanelHandle,
		newState: WebviewPanelViewState
	): void {
		const panel = this.getWebviewPanel(handle);
		if (!panel) {
			return;
		}

		const viewColumn = typeConverters.ViewColumn.to(newState.position);
		if (panel.active !== newState.active || panel.visible !== newState.visible || panel.viewColumn !== viewColumn) {
			panel._setActive(newState.active);
			panel._setVisible(newState.visible);
			panel._setViewColumn(viewColumn);
			panel._onDidChangeViewStateEmitter.fire({ webviewPanel: panel });
		}
	}

	$onDidDisposeWebviewPanel(handle: WebviewPanelHandle): Thenable<void> {
		const panel = this.getWebviewPanel(handle);
		if (panel) {
			panel.dispose();
			this._webviewPanels.delete(handle);
		}
		return Promise.resolve(void 0);
	}

	$deserializeWebviewPanel(
		webviewHandle: WebviewPanelHandle,
		viewType: string,
		title: string,
		state: any,
		position: EditorViewColumn,
		options: hypert.WebviewOptions & hypert.WebviewPanelOptions
	): Thenable<void> {
		const serializer = this._serializers.get(viewType);
		if (!serializer) {
			return Promise.reject(new Error(`No serializer found for '${viewType}'`));
		}

		const webview = new ExtHostWebview(webviewHandle, this._proxy, options);
		const revivedPanel = new ExtHostWebviewPanel(webviewHandle, this._proxy, viewType, title, typeConverters.ViewColumn.to(position), options, webview);
		this._webviewPanels.set(webviewHandle, revivedPanel);
		return serializer.deserializeWebviewPanel(revivedPanel, state);
	}

	private getWebviewPanel(handle: WebviewPanelHandle): ExtHostWebviewPanel | undefined {
		return this._webviewPanels.get(handle);
	}
}
