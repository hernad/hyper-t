/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as dom from 'base/browser/dom';
import { IKeyboardEvent, StandardKeyboardEvent } from 'base/browser/keyboardEvent';
import { IMouseEvent, StandardMouseEvent } from 'base/browser/mouseEvent';
import { Disposable } from 'base/common/lifecycle';

export abstract class Widget extends Disposable {

	protected onclick(domNode: HTMLElement, listener: (e: IMouseEvent) => void): void {
		this._register(dom.addDisposableListener(domNode, dom.EventType.CLICK, (e: MouseEvent) => listener(new StandardMouseEvent(e))));
	}

	protected onmousedown(domNode: HTMLElement, listener: (e: IMouseEvent) => void): void {
		this._register(dom.addDisposableListener(domNode, dom.EventType.MOUSE_DOWN, (e: MouseEvent) => listener(new StandardMouseEvent(e))));
	}

	protected onmouseover(domNode: HTMLElement, listener: (e: IMouseEvent) => void): void {
		this._register(dom.addDisposableListener(domNode, dom.EventType.MOUSE_OVER, (e: MouseEvent) => listener(new StandardMouseEvent(e))));
	}

	protected onnonbubblingmouseout(domNode: HTMLElement, listener: (e: IMouseEvent) => void): void {
		this._register(dom.addDisposableNonBubblingMouseOutListener(domNode, (e: MouseEvent) => listener(new StandardMouseEvent(e))));
	}

	protected onkeydown(domNode: HTMLElement, listener: (e: IKeyboardEvent) => void): void {
		this._register(dom.addDisposableListener(domNode, dom.EventType.KEY_DOWN, (e: KeyboardEvent) => listener(new StandardKeyboardEvent(e))));
	}

	protected onkeyup(domNode: HTMLElement, listener: (e: IKeyboardEvent) => void): void {
		this._register(dom.addDisposableListener(domNode, dom.EventType.KEY_UP, (e: KeyboardEvent) => listener(new StandardKeyboardEvent(e))));
	}

	protected oninput(domNode: HTMLElement, listener: (e: Event) => void): void {
		this._register(dom.addDisposableListener(domNode, dom.EventType.INPUT, listener));
	}

	protected onblur(domNode: HTMLElement, listener: (e: Event) => void): void {
		this._register(dom.addDisposableListener(domNode, dom.EventType.BLUR, listener));
	}

	protected onfocus(domNode: HTMLElement, listener: (e: Event) => void): void {
		this._register(dom.addDisposableListener(domNode, dom.EventType.FOCUS, listener));
	}

	protected onchange(domNode: HTMLElement, listener: (e: Event) => void): void {
		this._register(dom.addDisposableListener(domNode, dom.EventType.CHANGE, listener));
	}
}
