/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from 'base/nls';
import { WalkThroughInput } from 'workbench/parts/welcome/walkThrough/node/walkThroughInput';
import { WalkThroughPart } from 'workbench/parts/welcome/walkThrough/electron-browser/walkThroughPart';
import { WalkThroughArrowUp, WalkThroughArrowDown, WalkThroughPageUp, WalkThroughPageDown } from 'workbench/parts/welcome/walkThrough/electron-browser/walkThroughActions';
import { WalkThroughContentProvider, WalkThroughSnippetContentProvider } from 'workbench/parts/welcome/walkThrough/node/walkThroughContentProvider';
import { EditorWalkThroughAction, EditorWalkThroughInputFactory } from 'workbench/parts/welcome/walkThrough/electron-browser/editor/editorWalkThrough';
import { Registry } from 'platform/registry/common/platform';
import { Extensions as EditorInputExtensions, IEditorInputFactoryRegistry } from 'workbench/common/editor';
import { SyncDescriptor } from 'platform/instantiation/common/descriptors';
import { IWorkbenchActionRegistry, Extensions } from 'workbench/common/actions';
import { SyncActionDescriptor, MenuRegistry, MenuId } from 'platform/actions/common/actions';
import { IWorkbenchContributionsRegistry, Extensions as WorkbenchExtensions } from 'workbench/common/contributions';
import { IEditorRegistry, Extensions as EditorExtensions, EditorDescriptor } from 'workbench/browser/editor';
import { LifecyclePhase } from 'platform/lifecycle/common/lifecycle';
import { KeybindingsRegistry } from 'platform/keybinding/common/keybindingsRegistry';

Registry.as<IEditorRegistry>(EditorExtensions.Editors)
	.registerEditor(new EditorDescriptor(
		WalkThroughPart,
		WalkThroughPart.ID,
		localize('walkThrough.editor.label', "Interactive Playground"),
	),
		[new SyncDescriptor(WalkThroughInput)]);

Registry.as<IWorkbenchActionRegistry>(Extensions.WorkbenchActions)
	.registerWorkbenchAction(
		new SyncActionDescriptor(EditorWalkThroughAction, EditorWalkThroughAction.ID, EditorWalkThroughAction.LABEL),
		'Help: Interactive Playground', localize('help', "Help"));

Registry.as<IEditorInputFactoryRegistry>(EditorInputExtensions.EditorInputFactories).registerEditorInputFactory(EditorWalkThroughInputFactory.ID, EditorWalkThroughInputFactory);

Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench)
	.registerWorkbenchContribution(WalkThroughContentProvider, LifecyclePhase.Starting);

Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench)
	.registerWorkbenchContribution(WalkThroughSnippetContentProvider, LifecyclePhase.Starting);

KeybindingsRegistry.registerCommandAndKeybindingRule(WalkThroughArrowUp);

KeybindingsRegistry.registerCommandAndKeybindingRule(WalkThroughArrowDown);

KeybindingsRegistry.registerCommandAndKeybindingRule(WalkThroughPageUp);

KeybindingsRegistry.registerCommandAndKeybindingRule(WalkThroughPageDown);

MenuRegistry.appendMenuItem(MenuId.MenubarHelpMenu, {
	group: '1_welcome',
	command: {
		id: 'workbench.action.showInteractivePlayground',
		title: localize({ key: 'miInteractivePlayground', comment: ['&& denotes a mnemonic'] }, "&&Interactive Playground")
	},
	order: 2
});