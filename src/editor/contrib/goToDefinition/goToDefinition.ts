/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { flatten, coalesce } from 'base/common/arrays';
import { CancellationToken } from 'base/common/cancellation';
import { onUnexpectedExternalError } from 'base/common/errors';
import { registerDefaultLanguageCommand } from 'editor/browser/editorExtensions';
import { Position } from 'editor/common/core/position';
import { ITextModel } from 'editor/common/model';
import { DefinitionLink, DefinitionProviderRegistry, ImplementationProviderRegistry, TypeDefinitionProviderRegistry, DeclarationProviderRegistry } from 'editor/common/modes';
import { LanguageFeatureRegistry } from 'editor/common/modes/languageFeatureRegistry';


function getDefinitions<T>(
	model: ITextModel,
	position: Position,
	registry: LanguageFeatureRegistry<T>,
	provide: (provider: T, model: ITextModel, position: Position) => DefinitionLink | DefinitionLink[] | null | undefined | Thenable<DefinitionLink | DefinitionLink[] | null | undefined>
): Thenable<DefinitionLink[]> {
	const provider = registry.ordered(model);

	// get results
	const promises = provider.map((provider): Thenable<DefinitionLink | DefinitionLink[] | null | undefined> => {
		return Promise.resolve(provide(provider, model, position)).then(undefined, err => {
			onUnexpectedExternalError(err);
			return null;
		});
	});
	return Promise.all(promises)
		.then(flatten)
		.then(coalesce);
}


export function getDefinitionsAtPosition(model: ITextModel, position: Position, token: CancellationToken): Thenable<DefinitionLink[]> {
	return getDefinitions(model, position, DefinitionProviderRegistry, (provider, model, position) => {
		return provider.provideDefinition(model, position, token);
	});
}

export function getDeclarationsAtPosition(model: ITextModel, position: Position, token: CancellationToken): Thenable<DefinitionLink[]> {
	return getDefinitions(model, position, DeclarationProviderRegistry, (provider, model, position) => {
		return provider.provideDeclaration(model, position, token);
	});
}

export function getImplementationsAtPosition(model: ITextModel, position: Position, token: CancellationToken): Thenable<DefinitionLink[]> {
	return getDefinitions(model, position, ImplementationProviderRegistry, (provider, model, position) => {
		return provider.provideImplementation(model, position, token);
	});
}

export function getTypeDefinitionsAtPosition(model: ITextModel, position: Position, token: CancellationToken): Thenable<DefinitionLink[]> {
	return getDefinitions(model, position, TypeDefinitionProviderRegistry, (provider, model, position) => {
		return provider.provideTypeDefinition(model, position, token);
	});
}

registerDefaultLanguageCommand('_executeDefinitionProvider', (model, position) => getDefinitionsAtPosition(model, position, CancellationToken.None));
registerDefaultLanguageCommand('_executeDeclarationProvider', (model, position) => getDeclarationsAtPosition(model, position, CancellationToken.None));
registerDefaultLanguageCommand('_executeImplementationProvider', (model, position) => getImplementationsAtPosition(model, position, CancellationToken.None));
registerDefaultLanguageCommand('_executeTypeDefinitionProvider', (model, position) => getTypeDefinitionsAtPosition(model, position, CancellationToken.None));
