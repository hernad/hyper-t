/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as nls from 'base/nls';
import * as env from 'base/common/platform';
import { Registry } from 'platform/registry/common/platform';
import { IConfigurationService } from 'platform/configuration/common/configuration';
import { registerSingleton } from 'platform/instantiation/common/extensions';
import * as paths from 'base/common/paths';
import { URI as uri } from 'base/common/uri';
import { ITerminalService } from 'workbench/parts/execution/common/execution';
import { MenuId, MenuRegistry } from 'platform/actions/common/actions';
import { KeyMod, KeyCode } from 'base/common/keyCodes';
import { Extensions, IConfigurationRegistry, ConfigurationScope } from 'platform/configuration/common/configurationRegistry';
import { ITerminalService as IIntegratedTerminalService, KEYBINDING_CONTEXT_TERMINAL_NOT_FOCUSED } from 'workbench/parts/terminal/common/terminal';
import { getDefaultTerminalWindows, getDefaultTerminalLinuxReady, DEFAULT_TERMINAL_OSX, ITerminalConfiguration } from 'workbench/parts/execution/electron-browser/terminal';
import { WinTerminalService, MacTerminalService, LinuxTerminalService } from 'workbench/parts/execution/electron-browser/terminalService';
import { IHistoryService } from 'workbench/services/history/common/history';
import { ResourceContextKey } from 'workbench/common/resources';
import { KeybindingsRegistry, KeybindingWeight } from 'platform/keybinding/common/keybindingsRegistry';
import { IFileService } from 'platform/files/common/files';
import { IListService } from 'platform/list/browser/listService';
import { getMultiSelectedResources } from 'workbench/parts/files/browser/files';
import { CommandsRegistry } from 'platform/commands/common/commands';
import { Schemas } from 'base/common/network';
import { distinct } from 'base/common/arrays';
import { IEditorService } from 'workbench/services/editor/common/editorService';
import { IPartService } from 'workbench/services/part/common/partService';

if (env.isWindows) {
	registerSingleton(ITerminalService, WinTerminalService);
} else if (env.isMacintosh) {
	registerSingleton(ITerminalService, MacTerminalService);
} else if (env.isLinux) {
	registerSingleton(ITerminalService, LinuxTerminalService);
}

getDefaultTerminalLinuxReady().then(defaultTerminalLinux => {
	let configurationRegistry = Registry.as<IConfigurationRegistry>(Extensions.Configuration);
	configurationRegistry.registerConfiguration({
		id: 'externalTerminal',
		order: 100,
		title: nls.localize('terminalConfigurationTitle', "External Terminal"),
		type: 'object',
		properties: {
			'terminal.explorerKind': {
				type: 'string',
				enum: [
					'integrated',
					'external'
				],
				enumDescriptions: [
					nls.localize('terminal.explorerKind.integrated', "Use VS Code's integrated terminal."),
					nls.localize('terminal.explorerKind.external', "Use the configured external terminal.")
				],
				description: nls.localize('explorer.openInTerminalKind', "Customizes what kind of terminal to launch."),
				default: 'integrated'
			},
			'terminal.external.windowsExec': {
				type: 'string',
				description: nls.localize('terminal.external.windowsExec', "Customizes which terminal to run on Windows."),
				default: getDefaultTerminalWindows(),
				scope: ConfigurationScope.APPLICATION
			},
			'terminal.external.osxExec': {
				type: 'string',
				description: nls.localize('terminal.external.osxExec', "Customizes which terminal application to run on macOS."),
				default: DEFAULT_TERMINAL_OSX,
				scope: ConfigurationScope.APPLICATION
			},
			'terminal.external.linuxExec': {
				type: 'string',
				description: nls.localize('terminal.external.linuxExec', "Customizes which terminal to run on Linux."),
				default: defaultTerminalLinux,
				scope: ConfigurationScope.APPLICATION
			}
		}
	});
});

const OPEN_IN_TERMINAL_COMMAND_ID = 'openInTerminal';
CommandsRegistry.registerCommand({
	id: OPEN_IN_TERMINAL_COMMAND_ID,
	handler: (accessor, resource: uri) => {
		const configurationService = accessor.get(IConfigurationService);
		const editorService = accessor.get(IEditorService);
		const fileService = accessor.get(IFileService);
		const integratedTerminalService = accessor.get(IIntegratedTerminalService);
		const terminalService = accessor.get(ITerminalService);
		const partService = accessor.get(IPartService);

		const resources = getMultiSelectedResources(resource, accessor.get(IListService), editorService);

		return fileService.resolveFiles(resources.map(r => ({ resource: r }))).then(stats => {
			const directoriesToOpen = distinct(stats.map(({ stat }) => stat.isDirectory ? stat.resource.fsPath : paths.dirname(stat.resource.fsPath)));
			return directoriesToOpen.map(dir => {
				if (configurationService.getValue<ITerminalConfiguration>().terminal.explorerKind === 'integrated') {
					const instance = integratedTerminalService.createTerminal({ cwd: dir, executable: "/home/hernad/F18_knowhow/F18.sh" }, true);
					partService.setSideBarHidden(true);
					if (instance && (resources.length === 1 || !resource || dir === resource.fsPath || dir === paths.dirname(resource.fsPath))) {
						integratedTerminalService.setActiveInstance(instance);
						integratedTerminalService.showPanel(true);
						
					}
				} else {
					terminalService.openTerminal(dir);
				}
			});
		});
	}
});

const OPEN_NATIVE_CONSOLE_COMMAND_ID = 'workbench.action.terminal.openNativeConsole';
KeybindingsRegistry.registerCommandAndKeybindingRule({
	id: OPEN_NATIVE_CONSOLE_COMMAND_ID,
	primary: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KEY_C,
	when: KEYBINDING_CONTEXT_TERMINAL_NOT_FOCUSED,
	weight: KeybindingWeight.WorkbenchContrib,
	handler: (accessor) => {
		const historyService = accessor.get(IHistoryService);
		const terminalService = accessor.get(ITerminalService);
		const root = historyService.getLastActiveWorkspaceRoot(Schemas.file);
		if (root) {
			terminalService.openTerminal(root.fsPath);
		} else {
			// Opens current file's folder, if no folder is open in editor
			const activeFile = historyService.getLastActiveFile(Schemas.file);
			if (activeFile) {
				terminalService.openTerminal(paths.dirname(activeFile.fsPath));
			}
		}
	}
});

MenuRegistry.appendMenuItem(MenuId.CommandPalette, {
	command: {
		id: OPEN_NATIVE_CONSOLE_COMMAND_ID,
		title: { value: nls.localize('globalConsoleAction', "Open New Terminal"), original: 'Open New Terminal' }
	}
});

const openConsoleCommand = {
	id: OPEN_IN_TERMINAL_COMMAND_ID,
	title: nls.localize('scopedConsoleAction', "Open in Terminal")
};
MenuRegistry.appendMenuItem(MenuId.OpenEditorsContext, {
	group: 'navigation',
	order: 30,
	command: openConsoleCommand,
	when: ResourceContextKey.Scheme.isEqualTo(Schemas.file)
});

MenuRegistry.appendMenuItem(MenuId.ExplorerContext, {
	group: 'navigation',
	order: 30,
	command: openConsoleCommand,
	when: ResourceContextKey.Scheme.isEqualTo(Schemas.file)
});
