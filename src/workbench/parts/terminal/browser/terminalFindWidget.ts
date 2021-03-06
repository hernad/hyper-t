/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'css!./terminalFindWidget';
import { SimpleFindWidget } from 'editor/contrib/find/simpleFindWidget';
import { IContextViewService } from 'platform/contextview/browser/contextView';
import { ITerminalService, KEYBINDING_CONTEXT_TERMINAL_FIND_WIDGET_INPUT_FOCUSED, KEYBINDING_CONTEXT_TERMINAL_FIND_WIDGET_FOCUSED } from 'workbench/parts/terminal/common/terminal';
import { IContextKeyService, IContextKey } from 'platform/contextkey/common/contextkey';
import { FindReplaceState } from 'editor/contrib/find/findState';

export class TerminalFindWidget extends SimpleFindWidget {
	protected _findInputFocused: IContextKey<boolean>;
	protected _findWidgetFocused: IContextKey<boolean>;

	constructor(
		findState: FindReplaceState,
		@IContextViewService _contextViewService: IContextViewService,
		@IContextKeyService private readonly _contextKeyService: IContextKeyService,
		@ITerminalService private readonly _terminalService: ITerminalService
	) {
		super(_contextViewService, _contextKeyService, findState, true);
		this._register(findState.onFindReplaceStateChange(() => {
			this.show();
		}));
		this._findInputFocused = KEYBINDING_CONTEXT_TERMINAL_FIND_WIDGET_INPUT_FOCUSED.bindTo(this._contextKeyService);
		this._findWidgetFocused = KEYBINDING_CONTEXT_TERMINAL_FIND_WIDGET_FOCUSED.bindTo(this._contextKeyService);
	}

	public find(previous: boolean) {
		const instance = this._terminalService.getActiveInstance();
		if (instance !== null) {
			if (previous) {
				instance.findPrevious(this.inputValue, { regex: this._getRegexValue(), wholeWord: this._getWholeWordValue(), caseSensitive: this._getCaseSensitiveValue() });
			} else {
				instance.findNext(this.inputValue, { regex: this._getRegexValue(), wholeWord: this._getWholeWordValue(), caseSensitive: this._getCaseSensitiveValue() });
			}
		}
	}

	public hide() {
		super.hide();
		this._terminalService.getActiveInstance().focus();
	}

	protected onInputChanged() {
		// Ignore input changes for now
	}

	protected onFocusTrackerFocus() {
		this._terminalService.getActiveInstance().notifyFindWidgetFocusChanged(true);
		this._findWidgetFocused.set(true);
	}

	protected onFocusTrackerBlur() {
		this._terminalService.getActiveInstance().notifyFindWidgetFocusChanged(false);
		this._findWidgetFocused.reset();
	}

	protected onFindInputFocusTrackerFocus() {
		this._findInputFocused.set(true);
	}

	protected onFindInputFocusTrackerBlur() {
		this._findInputFocused.reset();
	}
}