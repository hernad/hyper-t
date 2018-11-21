/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Base
import 'base/common/strings';
import 'base/common/errors';

// Configuration
import 'workbench/services/configuration/common/configurationExtensionPoint';

// Editor
import 'editor/editor.all';

// Platform
import 'platform/widget/browser/contextScopedHistoryWidget';
import 'platform/label/electron-browser/label.contribution';

// Menus/Actions
import 'workbench/services/actions/electron-browser/menusExtensionPoint';

// Views
import 'workbench/api/browser/viewsContainersExtensionPoint';
import 'workbench/api/browser/viewsExtensionPoint';

// Localizations
import 'workbench/parts/localizations/electron-browser/localizations.contribution';

// Workbench
import 'workbench/browser/actions/toggleActivityBarVisibility';
import 'workbench/browser/actions/toggleStatusbarVisibility';
import 'workbench/browser/actions/toggleSidebarVisibility';
import 'workbench/browser/actions/toggleSidebarPosition';
import 'workbench/browser/actions/toggleEditorLayout';
import 'workbench/browser/actions/toggleZenMode';
import 'workbench/browser/actions/toggleCenteredLayout';
import 'workbench/browser/actions/toggleTabsVisibility';
import 'workbench/parts/preferences/electron-browser/preferences.contribution';
import 'workbench/parts/preferences/browser/keybindingsEditorContribution';
import 'workbench/parts/logs/electron-browser/logs.contribution';

import 'workbench/browser/parts/quickopen/quickopen.contribution';
import 'workbench/parts/quickopen/browser/quickopen.contribution';
import 'workbench/browser/parts/editor/editorPicker';
import 'workbench/browser/parts/quickinput/quickInput.contribution';

import 'workbench/parts/files/electron-browser/explorerViewlet';
import 'workbench/parts/files/electron-browser/fileActions.contribution';
import 'workbench/parts/files/electron-browser/files.contribution';

import 'workbench/parts/backup/common/backup.contribution';

import 'workbench/parts/stats/node/stats.contribution';

import 'workbench/parts/splash/electron-browser/partsSplash.contribution';

import 'workbench/parts/search/electron-browser/search.contribution';
import 'workbench/parts/search/browser/searchView';
import 'workbench/parts/search/browser/openAnythingHandler';

import 'workbench/parts/scm/electron-browser/scm.contribution';
import 'workbench/parts/scm/electron-browser/scmViewlet';

// hernad debug out
// import 'workbench/parts/debug/electron-browser/debug.contribution';
// import 'workbench/parts/debug/browser/debugQuickOpen';
// import 'workbench/parts/debug/electron-browser/repl';
// import 'workbench/parts/debug/browser/debugViewlet';

import 'workbench/parts/markers/electron-browser/markers.contribution';
import 'workbench/parts/comments/electron-browser/comments.contribution';

import 'workbench/parts/html/electron-browser/html.contribution';

import 'workbench/parts/url/electron-browser/url.contribution';
import 'workbench/parts/webview/electron-browser/webview.contribution';

import 'workbench/parts/welcome/walkThrough/electron-browser/walkThrough.contribution';

import 'workbench/parts/extensions/electron-browser/extensions.contribution';
import 'workbench/parts/extensions/browser/extensionsQuickOpen';
import 'workbench/parts/extensions/electron-browser/extensionsViewlet';

// import 'workbench/parts/welcome/page/electron-browser/welcomePage.contribution';

import 'workbench/parts/output/electron-browser/output.contribution';
import 'workbench/parts/output/browser/outputPanel';

import 'workbench/parts/terminal/electron-browser/terminal.contribution';
import 'workbench/parts/terminal/browser/terminalQuickOpen';
import 'workbench/parts/terminal/electron-browser/terminalPanel';

import 'workbench/electron-browser/workbench';

import 'workbench/parts/relauncher/electron-browser/relauncher.contribution';

import 'workbench/parts/tasks/electron-browser/task.contribution';

import 'workbench/parts/emmet/browser/emmet.browser.contribution';
import 'workbench/parts/emmet/electron-browser/emmet.contribution';

import 'workbench/parts/codeEditor/codeEditor.contribution';

import 'workbench/parts/execution/electron-browser/execution.contribution';

// import 'workbench/parts/snippets/electron-browser/snippets.contribution';
// import 'workbench/parts/snippets/electron-browser/snippetsService';

//import 'workbench/parts/snippets/electron-browser/insertSnippet';
//import 'workbench/parts/snippets/electron-browser/configureSnippets';
import 'workbench/parts/snippets/electron-browser/tabCompletion';

import 'workbench/parts/themes/electron-browser/themes.contribution';

import 'workbench/parts/feedback/electron-browser/feedback.contribution';

import 'workbench/parts/welcome/gettingStarted/electron-browser/gettingStarted.contribution';

import 'workbench/parts/update/electron-browser/update.contribution';

import 'workbench/parts/surveys/electron-browser/nps.contribution';
import 'workbench/parts/surveys/electron-browser/languageSurveys.contribution';

import 'workbench/parts/performance/electron-browser/performance.contribution';

import 'workbench/parts/cli/electron-browser/cli.contribution';

import 'workbench/api/electron-browser/extensionHost.contribution';

import 'workbench/electron-browser/main.contribution';
import 'workbench/electron-browser/main';

// import 'workbench/parts/themes/test/electron-browser/themes.test.contribution';

import 'workbench/parts/watermark/electron-browser/watermark';

import 'workbench/parts/welcome/overlay/browser/welcomeOverlay';

import 'workbench/parts/outline/electron-browser/outline.contribution';

import 'workbench/services/bulkEdit/electron-browser/bulkEditService';

import 'workbench/parts/experiments/electron-browser/experiments.contribution';
