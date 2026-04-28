import {
  CreateStartUpPageContainer,
  RebuildPageContainer,
  StartUpPageCreateResult,
  TextContainerUpgrade,
  type EvenAppBridge,
} from '@evenrealities/even_hub_sdk';
import type { HudRenderState } from './types';
import { instantiateLayout } from './utils';

// ── Module-level session state ─────────────────────────────────────
// These survive component remounts, React StrictMode double-init, and
// multiple `new HudSession()` calls. The Even bridge only accepts ONE
// `createStartUpPageContainer` per app lifetime.

let pageCreated = false;
let activeLayoutKey: string | null = null;
let lastContents: Record<string, string> = {};

/** Exposed for testing/diagnostic purposes only. */
export function __getSessionDebug() {
  return { pageCreated, activeLayoutKey, lastContents };
}

export class HudSession {
  private readonly bridge: EvenAppBridge;

  constructor(bridge: EvenAppBridge) {
    this.bridge = bridge;
  }

  async render(next: HudRenderState): Promise<void> {
    const params = instantiateLayout(next.layout, next.textContents);

    // ── Initial page creation ────────────────────────────────────
    if (!pageCreated) {
      console.log(
        `[HUD-SESSION] createStartUpPage  key=${next.layout.key}  containers=${params.containerTotalNum}`,
      );
      let created: StartUpPageCreateResult;
      try {
        created = await this.bridge.createStartUpPageContainer(new CreateStartUpPageContainer(params));
      } catch (error) {
        console.error('[HUD-SESSION] createStartUpPage threw', error);
        return;
      }
      console.log(`[HUD-SESSION] createStartUpPage result=${created}`);

      if (created === StartUpPageCreateResult.success) {
        pageCreated = true;
        activeLayoutKey = next.layout.key;
        lastContents = { ...next.textContents };
        return;
      }

      // Session takeover: the bridge already has a page. Fall back to rebuild.
      console.error(
        '[HUD-SESSION] createStartUpPage failed, attempting rebuild fallback',
      );
      try {
        const ok = await this.bridge.rebuildPageContainer(new RebuildPageContainer(params));
        if (ok) {
          pageCreated = true;
          activeLayoutKey = next.layout.key;
          lastContents = { ...next.textContents };
          return;
        }
        console.error('[HUD-SESSION] rebuild fallback failed, will retry on next render');
      } catch (error) {
        console.error('[HUD-SESSION] rebuild fallback threw', error);
      }
      return;
    }

    // ── Layout swap (different container structure) ──────────────
    if (activeLayoutKey !== next.layout.key) {
      console.log(
        `[HUD-SESSION] rebuildPage  old=${activeLayoutKey}  new=${next.layout.key}  containers=${params.containerTotalNum}`,
      );
      let ok = false;
      try {
        ok = await this.bridge.rebuildPageContainer(new RebuildPageContainer(params));
      } catch (error) {
        console.error('[HUD-SESSION] rebuildPage threw', error);
      }
      if (!ok) {
        console.error('[HUD-SESSION] rebuildPage failed, will retry on next render');
        return;
      }
      activeLayoutKey = next.layout.key;
      lastContents = {};
      // Fall through so `applyUpgrades` resynchronises content strings
      // after the rebuild.
    }

    await this.applyUpgrades(next);
  }

  private async applyUpgrades(next: HudRenderState): Promise<void> {
    for (const descriptor of next.layout.textDescriptors) {
      const content = next.textContents[descriptor.containerName] ?? '';
      if (lastContents[descriptor.containerName] === content) continue;

      const previousLength = lastContents[descriptor.containerName]?.length ?? 0;
      let ok = false;
      try {
        ok = await this.bridge.textContainerUpgrade(
          new TextContainerUpgrade({
            containerID: descriptor.containerID,
            containerName: descriptor.containerName,
            contentOffset: 0,
            contentLength: Math.max(content.length, previousLength),
            content,
          }),
        );
      } catch (error) {
        console.error('[HUD-SESSION] textContainerUpgrade threw', descriptor.containerName, error);
        continue;
      }
      if (!ok) {
        console.error(
          '[HUD-SESSION] textContainerUpgrade failed',
          JSON.stringify({
            containerID: descriptor.containerID,
            containerName: descriptor.containerName,
            contentLen: content.length,
          }),
        );
        continue;
      }

      lastContents[descriptor.containerName] = content;
    }
  }
}
