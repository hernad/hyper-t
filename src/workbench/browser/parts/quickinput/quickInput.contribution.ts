/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { QuickPickManyToggle, BackAction } from 'workbench/browser/parts/quickinput/quickInput';
import { KeybindingsRegistry, KeybindingWeight } from 'platform/keybinding/common/keybindingsRegistry';
import { Registry } from 'platform/registry/common/platform';
import { IWorkbenchActionRegistry, Extensions as ActionExtensions } from 'workbench/common/actions';
import { SyncActionDescriptor } from 'platform/actions/common/actions';
import { KeyMod, KeyCode } from 'base/common/keyCodes';
import { inQuickOpenContext } from 'workbench/browser/parts/quickopen/quickopen';

KeybindingsRegistry.registerCommandAndKeybindingRule(QuickPickManyToggle);

const registry = Registry.as<IWorkbenchActionRegistry>(ActionExtensions.WorkbenchActions);
registry.registerWorkbenchAction(new SyncActionDescriptor(BackAction, BackAction.ID, BackAction.LABEL, { primary: 0, win: { primary: KeyMod.Alt | KeyCode.LeftArrow }, mac: { primary: KeyMod.WinCtrl | KeyCode.US_MINUS }, linux: { primary: KeyMod.CtrlCmd | KeyMod.Alt | KeyCode.US_MINUS } }, inQuickOpenContext, KeybindingWeight.WorkbenchContrib + 50), 'Back');
