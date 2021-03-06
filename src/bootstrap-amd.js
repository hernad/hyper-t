/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

//@ts-check
'use strict';

const loader = require('./loader');
const bootstrap = require('./bootstrap');

// Bootstrap: NLS
const nlsConfig = bootstrap.setupNLS();

// Bootstrap: Loader
loader.config({
	baseUrl: bootstrap.uriFromPath(__dirname),
	catchError: true,
	nodeRequire: require,
	nodeMain: __filename,
	'base/nls': nlsConfig,
	nodeCachedDataDir: process.env['HYPERT_NODE_CACHED_DATA_DIR']
});

// Running in Electron
if (process.env['ELECTRON_RUN_AS_NODE'] || process.versions['electron']) {
	loader.define('fs', ['original-fs'], function (originalFS) {
		return originalFS;  // replace the patched electron fs with the original node fs for all AMD code
	});
}

// Pseudo NLS support
if (nlsConfig.pseudo) {
	loader(['base/nls'], function (nlsPlugin) {
		nlsPlugin.setPseudoTranslation(nlsConfig.pseudo);
	});
}

exports.load = function (entrypoint, onLoad, onError) {
	if (!entrypoint) {
		return;
	}

	onLoad = onLoad || function () { };
	onError = onError || function (err) { console.error(err); };

	loader([entrypoint], onLoad, onError);
};
