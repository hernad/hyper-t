/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationTokenSource } from 'base/common/cancellation';
import { Emitter } from 'base/common/event';
import { KeyChord, KeyMod as ConstKeyMod } from 'base/common/keyCodes';
import { URI } from 'base/common/uri';
import { TPromise } from 'base/common/winjs.base';
import { Position } from 'editor/common/core/position';
import { Range } from 'editor/common/core/range';
import { Selection } from 'editor/common/core/selection';
import { Token } from 'editor/common/core/token';
import * as standaloneEnums from 'editor/common/standalone/standaloneEnums';

export class KeyMod {
	public static readonly CtrlCmd: number = ConstKeyMod.CtrlCmd;
	public static readonly Shift: number = ConstKeyMod.Shift;
	public static readonly Alt: number = ConstKeyMod.Alt;
	public static readonly WinCtrl: number = ConstKeyMod.WinCtrl;

	public static chord(firstPart: number, secondPart: number): number {
		return KeyChord(firstPart, secondPart);
	}
}

export function createMonacoBaseAPI(): typeof monaco {
	return {
		editor: undefined!, // undefined override expected here
		languages: undefined!, // undefined override expected here
		CancellationTokenSource: CancellationTokenSource,
		Emitter: Emitter,
		KeyCode: standaloneEnums.KeyCode,
		KeyMod: KeyMod,
		Position: Position,
		Range: Range,
		Selection: <any>Selection,
		SelectionDirection: standaloneEnums.SelectionDirection,
		MarkerSeverity: standaloneEnums.MarkerSeverity,
		MarkerTag: standaloneEnums.MarkerTag,
		Promise: TPromise,
		Uri: <any>URI,
		Token: Token
	};
}
