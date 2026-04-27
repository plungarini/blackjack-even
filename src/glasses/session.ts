import {
  CreateStartUpPageContainer,
  RebuildPageContainer,
  StartUpPageCreateResult,
  TextContainerUpgrade,
  type EvenAppBridge,
} from '@evenrealities/even_hub_sdk';
import type { HudRenderState } from './types';
import { instantiateLayout } from './utils';

export class HudSession {
  private pageCreated = false;
  private activeLayoutKey: string | null = null;
  private lastContents: Record<string, string> = {};

  constructor(private readonly bridge: EvenAppBridge) {}

  async render(next: HudRenderState): Promise<void> {
    const params = instantiateLayout(next.layout, next.textContents);

    if (!this.pageCreated) {
      let created: StartUpPageCreateResult;
      try {
        created = await this.bridge.createStartUpPageContainer(new CreateStartUpPageContainer(params));
      } catch {
        return;
      }

      if (created === StartUpPageCreateResult.success) {
        this.pageCreated = true;
        this.activeLayoutKey = next.layout.key;
        this.lastContents = { ...next.textContents };
        return;
      }

      const takeover = await this.bridge.rebuildPageContainer(new RebuildPageContainer(params));
      if (takeover) {
        this.pageCreated = true;
        this.activeLayoutKey = next.layout.key;
        this.lastContents = { ...next.textContents };
      }
      return;
    }

    if (this.activeLayoutKey !== next.layout.key) {
      const ok = await this.bridge.rebuildPageContainer(new RebuildPageContainer(params));
      if (!ok) return;
      this.activeLayoutKey = next.layout.key;
      this.lastContents = {};
    }

    for (const descriptor of next.layout.textDescriptors) {
      const content = next.textContents[descriptor.containerName] ?? '';
      if (this.lastContents[descriptor.containerName] === content) continue;
      const previousLength = this.lastContents[descriptor.containerName]?.length ?? 0;
      const ok = await this.bridge.textContainerUpgrade(
        new TextContainerUpgrade({
          containerID: descriptor.containerID,
          containerName: descriptor.containerName,
          contentOffset: 0,
          contentLength: Math.max(previousLength, content.length),
          content,
        }),
      );
      if (ok) this.lastContents[descriptor.containerName] = content;
    }
  }
}
