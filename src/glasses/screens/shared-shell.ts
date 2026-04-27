import type { HudLayoutDescriptor } from '../types';
import { HUD_WIDTH, HUD_HEIGHT, HUD_BORDER_RADIUS } from '../constants';

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
      height: 40,
      paddingLength: 4,
    },
    {
      containerID: 2,
      containerName: 'body',
      xPosition: 0,
      yPosition: 38,
      width: HUD_WIDTH,
      height: 213,
      paddingLength: 15,
      borderWidth: 1,
      borderColor: 13,
      borderRadius: HUD_BORDER_RADIUS,
    },
    {
      containerID: 3,
      containerName: 'footer',
      xPosition: 13,
      yPosition: 252,
      width: HUD_WIDTH - 26,
      height: 35,
      paddingLength: 4,
    },
  ],
};

export const BODY_INNER_WIDTH = HUD_WIDTH - 2 * 15 - 2; // 544px (subtract padding + border)
