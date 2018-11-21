/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { first } from 'base/common/async';
import { onUnexpectedExternalError } from 'base/common/errors';
import { registerDefaultLanguageCommand } from 'editor/browser/editorExtensions';
import { Position } from 'editor/common/core/position';
import { ITextModel } from 'editor/common/model';
import * as modes from 'editor/common/modes';
import { RawContextKey } from 'platform/contextkey/common/contextkey';
import { CancellationToken } from 'base/common/cancellation';

export const Context = {
	Visible: new RawContextKey<boolean>('parameterHintsVisible', false),
	MultipleSignatures: new RawContextKey<boolean>('parameterHintsMultipleSignatures', false),
};

export function provideSignatureHelp(model: ITextModel, position: Position, context: modes.SignatureHelpContext, token: CancellationToken): Promise<modes.SignatureHelp | null | undefined> {

	const supports = modes.SignatureHelpProviderRegistry.ordered(model);

	return first(supports.map(support => () => {
		return Promise.resolve(support.provideSignatureHelp(model, position, token, context)).catch(onUnexpectedExternalError);
	}));
}

registerDefaultLanguageCommand('_executeSignatureHelpProvider', (model, position) =>
	provideSignatureHelp(model, position, {
		triggerReason: modes.SignatureHelpTriggerReason.Invoke,
		isRetrigger: false
	}, CancellationToken.None));
