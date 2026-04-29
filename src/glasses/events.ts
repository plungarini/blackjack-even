import { OsEventTypeList } from '@evenrealities/even_hub_sdk';
import type { EvenAppBridge, EvenHubEvent } from '@evenrealities/even_hub_sdk';
import type { Router } from './router';

const SCROLL_COOLDOWN_MS = 300;
const DOUBLE_CLICK_COOLDOWN_MS = 300;
let lastScrollTime = 0;
let lastDoubleClickTime = 0;

function resolveEventType(event: EvenHubEvent): number | undefined {
	return event.textEvent?.eventType ?? event.sysEvent?.eventType ?? event.listEvent?.eventType;
}

function isScrollEvent(type: number | undefined): boolean {
	return type === OsEventTypeList.SCROLL_TOP_EVENT || type === OsEventTypeList.SCROLL_BOTTOM_EVENT;
}

function isDoubleClickEvent(type: number | undefined): boolean {
	return type === OsEventTypeList.DOUBLE_CLICK_EVENT;
}

export function initEventDispatcher(bridge: EvenAppBridge, router: Router): void {
	bridge.onEvenHubEvent((event) => {
		try {
			const type = resolveEventType(event);
			const now = Date.now();
			if (isScrollEvent(type)) {
				if (now - lastScrollTime < SCROLL_COOLDOWN_MS) return;
				lastScrollTime = now;
			}
			if (isDoubleClickEvent(type)) {
				if (now - lastDoubleClickTime < DOUBLE_CLICK_COOLDOWN_MS) return;
				lastDoubleClickTime = now;
			}
			router.currentView.handleEvent(event);
		} catch (error) {
			console.error('[GlassesEvents] handler threw', error);
		}
	});
}
