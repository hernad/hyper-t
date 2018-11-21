/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { RenderingContext } from 'editor/common/view/renderingContext';
import { ViewEventHandler } from 'editor/common/viewModel/viewEventHandler';

export abstract class DynamicViewOverlay extends ViewEventHandler {

	public abstract prepareRender(ctx: RenderingContext): void;

	public abstract render(startLineNumber: number, lineNumber: number): string;

}
