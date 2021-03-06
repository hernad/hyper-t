/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IConfigurationService } from 'platform/configuration/common/configuration';
import { createDecorator } from 'platform/instantiation/common/instantiation';

export const FOLDER_CONFIG_FOLDER_NAME = '.hypert';
export const FOLDER_SETTINGS_NAME = 'settings';
export const FOLDER_SETTINGS_PATH = `${FOLDER_CONFIG_FOLDER_NAME}/${FOLDER_SETTINGS_NAME}.json`;

export const IWorkspaceConfigurationService = createDecorator<IWorkspaceConfigurationService>('configurationService');

export interface IWorkspaceConfigurationService extends IConfigurationService {
}

export const defaultSettingsSchemaId = 'hypert://schemas/settings/default';
export const userSettingsSchemaId = 'hypert://schemas/settings/user';
export const workspaceSettingsSchemaId = 'hypert://schemas/settings/workspace';
export const folderSettingsSchemaId = 'hypert://schemas/settings/folder';
export const launchSchemaId = 'hypert://schemas/launch';

export const TASKS_CONFIGURATION_KEY = 'tasks';
export const LAUNCH_CONFIGURATION_KEY = 'launch';

export const WORKSPACE_STANDALONE_CONFIGURATIONS = Object.create(null);
WORKSPACE_STANDALONE_CONFIGURATIONS[TASKS_CONFIGURATION_KEY] = `${FOLDER_CONFIG_FOLDER_NAME}/${TASKS_CONFIGURATION_KEY}.json`;
WORKSPACE_STANDALONE_CONFIGURATIONS[LAUNCH_CONFIGURATION_KEY] = `${FOLDER_CONFIG_FOLDER_NAME}/${LAUNCH_CONFIGURATION_KEY}.json`;
