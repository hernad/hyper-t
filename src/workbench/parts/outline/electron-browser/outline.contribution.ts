/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from 'base/nls';
import { ViewsRegistry, IViewDescriptor } from 'workbench/common/views';
import { OutlinePanel } from './outlinePanel';
import { VIEW_CONTAINER } from 'workbench/parts/files/common/files';
import { Registry } from 'platform/registry/common/platform';
import { IConfigurationRegistry, Extensions as ConfigurationExtensions } from 'platform/configuration/common/configurationRegistry';
import { OutlineConfigKeys, OutlineViewId } from 'workbench/parts/outline/electron-browser/outline';

const _outlineDesc = <IViewDescriptor>{
	id: OutlineViewId,
	name: localize('name', "Outline"),
	ctor: OutlinePanel,
	container: VIEW_CONTAINER,
	canToggleVisibility: true,
	hideByDefault: false,
	collapsed: true,
	order: 2,
	weight: 30,
	focusCommand: { id: 'outline.focus' }
};

ViewsRegistry.registerViews([_outlineDesc]);

Registry.as<IConfigurationRegistry>(ConfigurationExtensions.Configuration).registerConfiguration({
	'id': 'outline',
	'order': 117,
	'title': localize('outlineConfigurationTitle', "Outline"),
	'type': 'object',
	'properties': {
		[OutlineConfigKeys.icons]: {
			'description': localize('outline.showIcons', "Render Outline Elements with Icons."),
			'type': 'boolean',
			'default': true
		},
		[OutlineConfigKeys.problemsEnabled]: {
			'description': localize('outline.showProblem', "Show Errors & Warnings on Outline Elements."),
			'type': 'boolean',
			'default': true
		},
		[OutlineConfigKeys.problemsEnabled]: {
			'description': localize('outline.showProblem', "Show Errors & Warnings on Outline Elements."),
			'type': 'boolean',
			'default': true
		},
		[OutlineConfigKeys.problemsColors]: {
			'description': localize('outline.problem.colors', "Use colors for Errors & Warnings."),
			'type': 'boolean',
			'default': true
		},
		[OutlineConfigKeys.problemsBadges]: {
			'description': localize('outline.problems.badges', "Use badges for Errors & Warnings."),
			'type': 'boolean',
			'default': true
		}
	}
});
