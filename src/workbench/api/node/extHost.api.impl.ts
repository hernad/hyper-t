/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from 'base/nls';
import { CancellationTokenSource } from 'base/common/cancellation';
import * as errors from 'base/common/errors';
import { Emitter } from 'base/common/event';
import { TernarySearchTree } from 'base/common/map';
import * as paths from 'base/common/paths';
import * as platform from 'base/common/platform';
import Severity from 'base/common/severity';
import { URI } from 'base/common/uri';
import { TextEditorCursorStyle } from 'editor/common/config/editorOptions';
import { OverviewRulerLane } from 'editor/common/model';
import * as languageConfiguration from 'editor/common/modes/languageConfiguration';
import { score } from 'editor/common/modes/languageSelector';
import * as files from 'platform/files/common/files';
import pkg from 'platform/node/package';
import product from 'platform/node/product';
import { ExtHostContext, IInitData, IMainContext, MainContext } from 'workbench/api/node/extHost.protocol';
import { ExtHostApiCommands } from 'workbench/api/node/extHostApiCommands';
import { ExtHostClipboard } from 'workbench/api/node/extHostClipboard';
import { ExtHostCommands } from 'workbench/api/node/extHostCommands';
import { ExtHostComments } from 'workbench/api/node/extHostComments';
import { ExtHostConfiguration } from 'workbench/api/node/extHostConfiguration';
// import { ExtHostDebugService } from 'workbench/api/node/extHostDebugService'; hernad out-debug
import { ExtHostDecorations } from 'workbench/api/node/extHostDecorations';
import { ExtHostDiagnostics } from 'workbench/api/node/extHostDiagnostics';
import { ExtHostDialogs } from 'workbench/api/node/extHostDialogs';
import { ExtHostDocumentContentProvider } from 'workbench/api/node/extHostDocumentContentProviders';
import { ExtHostDocumentSaveParticipant } from 'workbench/api/node/extHostDocumentSaveParticipant';
import { ExtHostDocuments } from 'workbench/api/node/extHostDocuments';
import { ExtHostDocumentsAndEditors } from 'workbench/api/node/extHostDocumentsAndEditors';
import { ExtensionActivatedByAPI } from 'workbench/api/node/extHostExtensionActivator';
import { ExtHostExtensionService } from 'workbench/api/node/extHostExtensionService';
import { ExtHostFileSystem } from 'workbench/api/node/extHostFileSystem';
import { ExtHostFileSystemEventService } from 'workbench/api/node/extHostFileSystemEventService';
import { ExtHostHeapService } from 'workbench/api/node/extHostHeapService';
import { ExtHostLanguageFeatures, ISchemeTransformer } from 'workbench/api/node/extHostLanguageFeatures';
import { ExtHostLanguages } from 'workbench/api/node/extHostLanguages';
import { ExtHostLogService } from 'workbench/api/node/extHostLogService';
import { ExtHostMessageService } from 'workbench/api/node/extHostMessageService';
import { ExtHostOutputService } from 'workbench/api/node/extHostOutputService';
import { ExtHostProgress } from 'workbench/api/node/extHostProgress';
import { ExtHostQuickOpen } from 'workbench/api/node/extHostQuickOpen';
import { ExtHostSCM } from 'workbench/api/node/extHostSCM';
import { ExtHostSearch } from 'workbench/api/node/extHostSearch';
import { ExtHostStatusBar } from 'workbench/api/node/extHostStatusBar';
import { ExtHostStorage } from 'workbench/api/node/extHostStorage';
import { ExtHostTask } from 'workbench/api/node/extHostTask';
import { ExtHostTerminalService } from 'workbench/api/node/extHostTerminalService';
import { ExtHostEditors } from 'workbench/api/node/extHostTextEditors';
import { ExtHostTreeViews } from 'workbench/api/node/extHostTreeViews';
import * as typeConverters from 'workbench/api/node/extHostTypeConverters';
import * as extHostTypes from 'workbench/api/node/extHostTypes';
import { ExtHostUrls } from 'workbench/api/node/extHostUrls';
import { ExtHostWebviews } from 'workbench/api/node/extHostWebview';
import { ExtHostWindow } from 'workbench/api/node/extHostWindow';
import { ExtHostWorkspace } from 'workbench/api/node/extHostWorkspace';
import { IExtensionDescription, throwProposedApiError, checkProposedApiEnabled, nullExtensionDescription } from 'workbench/services/extensions/common/extensions';
import { ProxyIdentifier } from 'workbench/services/extensions/node/proxyIdentifier';
import * as hypert from 'hypert';

export interface IExtensionApiFactory {
	(extension: IExtensionDescription): typeof hypert;
}

function proposedApiFunction<T>(extension: IExtensionDescription, fn: T): T {
	if (extension.enableProposedApi) {
		return fn;
	} else {
		return throwProposedApiError.bind(null, extension);
	}
}

/**
 * This method instantiates and returns the extension API surface
 */
export function createApiFactory(
	initData: IInitData,
	rpcProtocol: IMainContext,
	extHostWorkspace: ExtHostWorkspace,
	extHostConfiguration: ExtHostConfiguration,
	extensionService: ExtHostExtensionService,
	extHostLogService: ExtHostLogService,
	extHostStorage: ExtHostStorage
): IExtensionApiFactory {

	let schemeTransformer: ISchemeTransformer | null = null;

	// Addressable instances
	rpcProtocol.set(ExtHostContext.ExtHostLogService, extHostLogService);
	const extHostHeapService = rpcProtocol.set(ExtHostContext.ExtHostHeapService, new ExtHostHeapService());
	const extHostDecorations = rpcProtocol.set(ExtHostContext.ExtHostDecorations, new ExtHostDecorations(rpcProtocol));
	const extHostWebviews = rpcProtocol.set(ExtHostContext.ExtHostWebviews, new ExtHostWebviews(rpcProtocol));
	const extHostUrls = rpcProtocol.set(ExtHostContext.ExtHostUrls, new ExtHostUrls(rpcProtocol));
	const extHostDocumentsAndEditors = rpcProtocol.set(ExtHostContext.ExtHostDocumentsAndEditors, new ExtHostDocumentsAndEditors(rpcProtocol));
	const extHostDocuments = rpcProtocol.set(ExtHostContext.ExtHostDocuments, new ExtHostDocuments(rpcProtocol, extHostDocumentsAndEditors));
	const extHostDocumentContentProviders = rpcProtocol.set(ExtHostContext.ExtHostDocumentContentProviders, new ExtHostDocumentContentProvider(rpcProtocol, extHostDocumentsAndEditors, extHostLogService));
	const extHostDocumentSaveParticipant = rpcProtocol.set(ExtHostContext.ExtHostDocumentSaveParticipant, new ExtHostDocumentSaveParticipant(extHostLogService, extHostDocuments, rpcProtocol.getProxy(MainContext.MainThreadTextEditors)));
	const extHostEditors = rpcProtocol.set(ExtHostContext.ExtHostEditors, new ExtHostEditors(rpcProtocol, extHostDocumentsAndEditors));
	const extHostCommands = rpcProtocol.set(ExtHostContext.ExtHostCommands, new ExtHostCommands(rpcProtocol, extHostHeapService, extHostLogService));
	const extHostTreeViews = rpcProtocol.set(ExtHostContext.ExtHostTreeViews, new ExtHostTreeViews(rpcProtocol.getProxy(MainContext.MainThreadTreeViews), extHostCommands, extHostLogService));
	rpcProtocol.set(ExtHostContext.ExtHostWorkspace, extHostWorkspace);
	rpcProtocol.set(ExtHostContext.ExtHostConfiguration, extHostConfiguration);
	const extHostDiagnostics = rpcProtocol.set(ExtHostContext.ExtHostDiagnostics, new ExtHostDiagnostics(rpcProtocol));
	const extHostLanguageFeatures = rpcProtocol.set(ExtHostContext.ExtHostLanguageFeatures, new ExtHostLanguageFeatures(rpcProtocol, schemeTransformer, extHostDocuments, extHostCommands, extHostHeapService, extHostDiagnostics, extHostLogService));
	const extHostFileSystem = rpcProtocol.set(ExtHostContext.ExtHostFileSystem, new ExtHostFileSystem(rpcProtocol, extHostLanguageFeatures));
	const extHostFileSystemEvent = rpcProtocol.set(ExtHostContext.ExtHostFileSystemEventService, new ExtHostFileSystemEventService(rpcProtocol, extHostDocumentsAndEditors));
	const extHostQuickOpen = rpcProtocol.set(ExtHostContext.ExtHostQuickOpen, new ExtHostQuickOpen(rpcProtocol, extHostWorkspace, extHostCommands));
	const extHostTerminalService = rpcProtocol.set(ExtHostContext.ExtHostTerminalService, new ExtHostTerminalService(rpcProtocol, extHostConfiguration, extHostLogService));
	// const extHostDebugService = rpcProtocol.set(ExtHostContext.ExtHostDebugService, new ExtHostDebugService(rpcProtocol, extHostWorkspace, extensionService, extHostDocumentsAndEditors, extHostConfiguration, extHostTerminalService, extHostCommands));  hernad out-debug
	const extHostSCM = rpcProtocol.set(ExtHostContext.ExtHostSCM, new ExtHostSCM(rpcProtocol, extHostCommands, extHostLogService));
	const extHostSearch = rpcProtocol.set(ExtHostContext.ExtHostSearch, new ExtHostSearch(rpcProtocol, schemeTransformer, extHostLogService, extHostConfiguration));
	const extHostTask = rpcProtocol.set(ExtHostContext.ExtHostTask, new ExtHostTask(rpcProtocol, extHostWorkspace, extHostDocumentsAndEditors, extHostConfiguration));
	const extHostWindow = rpcProtocol.set(ExtHostContext.ExtHostWindow, new ExtHostWindow(rpcProtocol));
	rpcProtocol.set(ExtHostContext.ExtHostExtensionService, extensionService);
	const extHostProgress = rpcProtocol.set(ExtHostContext.ExtHostProgress, new ExtHostProgress(rpcProtocol.getProxy(MainContext.MainThreadProgress)));
	const exthostCommentProviders = rpcProtocol.set(ExtHostContext.ExtHostComments, new ExtHostComments(rpcProtocol, extHostCommands.converter, extHostDocuments));
	const extHostOutputService = rpcProtocol.set(ExtHostContext.ExtHostOutputService, new ExtHostOutputService(initData.logsLocation, rpcProtocol));
	rpcProtocol.set(ExtHostContext.ExtHostStorage, extHostStorage);

	// Check that no named customers are missing
	const expected: ProxyIdentifier<any>[] = Object.keys(ExtHostContext).map((key) => (<any>ExtHostContext)[key]);
	rpcProtocol.assertRegistered(expected);

	// Other instances
	const extHostClipboard = new ExtHostClipboard(rpcProtocol);
	const extHostMessageService = new ExtHostMessageService(rpcProtocol);
	const extHostDialogs = new ExtHostDialogs(rpcProtocol);
	const extHostStatusBar = new ExtHostStatusBar(rpcProtocol);
	const extHostLanguages = new ExtHostLanguages(rpcProtocol, extHostDocuments);

	// Register an output channel for exthost log
	const name = localize('extensionsLog', "Extension Host");
	extHostOutputService.createOutputChannelFromLogFile(name, extHostLogService.logFile);

	// Register API-ish commands
	ExtHostApiCommands.register(extHostCommands);

	return function (extension: IExtensionDescription): typeof hypert {

		// Check document selectors for being overly generic. Technically this isn't a problem but
		// in practice many extensions say they support `fooLang` but need fs-access to do so. Those
		// extension should specify then the `file`-scheme, e.g `{ scheme: 'fooLang', language: 'fooLang' }`
		// We only inform once, it is not a warning because we just want to raise awareness and because
		// we cannot say if the extension is doing it right or wrong...
		const checkSelector = (function () {
			let done = (!extension.isUnderDevelopment);
			function informOnce(selector: hypert.DocumentSelector) {
				if (!done) {
					console.info(`Extension '${extension.id}' uses a document selector without scheme. Learn more about this: https://go.microsoft.com/fwlink/?linkid=872305`);
					done = true;
				}
			}
			return function perform(selector: hypert.DocumentSelector): hypert.DocumentSelector {
				if (Array.isArray(selector)) {
					selector.forEach(perform);
				} else if (typeof selector === 'string') {
					informOnce(selector);
				} else {
					if (typeof selector.scheme === 'undefined') {
						informOnce(selector);
					}
					if (!extension.enableProposedApi && typeof selector.exclusive === 'boolean') {
						throwProposedApiError(extension);
					}
				}
				return selector;
			};
		})();

		// Warn when trying to use the hypert.previewHtml command as it does not work properly in all scenarios and
		// has security concerns.
		const checkCommand = (() => {
			let done = !extension.isUnderDevelopment;
			const informOnce = () => {
				if (!done) {
					done = true;
					console.warn(`Extension '${extension.id}' uses the 'hypert.previewHtml' command which is deprecated and will be removed. Please update your extension to use the Webview API: https://go.microsoft.com/fwlink/?linkid=2039309`);
				}
			};
			return (commandId: string) => {
				if (commandId === 'hypert.previewHtml') {
					informOnce();
				}
				return commandId;
			};
		})();

		// namespace: commands
		const commands: typeof hypert.commands = {
			registerCommand(id: string, command: <T>(...args: any[]) => T | Thenable<T>, thisArgs?: any): hypert.Disposable {
				return extHostCommands.registerCommand(true, id, command, thisArgs);
			},
			registerTextEditorCommand(id: string, callback: (textEditor: hypert.TextEditor, edit: hypert.TextEditorEdit, ...args: any[]) => void, thisArg?: any): hypert.Disposable {
				return extHostCommands.registerCommand(true, id, (...args: any[]): any => {
					let activeTextEditor = extHostEditors.getActiveTextEditor();
					if (!activeTextEditor) {
						console.warn('Cannot execute ' + id + ' because there is no active text editor.');
						return undefined;
					}

					return activeTextEditor.edit((edit: hypert.TextEditorEdit) => {
						args.unshift(activeTextEditor, edit);
						callback.apply(thisArg, args);

					}).then((result) => {
						if (!result) {
							console.warn('Edits from command ' + id + ' were not applied.');
						}
					}, (err) => {
						console.warn('An error occurred while running command ' + id, err);
					});
				});
			},
			registerDiffInformationCommand: proposedApiFunction(extension, (id: string, callback: (diff: hypert.LineChange[], ...args: any[]) => any, thisArg?: any): hypert.Disposable => {
				return extHostCommands.registerCommand(true, id, async (...args: any[]) => {
					let activeTextEditor = extHostEditors.getActiveTextEditor();
					if (!activeTextEditor) {
						console.warn('Cannot execute ' + id + ' because there is no active text editor.');
						return undefined;
					}

					const diff = await extHostEditors.getDiffInformation(activeTextEditor.id);
					callback.apply(thisArg, [diff, ...args]);
				});
			}),
			executeCommand<T>(id: string, ...args: any[]): Thenable<T> {
				return extHostCommands.executeCommand<T>(checkCommand(id), ...args);
			},
			getCommands(filterInternal: boolean = false): Thenable<string[]> {
				return extHostCommands.getCommands(filterInternal);
			}
		};

		// namespace: env
		const env: typeof hypert.env = Object.freeze({
			get machineId() { return initData.telemetryInfo.machineId; },
			get sessionId() { return initData.telemetryInfo.sessionId; },
			get language() { return platform.language; },
			get appName() { return product.nameLong; },
			get appRoot() { return initData.environment.appRoot.fsPath; },
			get logLevel() {
				checkProposedApiEnabled(extension);
				return extHostLogService.getLevel();
			},
			get onDidChangeLogLevel() {
				checkProposedApiEnabled(extension);
				return extHostLogService.onDidChangeLogLevel;
			},
			get clipboard(): hypert.Clipboard {
				return extHostClipboard;
			}
		});

		// namespace: extensions
		const extensions: typeof hypert.extensions = {
			getExtension(extensionId: string): Extension<any> {
				let desc = extensionService.getExtensionDescription(extensionId);
				if (desc) {
					return new Extension(extensionService, desc);
				}
				return undefined;
			},
			get all(): Extension<any>[] {
				return extensionService.getAllExtensionDescriptions().map((desc) => new Extension(extensionService, desc));
			}
		};

		// namespace: languages
		const languages: typeof hypert.languages = {
			createDiagnosticCollection(name?: string): hypert.DiagnosticCollection {
				return extHostDiagnostics.createDiagnosticCollection(name);
			},
			get onDidChangeDiagnostics() {
				return extHostDiagnostics.onDidChangeDiagnostics;
			},
			getDiagnostics: (resource?: hypert.Uri) => {
				return <any>extHostDiagnostics.getDiagnostics(resource);
			},
			getLanguages(): Thenable<string[]> {
				return extHostLanguages.getLanguages();
			},
			setTextDocumentLanguage(document: hypert.TextDocument, languageId: string): Thenable<hypert.TextDocument> {
				return extHostLanguages.changeLanguage(document.uri, languageId);
			},
			match(selector: hypert.DocumentSelector, document: hypert.TextDocument): number {
				return score(typeConverters.LanguageSelector.from(selector), document.uri, document.languageId, true);
			},
			registerCodeActionsProvider(selector: hypert.DocumentSelector, provider: hypert.CodeActionProvider, metadata?: hypert.CodeActionProviderMetadata): hypert.Disposable {
				return extHostLanguageFeatures.registerCodeActionProvider(extension, checkSelector(selector), provider, metadata);
			},
			registerCodeLensProvider(selector: hypert.DocumentSelector, provider: hypert.CodeLensProvider): hypert.Disposable {
				return extHostLanguageFeatures.registerCodeLensProvider(extension, checkSelector(selector), provider);
			},
			registerDefinitionProvider(selector: hypert.DocumentSelector, provider: hypert.DefinitionProvider): hypert.Disposable {
				return extHostLanguageFeatures.registerDefinitionProvider(extension, checkSelector(selector), provider);
			},
			registerDeclarationProvider(selector: hypert.DocumentSelector, provider: hypert.DeclarationProvider): hypert.Disposable {
				return extHostLanguageFeatures.registerDeclarationProvider(extension, checkSelector(selector), provider);
			},
			registerImplementationProvider(selector: hypert.DocumentSelector, provider: hypert.ImplementationProvider): hypert.Disposable {
				return extHostLanguageFeatures.registerImplementationProvider(extension, checkSelector(selector), provider);
			},
			registerTypeDefinitionProvider(selector: hypert.DocumentSelector, provider: hypert.TypeDefinitionProvider): hypert.Disposable {
				return extHostLanguageFeatures.registerTypeDefinitionProvider(extension, checkSelector(selector), provider);
			},
			registerHoverProvider(selector: hypert.DocumentSelector, provider: hypert.HoverProvider): hypert.Disposable {
				return extHostLanguageFeatures.registerHoverProvider(extension, checkSelector(selector), provider, extension.id);
			},
			registerDocumentHighlightProvider(selector: hypert.DocumentSelector, provider: hypert.DocumentHighlightProvider): hypert.Disposable {
				return extHostLanguageFeatures.registerDocumentHighlightProvider(extension, checkSelector(selector), provider);
			},
			registerReferenceProvider(selector: hypert.DocumentSelector, provider: hypert.ReferenceProvider): hypert.Disposable {
				return extHostLanguageFeatures.registerReferenceProvider(extension, checkSelector(selector), provider);
			},
			registerRenameProvider(selector: hypert.DocumentSelector, provider: hypert.RenameProvider): hypert.Disposable {
				return extHostLanguageFeatures.registerRenameProvider(extension, checkSelector(selector), provider);
			},
			registerDocumentSymbolProvider(selector: hypert.DocumentSelector, provider: hypert.DocumentSymbolProvider): hypert.Disposable {
				return extHostLanguageFeatures.registerDocumentSymbolProvider(extension, checkSelector(selector), provider);
			},
			registerWorkspaceSymbolProvider(provider: hypert.WorkspaceSymbolProvider): hypert.Disposable {
				return extHostLanguageFeatures.registerWorkspaceSymbolProvider(extension, provider);
			},
			registerDocumentFormattingEditProvider(selector: hypert.DocumentSelector, provider: hypert.DocumentFormattingEditProvider): hypert.Disposable {
				return extHostLanguageFeatures.registerDocumentFormattingEditProvider(extension, checkSelector(selector), provider);
			},
			registerDocumentRangeFormattingEditProvider(selector: hypert.DocumentSelector, provider: hypert.DocumentRangeFormattingEditProvider): hypert.Disposable {
				return extHostLanguageFeatures.registerDocumentRangeFormattingEditProvider(extension, checkSelector(selector), provider);
			},
			registerOnTypeFormattingEditProvider(selector: hypert.DocumentSelector, provider: hypert.OnTypeFormattingEditProvider, firstTriggerCharacter: string, ...moreTriggerCharacters: string[]): hypert.Disposable {
				return extHostLanguageFeatures.registerOnTypeFormattingEditProvider(extension, checkSelector(selector), provider, [firstTriggerCharacter].concat(moreTriggerCharacters));
			},
			registerSignatureHelpProvider(selector: hypert.DocumentSelector, provider: hypert.SignatureHelpProvider, firstItem?: string | hypert.SignatureHelpProviderMetadata, ...remaining: string[]): hypert.Disposable {
				if (typeof firstItem === 'object') {
					return extHostLanguageFeatures.registerSignatureHelpProvider(extension, checkSelector(selector), provider, firstItem);
				}
				return extHostLanguageFeatures.registerSignatureHelpProvider(extension, checkSelector(selector), provider, typeof firstItem === 'undefined' ? [] : [firstItem, ...remaining]);
			},
			registerCompletionItemProvider(selector: hypert.DocumentSelector, provider: hypert.CompletionItemProvider, ...triggerCharacters: string[]): hypert.Disposable {
				return extHostLanguageFeatures.registerCompletionItemProvider(extension, checkSelector(selector), provider, triggerCharacters);
			},
			registerDocumentLinkProvider(selector: hypert.DocumentSelector, provider: hypert.DocumentLinkProvider): hypert.Disposable {
				return extHostLanguageFeatures.registerDocumentLinkProvider(extension, checkSelector(selector), provider);
			},
			registerColorProvider(selector: hypert.DocumentSelector, provider: hypert.DocumentColorProvider): hypert.Disposable {
				return extHostLanguageFeatures.registerColorProvider(extension, checkSelector(selector), provider);
			},
			registerFoldingRangeProvider(selector: hypert.DocumentSelector, provider: hypert.FoldingRangeProvider): hypert.Disposable {
				return extHostLanguageFeatures.registerFoldingRangeProvider(extension, checkSelector(selector), provider);
			},
			setLanguageConfiguration: (language: string, configuration: hypert.LanguageConfiguration): hypert.Disposable => {
				return extHostLanguageFeatures.setLanguageConfiguration(language, configuration);
			}
		};

		// namespace: window
		const window: typeof hypert.window = {
			get activeTextEditor() {
				return extHostEditors.getActiveTextEditor();
			},
			get visibleTextEditors() {
				return extHostEditors.getVisibleTextEditors();
			},
			get activeTerminal() {
				return extHostTerminalService.activeTerminal;
			},
			get terminals() {
				return extHostTerminalService.terminals;
			},
			showTextDocument(documentOrUri: hypert.TextDocument | hypert.Uri, columnOrOptions?: hypert.ViewColumn | hypert.TextDocumentShowOptions, preserveFocus?: boolean): Thenable<hypert.TextEditor> {
				let documentPromise: Promise<hypert.TextDocument>;
				if (URI.isUri(documentOrUri)) {
					documentPromise = Promise.resolve(workspace.openTextDocument(documentOrUri));
				} else {
					documentPromise = Promise.resolve(<hypert.TextDocument>documentOrUri);
				}
				return documentPromise.then(document => {
					return extHostEditors.showTextDocument(document, columnOrOptions, preserveFocus);
				});
			},
			createTextEditorDecorationType(options: hypert.DecorationRenderOptions): hypert.TextEditorDecorationType {
				return extHostEditors.createTextEditorDecorationType(options);
			},
			onDidChangeActiveTextEditor(listener, thisArg?, disposables?) {
				return extHostEditors.onDidChangeActiveTextEditor(listener, thisArg, disposables);
			},
			onDidChangeVisibleTextEditors(listener, thisArg, disposables) {
				return extHostEditors.onDidChangeVisibleTextEditors(listener, thisArg, disposables);
			},
			onDidChangeTextEditorSelection(listener: (e: hypert.TextEditorSelectionChangeEvent) => any, thisArgs?: any, disposables?: extHostTypes.Disposable[]) {
				return extHostEditors.onDidChangeTextEditorSelection(listener, thisArgs, disposables);
			},
			onDidChangeTextEditorOptions(listener: (e: hypert.TextEditorOptionsChangeEvent) => any, thisArgs?: any, disposables?: extHostTypes.Disposable[]) {
				return extHostEditors.onDidChangeTextEditorOptions(listener, thisArgs, disposables);
			},
			onDidChangeTextEditorVisibleRanges(listener: (e: hypert.TextEditorVisibleRangesChangeEvent) => any, thisArgs?: any, disposables?: extHostTypes.Disposable[]) {
				return extHostEditors.onDidChangeTextEditorVisibleRanges(listener, thisArgs, disposables);
			},
			onDidChangeTextEditorViewColumn(listener, thisArg?, disposables?) {
				return extHostEditors.onDidChangeTextEditorViewColumn(listener, thisArg, disposables);
			},
			onDidCloseTerminal(listener, thisArg?, disposables?) {
				return extHostTerminalService.onDidCloseTerminal(listener, thisArg, disposables);
			},
			onDidOpenTerminal(listener, thisArg?, disposables?) {
				return extHostTerminalService.onDidOpenTerminal(listener, thisArg, disposables);
			},
			onDidChangeActiveTerminal(listener, thisArg?, disposables?) {
				return extHostTerminalService.onDidChangeActiveTerminal(listener, thisArg, disposables);
			},
			get state() {
				return extHostWindow.state;
			},
			onDidChangeWindowState(listener, thisArg?, disposables?) {
				return extHostWindow.onDidChangeWindowState(listener, thisArg, disposables);
			},
			showInformationMessage(message, first, ...rest) {
				return extHostMessageService.showMessage(extension, Severity.Info, message, first, rest);
			},
			showWarningMessage(message, first, ...rest) {
				return extHostMessageService.showMessage(extension, Severity.Warning, message, first, rest);
			},
			showErrorMessage(message, first, ...rest) {
				return extHostMessageService.showMessage(extension, Severity.Error, message, first, rest);
			},
			showQuickPick(items: any, options: hypert.QuickPickOptions, token?: hypert.CancellationToken): any {
				return extHostQuickOpen.showQuickPick(items, extension.enableProposedApi, options, token);
			},
			showWorkspaceFolderPick(options: hypert.WorkspaceFolderPickOptions) {
				return extHostQuickOpen.showWorkspaceFolderPick(options);
			},
			showInputBox(options?: hypert.InputBoxOptions, token?: hypert.CancellationToken) {
				return extHostQuickOpen.showInput(options, token);
			},
			showOpenDialog(options) {
				return extHostDialogs.showOpenDialog(options);
			},
			showSaveDialog(options) {
				return extHostDialogs.showSaveDialog(options);
			},
			createStatusBarItem(position?: hypert.StatusBarAlignment, priority?: number): hypert.StatusBarItem {
				return extHostStatusBar.createStatusBarEntry(extension.id, <number>position, priority);
			},
			setStatusBarMessage(text: string, timeoutOrThenable?: number | Thenable<any>): hypert.Disposable {
				return extHostStatusBar.setStatusBarMessage(text, timeoutOrThenable);
			},
			withScmProgress<R>(task: (progress: hypert.Progress<number>) => Thenable<R>) {
				console.warn(`[Deprecation Warning] function 'withScmProgress' is deprecated and should no longer be used. Use 'withProgress' instead.`);
				return extHostProgress.withProgress(extension, { location: extHostTypes.ProgressLocation.SourceControl }, (progress, token) => task({ report(n: number) { /*noop*/ } }));
			},
			withProgress<R>(options: hypert.ProgressOptions, task: (progress: hypert.Progress<{ message?: string; worked?: number }>, token: hypert.CancellationToken) => Thenable<R>) {
				return extHostProgress.withProgress(extension, options, task);
			},
			createOutputChannel(name: string): hypert.OutputChannel {
				return extHostOutputService.createOutputChannel(name);
			},
			createWebviewPanel(viewType: string, title: string, showOptions: hypert.ViewColumn | { viewColumn: hypert.ViewColumn, preserveFocus?: boolean }, options: hypert.WebviewPanelOptions & hypert.WebviewOptions): hypert.WebviewPanel {
				return extHostWebviews.createWebview(extension, viewType, title, showOptions, options);
			},
			createTerminal(nameOrOptions: hypert.TerminalOptions | string, shellPath?: string, shellArgs?: string[]): hypert.Terminal {
				if (typeof nameOrOptions === 'object') {
					return extHostTerminalService.createTerminalFromOptions(<hypert.TerminalOptions>nameOrOptions);
				}
				return extHostTerminalService.createTerminal(<string>nameOrOptions, shellPath, shellArgs);
			},
			createTerminalRenderer: proposedApiFunction(extension, (name: string) => {
				return extHostTerminalService.createTerminalRenderer(name);
			}),
			registerTreeDataProvider(viewId: string, treeDataProvider: hypert.TreeDataProvider<any>): hypert.Disposable {
				return extHostTreeViews.registerTreeDataProvider(viewId, treeDataProvider, extension);
			},
			createTreeView(viewId: string, options: { treeDataProvider: hypert.TreeDataProvider<any> }): hypert.TreeView<any> {
				return extHostTreeViews.createTreeView(viewId, options, extension);
			},
			registerWebviewPanelSerializer: (viewType: string, serializer: hypert.WebviewPanelSerializer) => {
				return extHostWebviews.registerWebviewPanelSerializer(viewType, serializer);
			},
			// proposed API
			sampleFunction: proposedApiFunction(extension, () => {
				return extHostMessageService.showMessage(extension, Severity.Info, 'Hello Proposed Api!', {}, []);
			}),
			registerDecorationProvider: proposedApiFunction(extension, (provider: hypert.DecorationProvider) => {
				return extHostDecorations.registerDecorationProvider(provider, extension.id);
			}),
			registerUriHandler(handler: hypert.UriHandler) {
				return extHostUrls.registerUriHandler(extension.id, handler);
			},
			createQuickPick<T extends hypert.QuickPickItem>(): hypert.QuickPick<T> {
				return extHostQuickOpen.createQuickPick(extension.id, extension.enableProposedApi);
			},
			createInputBox(): hypert.InputBox {
				return extHostQuickOpen.createInputBox(extension.id);
			},
		};

		// namespace: workspace
		const workspace: typeof hypert.workspace = {
			get rootPath() {
				return extHostWorkspace.getPath();
			},
			set rootPath(value) {
				throw errors.readonly();
			},
			getWorkspaceFolder(resource) {
				return extHostWorkspace.getWorkspaceFolder(resource);
			},
			get workspaceFolders() {
				return extHostWorkspace.getWorkspaceFolders();
			},
			get name() {
				return extHostWorkspace.name;
			},
			set name(value) {
				throw errors.readonly();
			},
			updateWorkspaceFolders: (index, deleteCount, ...workspaceFoldersToAdd) => {
				return extHostWorkspace.updateWorkspaceFolders(extension, index, deleteCount || 0, ...workspaceFoldersToAdd);
			},
			onDidChangeWorkspaceFolders: function (listener, thisArgs?, disposables?) {
				return extHostWorkspace.onDidChangeWorkspace(listener, thisArgs, disposables);
			},
			asRelativePath: (pathOrUri, includeWorkspace) => {
				return extHostWorkspace.getRelativePath(pathOrUri, includeWorkspace);
			},
			findFiles: (include, exclude, maxResults?, token?) => {
				return extHostWorkspace.findFiles(typeConverters.GlobPattern.from(include), typeConverters.GlobPattern.from(exclude), maxResults, extension.id, token);
			},
			findTextInFiles: (query: hypert.TextSearchQuery, optionsOrCallback, callbackOrToken?, token?: hypert.CancellationToken) => {
				let options: hypert.FindTextInFilesOptions;
				let callback: (result: hypert.TextSearchResult) => void;

				if (typeof optionsOrCallback === 'object') {
					options = optionsOrCallback;
					callback = callbackOrToken;
				} else {
					options = {};
					callback = optionsOrCallback;
					token = callbackOrToken;
				}

				return extHostWorkspace.findTextInFiles(query, options || {}, callback, extension.id, token);
			},
			saveAll: (includeUntitled?) => {
				return extHostWorkspace.saveAll(includeUntitled);
			},
			applyEdit(edit: hypert.WorkspaceEdit): Thenable<boolean> {
				return extHostEditors.applyWorkspaceEdit(edit);
			},
			createFileSystemWatcher: (pattern, ignoreCreate, ignoreChange, ignoreDelete): hypert.FileSystemWatcher => {
				return extHostFileSystemEvent.createFileSystemWatcher(typeConverters.GlobPattern.from(pattern), ignoreCreate, ignoreChange, ignoreDelete);
			},
			get textDocuments() {
				return extHostDocuments.getAllDocumentData().map(data => data.document);
			},
			set textDocuments(value) {
				throw errors.readonly();
			},
			openTextDocument(uriOrFileNameOrOptions?: hypert.Uri | string | { language?: string; content?: string; }) {
				let uriPromise: Thenable<URI>;

				let options = uriOrFileNameOrOptions as { language?: string; content?: string; };
				if (typeof uriOrFileNameOrOptions === 'string') {
					uriPromise = Promise.resolve(URI.file(uriOrFileNameOrOptions));
				} else if (uriOrFileNameOrOptions instanceof URI) {
					uriPromise = Promise.resolve(uriOrFileNameOrOptions);
				} else if (!options || typeof options === 'object') {
					uriPromise = extHostDocuments.createDocumentData(options);
				} else {
					throw new Error('illegal argument - uriOrFileNameOrOptions');
				}

				return uriPromise.then(uri => {
					return extHostDocuments.ensureDocumentData(uri).then(() => {
						const data = extHostDocuments.getDocumentData(uri);
						return data && data.document;
					});
				});
			},
			onDidOpenTextDocument: (listener, thisArgs?, disposables?) => {
				return extHostDocuments.onDidAddDocument(listener, thisArgs, disposables);
			},
			onDidCloseTextDocument: (listener, thisArgs?, disposables?) => {
				return extHostDocuments.onDidRemoveDocument(listener, thisArgs, disposables);
			},
			onDidChangeTextDocument: (listener, thisArgs?, disposables?) => {
				return extHostDocuments.onDidChangeDocument(listener, thisArgs, disposables);
			},
			onDidSaveTextDocument: (listener, thisArgs?, disposables?) => {
				return extHostDocuments.onDidSaveDocument(listener, thisArgs, disposables);
			},
			onWillSaveTextDocument: (listener, thisArgs?, disposables?) => {
				return extHostDocumentSaveParticipant.getOnWillSaveTextDocumentEvent(extension)(listener, thisArgs, disposables);
			},
			onDidChangeConfiguration: (listener: (_: any) => any, thisArgs?: any, disposables?: extHostTypes.Disposable[]) => {
				return extHostConfiguration.onDidChangeConfiguration(listener, thisArgs, disposables);
			},
			getConfiguration(section?: string, resource?: hypert.Uri): hypert.WorkspaceConfiguration {
				resource = arguments.length === 1 ? void 0 : resource;
				return extHostConfiguration.getConfiguration(section, resource, extension.id);
			},
			registerTextDocumentContentProvider(scheme: string, provider: hypert.TextDocumentContentProvider) {
				return extHostDocumentContentProviders.registerTextDocumentContentProvider(scheme, provider);
			},
			registerTaskProvider: (type: string, provider: hypert.TaskProvider) => {
				return extHostTask.registerTaskProvider(extension, provider);
			},
			registerFileSystemProvider(scheme, provider, options) {
				return extHostFileSystem.registerFileSystemProvider(scheme, provider, options);
			},
			registerFileSearchProvider: proposedApiFunction(extension, (scheme, provider) => {
				return extHostSearch.registerFileSearchProvider(scheme, provider);
			}),
			registerSearchProvider: proposedApiFunction(extension, () => {
				// Temp for live share in Insiders
				return { dispose: () => { } };
			}),
			registerTextSearchProvider: proposedApiFunction(extension, (scheme, provider) => {
				return extHostSearch.registerTextSearchProvider(scheme, provider);
			}),
			registerFileIndexProvider: proposedApiFunction(extension, (scheme, provider) => {
				return extHostSearch.registerFileIndexProvider(scheme, provider);
			}),
			registerDocumentCommentProvider: proposedApiFunction(extension, (provider: hypert.DocumentCommentProvider) => {
				return exthostCommentProviders.registerDocumentCommentProvider(provider);
			}),
			registerWorkspaceCommentProvider: proposedApiFunction(extension, (provider: hypert.WorkspaceCommentProvider) => {
				return exthostCommentProviders.registerWorkspaceCommentProvider(extension.id, provider);
			}),
			onDidRenameFile: proposedApiFunction(extension, (listener, thisArg?, disposables?) => {
				return extHostFileSystemEvent.onDidRenameFile(listener, thisArg, disposables);
			}),
			onWillRenameFile: proposedApiFunction(extension, (listener, thisArg?, disposables?) => {
				return extHostFileSystemEvent.getOnWillRenameFileEvent(extension)(listener, thisArg, disposables);
			})
		};

		// namespace: scm
		const scm: typeof hypert.scm = {
			get inputBox() {
				return extHostSCM.getLastInputBox(extension);
			},
			createSourceControl(id: string, label: string, rootUri?: hypert.Uri) {
				return extHostSCM.createSourceControl(extension, id, label, rootUri);
			}
		};

		/* hernad out-debug

		// namespace: debug
		const debug: typeof hypert.debug = {
			get activeDebugSession() {
				return extHostDebugService.activeDebugSession;
			},
			get activeDebugConsole() {
				return extHostDebugService.activeDebugConsole;
			},
			get breakpoints() {
				return extHostDebugService.breakpoints;
			},
			onDidStartDebugSession(listener, thisArg?, disposables?) {
				return extHostDebugService.onDidStartDebugSession(listener, thisArg, disposables);
			},
			onDidTerminateDebugSession(listener, thisArg?, disposables?) {
				return extHostDebugService.onDidTerminateDebugSession(listener, thisArg, disposables);
			},
			onDidChangeActiveDebugSession(listener, thisArg?, disposables?) {
				return extHostDebugService.onDidChangeActiveDebugSession(listener, thisArg, disposables);
			},
			onDidReceiveDebugSessionCustomEvent(listener, thisArg?, disposables?) {
				return extHostDebugService.onDidReceiveDebugSessionCustomEvent(listener, thisArg, disposables);
			},
			onDidChangeBreakpoints(listener, thisArgs?, disposables?) {
				return extHostDebugService.onDidChangeBreakpoints(listener, thisArgs, disposables);
			},
			registerDebugConfigurationProvider(debugType: string, provider: hypert.DebugConfigurationProvider) {
				return extHostDebugService.registerDebugConfigurationProvider(extension, debugType, provider);
			},
			registerDebugAdapterProvider(debugType: string, provider: hypert.DebugAdapterProvider) {
				return extHostDebugService.registerDebugAdapterProvider(extension, debugType, provider);
			},
			startDebugging(folder: hypert.WorkspaceFolder | undefined, nameOrConfig: string | hypert.DebugConfiguration) {
				return extHostDebugService.startDebugging(folder, nameOrConfig);
			},
			addBreakpoints(breakpoints: hypert.Breakpoint[]) {
				return extHostDebugService.addBreakpoints(breakpoints);
			},
			removeBreakpoints(breakpoints: hypert.Breakpoint[]) {
				return extHostDebugService.removeBreakpoints(breakpoints);
			}
		};
		*/

		const tasks: typeof hypert.tasks = {
			registerTaskProvider: (type: string, provider: hypert.TaskProvider) => {
				return extHostTask.registerTaskProvider(extension, provider);
			},
			fetchTasks: (filter?: hypert.TaskFilter): Thenable<hypert.Task[]> => {
				return extHostTask.fetchTasks(filter);
			},
			executeTask: (task: hypert.Task): Thenable<hypert.TaskExecution> => {
				return extHostTask.executeTask(extension, task);
			},
			get taskExecutions(): hypert.TaskExecution[] {
				return extHostTask.taskExecutions;
			},
			onDidStartTask: (listeners, thisArgs?, disposables?) => {
				return extHostTask.onDidStartTask(listeners, thisArgs, disposables);
			},
			onDidEndTask: (listeners, thisArgs?, disposables?) => {
				return extHostTask.onDidEndTask(listeners, thisArgs, disposables);
			},
			onDidStartTaskProcess: (listeners, thisArgs?, disposables?) => {
				return extHostTask.onDidStartTaskProcess(listeners, thisArgs, disposables);
			},
			onDidEndTaskProcess: (listeners, thisArgs?, disposables?) => {
				return extHostTask.onDidEndTaskProcess(listeners, thisArgs, disposables);
			}
		};

		return <typeof hypert>{
			version: pkg.version,
			// namespaces
			commands,
			debug: null, // hernad out-debug
			env,
			extensions,
			languages,
			scm,
			tasks,
			window,
			workspace,
			// types
			Breakpoint: extHostTypes.Breakpoint,
			CancellationTokenSource: CancellationTokenSource,
			CodeAction: extHostTypes.CodeAction,
			CodeActionKind: extHostTypes.CodeActionKind,
			CodeActionTrigger: extHostTypes.CodeActionTrigger,
			CodeLens: extHostTypes.CodeLens,
			Color: extHostTypes.Color,
			ColorInformation: extHostTypes.ColorInformation,
			ColorPresentation: extHostTypes.ColorPresentation,
			CommentThreadCollapsibleState: extHostTypes.CommentThreadCollapsibleState,
			CompletionItem: extHostTypes.CompletionItem,
			CompletionItemKind: extHostTypes.CompletionItemKind,
			CompletionItemInsertTextRule: extension.enableProposedApi ? extHostTypes.CompletionItemInsertTextRule : null,
			CompletionList: extHostTypes.CompletionList,
			CompletionTriggerKind: extHostTypes.CompletionTriggerKind,
			ConfigurationTarget: extHostTypes.ConfigurationTarget,
			DebugAdapterExecutable: extHostTypes.DebugAdapterExecutable,
			DebugAdapterServer: extHostTypes.DebugAdapterServer,
			DebugAdapterImplementation: extHostTypes.DebugAdapterImplementation,
			DecorationRangeBehavior: extHostTypes.DecorationRangeBehavior,
			Diagnostic: extHostTypes.Diagnostic,
			DiagnosticRelatedInformation: extHostTypes.DiagnosticRelatedInformation,
			DiagnosticSeverity: extHostTypes.DiagnosticSeverity,
			DiagnosticTag: extHostTypes.DiagnosticTag,
			Disposable: extHostTypes.Disposable,
			DocumentHighlight: extHostTypes.DocumentHighlight,
			DocumentHighlightKind: extHostTypes.DocumentHighlightKind,
			DocumentLink: extHostTypes.DocumentLink,
			DocumentSymbol: extHostTypes.DocumentSymbol,
			EndOfLine: extHostTypes.EndOfLine,
			EventEmitter: Emitter,
			FileChangeType: extHostTypes.FileChangeType,
			FileSystemError: extHostTypes.FileSystemError,
			FileType: files.FileType,
			FoldingRange: extHostTypes.FoldingRange,
			FoldingRangeKind: extHostTypes.FoldingRangeKind,
			FunctionBreakpoint: extHostTypes.FunctionBreakpoint,
			Hover: extHostTypes.Hover,
			IndentAction: languageConfiguration.IndentAction,
			Location: extHostTypes.Location,
			LogLevel: extHostTypes.LogLevel,
			MarkdownString: extHostTypes.MarkdownString,
			OverviewRulerLane: OverviewRulerLane,
			ParameterInformation: extHostTypes.ParameterInformation,
			Position: extHostTypes.Position,
			ProcessExecution: extHostTypes.ProcessExecution,
			ProgressLocation: extHostTypes.ProgressLocation,
			QuickInputButtons: extHostTypes.QuickInputButtons,
			Range: extHostTypes.Range,
			RelativePattern: extHostTypes.RelativePattern,
			Selection: extHostTypes.Selection,
			ShellExecution: extHostTypes.ShellExecution,
			ShellQuoting: extHostTypes.ShellQuoting,
			SignatureHelpTriggerReason: extHostTypes.SignatureHelpTriggerReason,
			SignatureHelp: extHostTypes.SignatureHelp,
			SignatureInformation: extHostTypes.SignatureInformation,
			SnippetString: extHostTypes.SnippetString,
			SourceBreakpoint: extHostTypes.SourceBreakpoint,
			SourceControlInputBoxValidationType: extHostTypes.SourceControlInputBoxValidationType,
			StatusBarAlignment: extHostTypes.StatusBarAlignment,
			SymbolInformation: extHostTypes.SymbolInformation,
			SymbolKind: extHostTypes.SymbolKind,
			Task: extHostTypes.Task,
			TaskGroup: extHostTypes.TaskGroup,
			TaskPanelKind: extHostTypes.TaskPanelKind,
			TaskRevealKind: extHostTypes.TaskRevealKind,
			TaskScope: extHostTypes.TaskScope,
			TextDocumentSaveReason: extHostTypes.TextDocumentSaveReason,
			TextEdit: extHostTypes.TextEdit,
			TextEditorCursorStyle: TextEditorCursorStyle,
			TextEditorLineNumbersStyle: extHostTypes.TextEditorLineNumbersStyle,
			TextEditorRevealType: extHostTypes.TextEditorRevealType,
			TextEditorSelectionChangeKind: extHostTypes.TextEditorSelectionChangeKind,
			ThemeColor: extHostTypes.ThemeColor,
			ThemeIcon: extHostTypes.ThemeIcon,
			TreeItem: extHostTypes.TreeItem,
			TreeItem2: extHostTypes.TreeItem,
			TreeItemCollapsibleState: extHostTypes.TreeItemCollapsibleState,
			Uri: URI,
			ViewColumn: extHostTypes.ViewColumn,
			WorkspaceEdit: extHostTypes.WorkspaceEdit,
			// functions
		};
	};
}

/**
 * Returns the original fs path (using the original casing for the drive letter)
 */
export function originalFSPath(uri: URI): string {
	const result = uri.fsPath;
	if (/^[a-zA-Z]:/.test(result) && uri.path.charAt(1).toLowerCase() === result.charAt(0)) {
		// Restore original drive letter casing
		return uri.path.charAt(1) + result.substr(1);
	}
	return result;
}

class Extension<T> implements hypert.Extension<T> {

	private _extensionService: ExtHostExtensionService;

	public id: string;
	public extensionPath: string;
	public packageJSON: any;

	constructor(extensionService: ExtHostExtensionService, description: IExtensionDescription) {
		this._extensionService = extensionService;
		this.id = description.id;
		this.extensionPath = paths.normalize(originalFSPath(description.extensionLocation), true);
		this.packageJSON = description;
	}

	get isActive(): boolean {
		return this._extensionService.isActivated(this.id);
	}

	get exports(): T {
		return <T>this._extensionService.getExtensionExports(this.id);
	}

	activate(): Thenable<T> {
		return this._extensionService.activateByIdWithErrors(this.id, new ExtensionActivatedByAPI(false)).then(() => this.exports);
	}
}

export function initializeExtensionApi(extensionService: ExtHostExtensionService, apiFactory: IExtensionApiFactory): Promise<void> {
	return extensionService.getExtensionPathIndex().then(trie => defineAPI(apiFactory, trie));
}

function defineAPI(factory: IExtensionApiFactory, extensionPaths: TernarySearchTree<IExtensionDescription>): void {

	// each extension is meant to get its own api implementation
	const extApiImpl = new Map<string, typeof hypert>();
	let defaultApiImpl: typeof hypert;

	const node_module = <any>require.__$__nodeRequire('module');
	const original = node_module._load;
	node_module._load = function load(request: string, parent: any, isMain: any) {
		if (request !== 'hypert') {
			return original.apply(this, arguments);
		}

		// get extension id from filename and api for extension
		const ext = extensionPaths.findSubstr(URI.file(parent.filename).fsPath);
		if (ext) {
			let apiImpl = extApiImpl.get(ext.id);
			if (!apiImpl) {
				apiImpl = factory(ext);
				extApiImpl.set(ext.id, apiImpl);
			}
			return apiImpl;
		}

		// fall back to a default implementation
		if (!defaultApiImpl) {
			let extensionPathsPretty = '';
			extensionPaths.forEach((value, index) => extensionPathsPretty += `\t${index} -> ${value.id}\n`);
			console.warn(`Could not identify extension for 'hypert' require call from ${parent.filename}. These are the extension path mappings: \n${extensionPathsPretty}`);
			defaultApiImpl = factory(nullExtensionDescription);
		}
		return defaultApiImpl;
	};
}
