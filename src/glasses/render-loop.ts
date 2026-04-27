import type { HudRenderState } from './types';
import type { HudSession } from './session';
import type { Router } from './router';

let session: HudSession | null = null;
let router: Router | null = null;
let isRendering = false;
let renderQueued = false;

export function initRenderLoop(glassesSession: HudSession, glassesRouter: Router): void {
  session = glassesSession;
  router = glassesRouter;
}

export function scheduleRender(): void {
  if (!session || !router) return;
  if (isRendering) {
    renderQueued = true;
    return;
  }
  isRendering = true;
  void doRender()
    .catch((error) => { console.error('[GlassesRender] render failed', error); })
    .finally(() => {
      isRendering = false;
      if (renderQueued) {
        renderQueued = false;
        scheduleRender();
      }
    });
}

async function doRender(): Promise<void> {
  if (!session || !router) return;
  const { appStore } = await import('../app/store');
  const state = appStore.getState();

  let next: HudRenderState;
  if (state.phase === 'ready') {
    next = {
      layout: router.currentView.layout(),
      textContents: router.currentView.contents(),
    };
  } else {
    const { buildStatusRenderState } = await import('./screens/status/status-view');
    next = buildStatusRenderState(state.phase, state.statusMessage);
  }

  await session.render(next);
}
