import { OsEventTypeList } from '@evenrealities/even_hub_sdk';
import type { EvenAppBridge, EvenHubEvent } from '@evenrealities/even_hub_sdk';
import type { Router } from './router';

const SCROLL_COOLDOWN_MS = 300;
let lastScrollTime = 0;

function resolveEventType(event: EvenHubEvent): number | undefined {
	return event.textEvent?.eventType ?? event.sysEvent?.eventType ?? event.listEvent?.eventType;
}

function isScrollEvent(type: number | undefined): boolean {
	return type === OsEventTypeList.SCROLL_TOP_EVENT || type === OsEventTypeList.SCROLL_BOTTOM_EVENT;
}

export function initEventDispatcher(bridge: EvenAppBridge, router: Router): void {
	bridge.onEvenHubEvent((event) => {
		try {
			const type = resolveEventType(event);
			if (isScrollEvent(type)) {
				const now = Date.now();
				if (now - lastScrollTime < SCROLL_COOLDOWN_MS) return;
				lastScrollTime = now;
			}
			router.currentView.handleEvent(event);
		} catch (error) {
			console.error('[GlassesEvents] handler threw', error);
		}
	});
}
