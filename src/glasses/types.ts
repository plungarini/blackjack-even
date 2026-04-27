import type { ImageContainerProperty } from '@evenrealities/even_hub_sdk';

export type ViewKey = 'count' | 'train' | 'strategy' | 'stats' | 'settings' | 'menu';

export interface HudTextDescriptor {
  containerID: number;
  containerName: string;
  xPosition: number;
  yPosition: number;
  width: number;
  height: number;
  paddingLength?: number;
  borderWidth?: number;
  borderRadius?: number;
  borderColor?: number;
  isEventCapture?: number;
}

export interface HudLayoutDescriptor {
  key: string;
  textDescriptors: HudTextDescriptor[];
  imageObject?: ImageContainerProperty[];
}

export interface HudRenderState {
  layout: HudLayoutDescriptor;
  textContents: Record<string, string>;
}

export interface View {
  readonly key: ViewKey;
  layout(): HudLayoutDescriptor;
  contents(): Record<string, string>;
  enter?(): void;
  exit?(): void;
  handleEvent(event: import('@evenrealities/even_hub_sdk').EvenHubEvent): void;
}

// Retained for backward compatibility with view.ts
export interface HudViewState {
  status: 'loading' | 'ready' | 'error';
  now: Date;
  message: string;
  errorMessage?: string;
}
