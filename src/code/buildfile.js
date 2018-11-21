/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

function createModuleDescription(name, exclude) {
	var result = {};
	var excludes = ['css', 'base/nls'];
	result.name = name;
	if (Array.isArray(exclude) && exclude.length > 0) {
		excludes = excludes.concat(exclude);
	}
	result.exclude = excludes;

	return result;
}

exports.collectModules = function () {
	return [
		createModuleDescription('code/electron-main/main', []),
		createModuleDescription('code/node/cli', []),
		createModuleDescription('code/node/cliProcessMain', ['vs/code/node/cli']),
		createModuleDescription('code/electron-browser/issue/issueReporterMain', []),
		createModuleDescription('code/electron-browser/sharedProcess/sharedProcessMain', []),
		createModuleDescription('code/electron-browser/issue/issueReporterMain', []),
		createModuleDescription('platform/driver/node/driver', []),
		createModuleDescription('code/electron-browser/processExplorer/processExplorerMain', [])
	];
};
