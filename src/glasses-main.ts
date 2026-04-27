import { OsEventTypeList, type EvenHubEvent, waitForEvenAppBridge } from '@evenrealities/even_hub_sdk';
import { HudSession } from './glasses/session';
import type { HudViewState } from './glasses/types';
import {
  createInitialHudState,
  setHudReady,
  toHudRenderState,
  touchHudClock,
} from './glasses/view';

let state: HudViewState = createInitialHudState();
let bridgeRef: Awaited<ReturnType<typeof waitForEvenAppBridge>> | null = null;
let session: HudSession | null = null;

function resolveEventType(event: EvenHubEvent) {
  return event.textEvent?.eventType ?? event.sysEvent?.eventType ?? event.listEvent?.eventType;
}

async function render(): Promise<void> {
  if (!session) return;
  await session.render(toHudRenderState(state));
}

async function handleEvent(event: EvenHubEvent): Promise<void> {
  if (!bridgeRef) return;
  const type = resolveEventType(event);

  // Double tap → shut down the HUD page (returns user to the Even app menu).
  if (type === OsEventTypeList.DOUBLE_CLICK_EVENT) {
    await bridgeRef.shutDownPageContainer(1);
    return;
  }

  // Single click / undefined (CLICK_EVENT === 0 sometimes arrives as undefined).
  if (type === OsEventTypeList.CLICK_EVENT || type === undefined) {
    state = touchHudClock(state);
    await render();
  }
}

async function boot(): Promise<void> {
  try {
    console.log('[GlassesMain] waiting for Even bridge...');
    bridgeRef = await waitForEvenAppBridge();
    console.log('[GlassesMain] bridge acquired');

    session = new HudSession(bridgeRef);
    bridgeRef.onEvenHubEvent((event) => {
      void handleEvent(event);
    });

    state = setHudReady(state, 'Hello from Blackjack');
    await render();

    // Tick once a minute to keep any time-sensitive content fresh.
    window.setInterval(() => {
      state = touchHudClock(state);
      void render();
    }, 60_000);
  } catch (error) {
    console.warn('[GlassesMain] bridge unavailable — running in web-only mode', error);
  }
}

void boot();
