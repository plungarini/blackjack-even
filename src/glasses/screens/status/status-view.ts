import type { HudRenderState } from '../../types';
import { ROOT_LAYOUT, BODY_INNER_WIDTH } from '../shared-shell';
import { centerLine } from '../../utils';

export function buildStatusRenderState(
  phase: string,
  statusMessage: string | null,
): HudRenderState {
  const body =
    phase === 'booting'
      ? `\n\n${centerLine('Loading…', BODY_INNER_WIDTH)}`
      : `\n\n${centerLine(statusMessage ?? 'An error occurred', BODY_INNER_WIDTH)}`;

  return {
    layout: ROOT_LAYOUT,
    textContents: {
      shield: '',
      header: centerLine('♠ Blackjack', BODY_INNER_WIDTH),
      body,
      footer: '',
    },
  };
}
