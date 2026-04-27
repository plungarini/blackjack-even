export interface UserSettings {
  deckCount: number;
  hideCount: boolean;
  hideScore: boolean;
  trainingMode: boolean;
  trainingThreshold: number;
  dealerHitsOnSoft17: boolean;
  allowDoubleAfterSplit: boolean;
  allowSurrender: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  deckCount: 6,
  hideCount: false,
  hideScore: false,
  trainingMode: false,
  trainingThreshold: 60,
  dealerHitsOnSoft17: false,
  allowDoubleAfterSplit: true,
  allowSurrender: true,
};

export function clampSettings(settings: Partial<UserSettings>): UserSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    deckCount: Math.max(1, Math.min(8, settings.deckCount ?? DEFAULT_SETTINGS.deckCount)),
    trainingThreshold: Math.max(10, Math.min(90, settings.trainingThreshold ?? DEFAULT_SETTINGS.trainingThreshold)),
  };
}

export function serializeSettings(settings: UserSettings): string {
  return JSON.stringify(settings);
}

export function deserializeSettings(raw: string): UserSettings {
  try {
    return clampSettings(JSON.parse(raw) as Partial<UserSettings>);
  } catch {
    return DEFAULT_SETTINGS;
  }
}
