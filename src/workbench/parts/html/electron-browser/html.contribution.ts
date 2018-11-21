/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { URI } from 'base/common/uri';
import { localize } from 'base/nls';
import { CommandsRegistry } from 'platform/commands/common/commands';
import { IInstantiationService, ServicesAccessor } from 'platform/instantiation/common/instantiation';
import { IEditorService } from 'workbench/services/editor/common/editorService';
import { EditorViewColumn, viewColumnToEditorGroup } from 'workbench/api/shared/editor';
import { HtmlInput, HtmlInputOptions } from '../common/htmlInput';
import { HtmlPreviewPart } from './htmlPreviewPart';
import { Registry } from 'platform/registry/common/platform';
import { SyncDescriptor } from 'platform/instantiation/common/descriptors';
import { IEditorGroupsService, IEditorGroup } from 'workbench/services/group/common/editorGroupsService';
import { IExtensionsWorkbenchService } from 'workbench/parts/extensions/common/extensions';
import { IEditorRegistry, EditorDescriptor, Extensions as EditorExtensions } from 'workbench/browser/editor';
import { registerWebViewCommands } from 'workbench/parts/webview/electron-browser/webview.contribution';

function getActivePreviewsForResource(accessor: ServicesAccessor, resource: URI | string) {
	const uri = resource instanceof URI ? resource : URI.parse(resource);
	return accessor.get(IEditorService).visibleControls
		.filter(c => c instanceof HtmlPreviewPart && c.model)
		.map(e => e as HtmlPreviewPart)
		.filter(e => e.model.uri.scheme === uri.scheme && e.model.uri.toString() === uri.toString());
}

// --- Register Editor

(Registry.as<IEditorRegistry>(EditorExtensions.Editors)).registerEditor(new EditorDescriptor(
	HtmlPreviewPart,
	HtmlPreviewPart.ID,
	localize('html.editor.label', "Html Preview")),
	[new SyncDescriptor(HtmlInput)]);

// --- Register Commands

CommandsRegistry.registerCommand('_workbench.previewHtml', function (
	accessor: ServicesAccessor,
	resource: URI | string,
	position?: EditorViewColumn,
	label?: string
) {
	const uri = resource instanceof URI ? resource : URI.parse(resource);
	label = label || uri.fsPath;

	let input: HtmlInput;

	const editorGroupService = accessor.get(IEditorGroupsService);

	let targetGroup: IEditorGroup = editorGroupService.getGroup(viewColumnToEditorGroup(editorGroupService, position));
	if (!targetGroup) {
		targetGroup = editorGroupService.activeGroup;
	}

	// Find already opened HTML input if any
	if (targetGroup) {
		const editors = targetGroup.editors;
		for (let i = 0; i < editors.length; i++) {
			const editor = editors[i];
			const editorResource = editor.getResource();
			if (editor instanceof HtmlInput && editorResource && editorResource.toString() === resource.toString()) {
				input = editor;
				break;
			}
		}
	}

	const extensionsWorkbenchService = accessor.get(IExtensionsWorkbenchService);

	const inputOptions: HtmlInputOptions = {
		allowScripts: true,
		allowSvgs: true,
		svgWhiteList: extensionsWorkbenchService.allowedBadgeProviders
	};

	// Otherwise, create new input and open it
	if (!input) {
		input = accessor.get(IInstantiationService).createInstance(HtmlInput, label, '', uri, inputOptions);
	} else {
		input.setName(label); // make sure to use passed in label
	}

	return accessor.get(IEditorService)
		.openEditor(input, { pinned: true }, viewColumnToEditorGroup(editorGroupService, position))
		.then(editor => true);
});

CommandsRegistry.registerCommand('_workbench.htmlPreview.postMessage', function (
	accessor: ServicesAccessor,
	resource: URI | string,
	message: any
) {
	const activePreviews = getActivePreviewsForResource(accessor, resource);
	for (const preview of activePreviews) {
		preview.sendMessage(message);
	}
	return activePreviews.length > 0;
});

registerWebViewCommands(HtmlPreviewPart.ID);