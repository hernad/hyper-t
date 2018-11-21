/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'css!./media/sidebarpart';
import { TPromise } from 'base/common/winjs.base';
import * as nls from 'base/nls';
import { Registry } from 'platform/registry/common/platform';
import { Action } from 'base/common/actions';
import { CompositePart } from 'workbench/browser/parts/compositePart';
import { Viewlet, ViewletRegistry, Extensions as ViewletExtensions } from 'workbench/browser/viewlet';
import { IWorkbenchActionRegistry, Extensions as ActionExtensions } from 'workbench/common/actions';
import { SyncActionDescriptor } from 'platform/actions/common/actions';
import { IViewletService } from 'workbench/services/viewlet/browser/viewlet';
import { IPartService, Parts, Position as SideBarPosition } from 'workbench/services/part/common/partService';
import { IViewlet } from 'workbench/common/viewlet';
import { IStorageService } from 'platform/storage/common/storage';
import { IContextMenuService } from 'platform/contextview/browser/contextView';
import { ITelemetryService } from 'platform/telemetry/common/telemetry';
import { IKeybindingService } from 'platform/keybinding/common/keybinding';
import { KeyMod, KeyCode } from 'base/common/keyCodes';
import { IInstantiationService } from 'platform/instantiation/common/instantiation';
import { Event, mapEvent } from 'base/common/event';
import { IThemeService } from 'platform/theme/common/themeService';
import { contrastBorder } from 'platform/theme/common/colorRegistry';
import { SIDE_BAR_TITLE_FOREGROUND, SIDE_BAR_BACKGROUND, SIDE_BAR_FOREGROUND, SIDE_BAR_BORDER } from 'workbench/common/theme';
import { INotificationService } from 'platform/notification/common/notification';
import { Dimension, EventType, addDisposableListener, trackFocus } from 'base/browser/dom';
import { StandardMouseEvent } from 'base/browser/mouseEvent';
import { RawContextKey, IContextKey, IContextKeyService } from 'platform/contextkey/common/contextkey';

const SideBarFocusContextId = 'sideBarFocus';
export const SidebarFocusContext = new RawContextKey<boolean>(SideBarFocusContextId, false);

export class SidebarPart extends CompositePart<Viewlet> {

	static readonly activeViewletSettingsKey = 'workbench.sidebar.activeviewletid';

	private sideBarFocusContextKey: IContextKey<boolean>;
	private blockOpeningViewlet: boolean;

	constructor(
		id: string,
		@INotificationService notificationService: INotificationService,
		@IStorageService storageService: IStorageService,
		@ITelemetryService telemetryService: ITelemetryService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IPartService partService: IPartService,
		@IKeybindingService keybindingService: IKeybindingService,
		@IInstantiationService instantiationService: IInstantiationService,
		@IThemeService themeService: IThemeService,
		@IContextKeyService contextKeyService: IContextKeyService,
	) {
		super(
			notificationService,
			storageService,
			telemetryService,
			contextMenuService,
			partService,
			keybindingService,
			instantiationService,
			themeService,
			Registry.as<ViewletRegistry>(ViewletExtensions.Viewlets),
			SidebarPart.activeViewletSettingsKey,
			Registry.as<ViewletRegistry>(ViewletExtensions.Viewlets).getDefaultViewletId(),
			'sideBar',
			'viewlet',
			SIDE_BAR_TITLE_FOREGROUND,
			id,
			{ hasTitle: true, borderWidth: () => (this.getColor(SIDE_BAR_BORDER) || this.getColor(contrastBorder)) ? 1 : 0 }
		);

		this.sideBarFocusContextKey = SidebarFocusContext.bindTo(contextKeyService);
	}

	get onDidViewletOpen(): Event<IViewlet> {
		return mapEvent(this._onDidCompositeOpen.event, compositeEvent => <IViewlet>compositeEvent.composite);
	}

	get onDidViewletClose(): Event<IViewlet> {
		return this._onDidCompositeClose.event as Event<IViewlet>;
	}

	create(parent: HTMLElement): void {
		super.create(parent);

		const focusTracker = trackFocus(parent);

		focusTracker.onDidFocus(() => {
			this.sideBarFocusContextKey.set(true);
		});
		focusTracker.onDidBlur(() => {
			this.sideBarFocusContextKey.set(false);
		});
	}

	createTitleArea(parent: HTMLElement): HTMLElement {
		const titleArea = super.createTitleArea(parent);

		this._register(addDisposableListener(titleArea, EventType.CONTEXT_MENU, e => {
			this.onTitleAreaContextMenu(new StandardMouseEvent(e));
		}));

		return titleArea;
	}

	updateStyles(): void {
		super.updateStyles();

		// Part container
		const container = this.getContainer();

		container.style.backgroundColor = this.getColor(SIDE_BAR_BACKGROUND);
		container.style.color = this.getColor(SIDE_BAR_FOREGROUND);

		const borderColor = this.getColor(SIDE_BAR_BORDER) || this.getColor(contrastBorder);
		const isPositionLeft = this.partService.getSideBarPosition() === SideBarPosition.LEFT;
		container.style.borderRightWidth = borderColor && isPositionLeft ? '1px' : null;
		container.style.borderRightStyle = borderColor && isPositionLeft ? 'solid' : null;
		container.style.borderRightColor = isPositionLeft ? borderColor : null;
		container.style.borderLeftWidth = borderColor && !isPositionLeft ? '1px' : null;
		container.style.borderLeftStyle = borderColor && !isPositionLeft ? 'solid' : null;
		container.style.borderLeftColor = !isPositionLeft ? borderColor : null;
	}

	openViewlet(id: string, focus?: boolean): Viewlet {
		if (this.blockOpeningViewlet) {
			return null; // Workaround against a potential race condition
		}

		// First check if sidebar is hidden and show if so
		if (!this.partService.isVisible(Parts.SIDEBAR_PART)) {
			try {
				this.blockOpeningViewlet = true;
				this.partService.setSideBarHidden(false);
			} finally {
				this.blockOpeningViewlet = false;
			}
		}

		return this.openComposite(id, focus) as Viewlet;
	}

	getActiveViewlet(): IViewlet {
		return <IViewlet>this.getActiveComposite();
	}

	getLastActiveViewletId(): string {
		return this.getLastActiveCompositetId();
	}

	hideActiveViewlet(): void {
		this.hideActiveComposite();
	}

	layout(dimension: Dimension): Dimension[] {
		if (!this.partService.isVisible(Parts.SIDEBAR_PART)) {
			return [dimension];
		}

		return super.layout(dimension);
	}

	private onTitleAreaContextMenu(event: StandardMouseEvent): void {
		const activeViewlet = this.getActiveViewlet() as Viewlet;
		if (activeViewlet) {
			const contextMenuActions = activeViewlet ? activeViewlet.getContextMenuActions() : [];
			if (contextMenuActions.length) {
				const anchor: { x: number, y: number } = { x: event.posx, y: event.posy };
				this.contextMenuService.showContextMenu({
					getAnchor: () => anchor,
					getActions: () => contextMenuActions,
					getActionItem: action => this.actionItemProvider(action as Action),
					actionRunner: activeViewlet.getActionRunner()
				});
			}
		}
	}
}

class FocusSideBarAction extends Action {

	static readonly ID = 'workbench.action.focusSideBar';
	static readonly LABEL = nls.localize('focusSideBar', "Focus into Side Bar");

	constructor(
		id: string,
		label: string,
		@IViewletService private viewletService: IViewletService,
		@IPartService private partService: IPartService
	) {
		super(id, label);
	}

	run(): TPromise<any> {

		// Show side bar
		if (!this.partService.isVisible(Parts.SIDEBAR_PART)) {
			return Promise.resolve(this.partService.setSideBarHidden(false));
		}

		// Focus into active viewlet
		let viewlet = this.viewletService.getActiveViewlet();
		if (viewlet) {
			viewlet.focus();
		}
		return Promise.resolve(true);
	}
}

const registry = Registry.as<IWorkbenchActionRegistry>(ActionExtensions.WorkbenchActions);
registry.registerWorkbenchAction(new SyncActionDescriptor(FocusSideBarAction, FocusSideBarAction.ID, FocusSideBarAction.LABEL, {
	primary: KeyMod.CtrlCmd | KeyCode.KEY_0
}), 'View: Focus into Side Bar', nls.localize('viewCategory', "View"));
