/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert = require('assert');
import i18n = require('../i18n');

suite('XLF Parser Tests', () => {
	const sampleXlf = '<?xml version="1.0" encoding="utf-8"?><xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2"><file original="base/common/keybinding" source-language="en" datatype="plaintext"><body><trans-unit id="key1"><source xml:lang="en">Key #1</source></trans-unit><trans-unit id="key2"><source xml:lang="en">Key #2 &amp;</source></trans-unit></body></file></xliff>';
	const sampleTranslatedXlf = '<?xml version="1.0" encoding="utf-8"?><xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2"><file original="base/common/keybinding" source-language="en" target-language="ru" datatype="plaintext"><body><trans-unit id="key1"><source xml:lang="en">Key #1</source><target>Кнопка #1</target></trans-unit><trans-unit id="key2"><source xml:lang="en">Key #2 &amp;</source><target>Кнопка #2 &amp;</target></trans-unit></body></file></xliff>';
	const originalFilePath = 'base/common/keybinding';
	const keys = ['key1', 'key2'];
	const messages = ['Key #1', 'Key #2 &'];
	const translatedMessages = { key1: 'Кнопка #1', key2: 'Кнопка #2 &' };

	test('Keys & messages to XLF conversion', () => {
		const xlf = new i18n.XLF('vscode-workbench');
		xlf.addFile(originalFilePath, keys, messages);
		const xlfString = xlf.toString();

		assert.strictEqual(xlfString.replace(/\s{2,}/g, ''), sampleXlf);
	});

	test('XLF to keys & messages conversion', () => {
		i18n.XLF.parse(sampleTranslatedXlf).then(function(resolvedFiles) {
			assert.deepEqual(resolvedFiles[0].messages, translatedMessages);
			assert.strictEqual(resolvedFiles[0].originalFilePath, originalFilePath);
		});
	});

	test('JSON file source path to Transifex resource match', () => {
		const editorProject: string = 'vscode-editor',
			workbenchProject: string = 'vscode-workbench';

		const platform: i18n.Resource = { name: 'platform', project: editorProject },
			editorContrib = { name: 'editor/contrib', project: editorProject },
			editor = { name: 'editor', project: editorProject },
			base = { name: 'base', project: editorProject },
			code = { name: 'code', project: workbenchProject },
			workbenchParts = { name: 'workbench/parts/html', project: workbenchProject },
			workbenchServices = { name: 'workbench/services/files', project: workbenchProject },
			workbench = { name: 'workbench', project: workbenchProject};

		assert.deepEqual(i18n.getResource('platform/actions/browser/menusExtensionPoint'), platform);
		assert.deepEqual(i18n.getResource('editor/contrib/clipboard/browser/clipboard'), editorContrib);
		assert.deepEqual(i18n.getResource('editor/common/modes/modesRegistry'), editor);
		assert.deepEqual(i18n.getResource('base/common/errorMessage'), base);
		assert.deepEqual(i18n.getResource('code/electron-main/window'), code);
		assert.deepEqual(i18n.getResource('workbench/parts/html/browser/webview'), workbenchParts);
		assert.deepEqual(i18n.getResource('workbench/services/files/node/fileService'), workbenchServices);
		assert.deepEqual(i18n.getResource('workbench/browser/parts/panel/panelActions'), workbench);
	});
});