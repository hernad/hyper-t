/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

function createModuleDescription(name, exclude) {
	var result = {};
	var excludes = ['vs/css', 'base/nls'];
	result.name = name;
	if (Array.isArray(exclude) && exclude.length > 0) {
		excludes = excludes.concat(exclude);
	}
	result.exclude = excludes;
	return result;
}

exports.collectModules = function () {
	var modules = [
		createModuleDescription('workbench/parts/output/common/outputLinkComputer', ['base/common/worker/simpleWorker', 'editor/common/services/editorSimpleWorker']),

		createModuleDescription('workbench/services/search/node/searchApp', []),
		createModuleDescription('workbench/services/search/node/legacy/worker/searchWorkerApp', []),
		createModuleDescription('workbench/services/files/node/watcher/unix/watcherApp', []),
		createModuleDescription('workbench/services/files/node/watcher/nsfw/watcherApp', []),

		createModuleDescription('workbench/node/extensionHostProcess', []),
	];

	return modules;
};
