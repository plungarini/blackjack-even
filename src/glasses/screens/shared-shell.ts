import type { HudLayoutDescriptor } from '../types';
import { HUD_WIDTH, HUD_HEIGHT, HUD_BORDER_RADIUS } from '../constants';
import { alignRow } from '../utils';

export const ROOT_LAYOUT: HudLayoutDescriptor = {
  key: 'root',
  textDescriptors: [
    {
      containerID: 0,
      containerName: 'shield',
      xPosition: 0,
      yPosition: 0,
      width: 0,
      height: HUD_HEIGHT,
      isEventCapture: 1,
    },
    {
      containerID: 1,
      containerName: 'header',
      xPosition: 12,
      yPosition: 0,
      width: HUD_WIDTH - 24,
      height: 38,
      paddingLength: 4,
    },
    {
      containerID: 2,
      containerName: 'body',
      xPosition: 0,
      yPosition: 36,
      width: HUD_WIDTH,
      height: 216,
      paddingLength: 14,
      borderWidth: 1,
      borderColor: 13,
      borderRadius: HUD_BORDER_RADIUS,
    },
    {
      containerID: 3,
      containerName: 'footer',
      xPosition: 10,
      yPosition: 254,
      width: HUD_WIDTH - 20,
      height: 34,
      paddingLength: 2,
    },
  ],
};

export const BODY_INNER_WIDTH = HUD_WIDTH - 2 * 14 - 2; // 546px

export type RootViewKey = 'count' | 'train' | 'strategy' | 'stats' | 'settings';

const TAB_LABELS: Record<RootViewKey, string> = {
  count: 'Count',
  train: 'Train',
  strategy: 'Strat',
  stats: 'Stats',
  settings: 'Sett',
};

export function buildHeader(viewName: string): string {
  return alignRow('♠ Blackjack', viewName, BODY_INNER_WIDTH);
}

export function buildFooter(active: RootViewKey): string {
  const tabs: RootViewKey[] = ['count', 'strategy', 'train', 'stats', 'settings'];
  return tabs.map((t) => (t === active ? `[${TAB_LABELS[t]}]` : ` ${TAB_LABELS[t]} `)).join('   ');
}
