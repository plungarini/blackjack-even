import type { EvenAppBridge } from '@evenrealities/even_hub_sdk';
import type { Router } from './router';

export function initEventDispatcher(bridge: EvenAppBridge, router: Router): void {
  bridge.onEvenHubEvent((event) => {
    try {
      router.currentView.handleEvent(event);
    } catch (error) {
      console.error('[GlassesEvents] handler threw', error);
    }
  });
}
