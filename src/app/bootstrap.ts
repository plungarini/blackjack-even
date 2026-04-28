import { appStore } from './store';
import { storageGet, storageSet } from '../services/persistence';
import { deserializeSettings, serializeSettings, DEFAULT_SETTINGS } from '../domain/settings';

const KEYS = {
  settings: 'blackjack:settings',
  trainStats: 'blackjack:train-stats',
  strategyOverrides: 'blackjack:strategy-overrides',
} as const;

let bootstrapStarted = false;
let bootstrapPromise: Promise<void> | null = null;

export function startBootstrap(): Promise<void> {
  if (bootstrapStarted) return bootstrapPromise!;
  bootstrapStarted = true;
  bootstrapPromise = doBootstrap();
  return bootstrapPromise;
}

async function doBootstrap(): Promise<void> {
  try {
    const [settingsRaw, trainStatsRaw, strategyRaw] = await Promise.all([
      storageGet(KEYS.settings),
      storageGet(KEYS.trainStats),
      storageGet(KEYS.strategyOverrides),
    ]);

    const settings = settingsRaw ? deserializeSettings(settingsRaw) : DEFAULT_SETTINGS;
    const trainStats = trainStatsRaw ? (JSON.parse(trainStatsRaw) as import('../domain/stats').StatsMap) : {};
    const strategyOverrides = strategyRaw ? (JSON.parse(strategyRaw) as import('../domain/strategy').StrategyTable) : {};

    appStore.hydrate({
      settings,
      trainStats,
      strategyOverrides,
      decksRemaining: settings.deckCount,
    });

    appStore.setPhase('ready');
  } catch (error) {
    console.error('[Bootstrap] failed', error);
    appStore.setPhase('error', 'Failed to load data');
  }
}

export async function persistSettings(): Promise<void> {
  await storageSet(KEYS.settings, serializeSettings(appStore.getState().settings));
}

export async function persistTrainStats(): Promise<void> {
  await storageSet(KEYS.trainStats, JSON.stringify(appStore.getState().trainStats));
}

export async function persistStrategyOverrides(): Promise<void> {
  await storageSet(KEYS.strategyOverrides, JSON.stringify(appStore.getState().strategyOverrides));
}
