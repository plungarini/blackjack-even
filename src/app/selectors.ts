import type { AppState } from './store';
import type { StatsMap } from '../domain/stats';
import type { StrategyEntry, StrategyVs, StrategyCellValue } from '../domain/strategy';
import { computeTrueCount } from '../domain/count';
import { lookupStrategy } from '../domain/strategy';

const UNSET = Symbol('unset');

function memoize<T, K, R>(keyFn: (input: T) => K, fn: (input: T) => R): (input: T) => R {
  let lastKey: K | typeof UNSET = UNSET;
  let lastResult!: R;
  return (input) => {
    const key = keyFn(input);
    if (lastKey !== UNSET && key === lastKey) return lastResult;
    lastKey = key;
    lastResult = fn(input);
    return lastResult;
  };
}

export const selectTrueCount = memoize(
  (state: AppState) => `${state.runningCount}:${state.discardedCards}:${state.settings.deckCount}`,
  (state: AppState): number =>
    computeTrueCount(state.runningCount, state.discardedCards, state.settings.deckCount),
);

export const selectTrainAccuracy = memoize(
  (state: AppState) => `${state.trainTotalCorrect}:${state.trainTotalIncorrect}`,
  (state: AppState): number => {
    const total = state.trainTotalCorrect + state.trainTotalIncorrect;
    return total === 0 ? 1 : state.trainTotalCorrect / total;
  },
);

export function selectTrainAccuracyByCombo(state: AppState): StatsMap {
  return state.trainStats;
}

export function selectStrategyCell(
  entry: StrategyEntry,
  vs: StrategyVs,
): (state: AppState) => StrategyCellValue {
  return (state: AppState) => lookupStrategy(entry, vs, state.strategyOverrides);
}

export const selectGameInProgress = memoize(
  (state: AppState) => `${state.game?.phase ?? 'null'}`,
  (state: AppState): boolean => state.game !== null && state.game.phase !== 'idle',
);
