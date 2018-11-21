/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

exports.base = [{
	name: 'base/common/worker/simpleWorker',
	include: [ 'editor/common/services/editorSimpleWorker' ],
	prepend: [ 'loader.js' ],
	append: [ 'base/worker/workerMain' ],
	dest: 'base/worker/workerMain.js'
}];
//@ts-ignore review
exports.workbench = require('./workbench/buildfile').collectModules(['workbench/workbench.main']);
exports.code = require('./code/buildfile').collectModules();

exports.entrypoint = function (name) {
	return [{ name: name, include: [], exclude: ['css', 'base/nls'] }];
};
