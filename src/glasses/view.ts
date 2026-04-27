import type { HudLayoutDescriptor, HudRenderState, HudViewState } from './types';
import { centerLine } from './utils';

const HUD_WIDTH = 576;
const BODY_WIDTH = 544;
const BORDER_RADIUS = 12;

const TEXT_LAYOUT: HudLayoutDescriptor = {
  key: 'main',
  textDescriptors: [
    {
      containerID: 1,
      containerName: 'header',
      xPosition: 12,
      yPosition: 0,
      width: HUD_WIDTH - 24,
      height: 40,
      paddingLength: 4,
    },
    {
      containerID: 2,
      containerName: 'body',
      xPosition: 0,
      yPosition: 38,
      width: HUD_WIDTH,
      height: 212,
      paddingLength: 15,
      borderWidth: 1,
      borderColor: 13,
      borderRadius: BORDER_RADIUS,
      isEventCapture: 1,
    },
    {
      containerID: 3,
      containerName: 'footer',
      xPosition: 12,
      yPosition: 251,
      width: HUD_WIDTH - 24,
      height: 35,
      paddingLength: 4,
    },
  ],
};

export function createInitialHudState(): HudViewState {
  return {
    status: 'loading',
    now: new Date(),
    message: '',
  };
}

export function setHudReady(state: HudViewState, message: string): HudViewState {
  return { ...state, status: 'ready', now: new Date(), message };
}

export function setHudError(state: HudViewState, errorMessage: string): HudViewState {
  return { ...state, status: 'error', now: new Date(), errorMessage };
}

export function touchHudClock(state: HudViewState): HudViewState {
  return { ...state, now: new Date() };
}

export function toHudRenderState(state: HudViewState): HudRenderState {
  if (state.status === 'loading') {
    return {
      layout: TEXT_LAYOUT,
      textContents: {
        header: centerLine('Blackjack', BODY_WIDTH),
        body: `\n${centerLine('Loading…', BODY_WIDTH)}`,
        footer: '',
      },
    };
  }

  if (state.status === 'error') {
    return {
      layout: TEXT_LAYOUT,
      textContents: {
        header: centerLine('Blackjack', BODY_WIDTH),
        body: `\n${centerLine('Something went wrong', BODY_WIDTH)}\n\n${state.errorMessage ?? ''}`,
        footer: centerLine('Double tap to exit', BODY_WIDTH),
      },
    };
  }

  return {
    layout: TEXT_LAYOUT,
    textContents: {
      header: centerLine('Blackjack', BODY_WIDTH),
      body: `\n${centerLine(state.message, BODY_WIDTH)}`,
      footer: centerLine('Double tap to exit', BODY_WIDTH),
    },
  };
}
