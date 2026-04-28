import type { UserSettings } from '../domain/settings';
import { DEFAULT_SETTINGS, clampSettings } from '../domain/settings';
import type { StatsMap } from '../domain/stats';
import { upsertStat } from '../domain/stats';
import type { StrategyEntry, StrategyTable, StrategyVs, StrategyCellValue } from '../domain/strategy';
import type { GameState } from '../domain/game';

export type AppTab = 'count' | 'train' | 'strategy' | 'stats' | 'settings';
export type AppPhase = 'booting' | 'ready' | 'error';

export interface AppState {
  phase: AppPhase;
  statusMessage: string | null;
  tab: AppTab;
  runningCount: number;
  decksRemaining: number;
  discardedCards: number;
  trainStats: StatsMap;
  trainStreakCorrect: number;
  trainTotalCorrect: number;
  trainTotalIncorrect: number;
  game: GameState | null;
  strategyOverrides: Partial<StrategyTable>;
  settings: UserSettings;
  mutating: boolean;
}

const initialState: AppState = {
  phase: 'booting',
  statusMessage: null,
  tab: 'count',
  runningCount: 0,
  decksRemaining: DEFAULT_SETTINGS.deckCount,
  discardedCards: 0,
  trainStats: {},
  trainStreakCorrect: 0,
  trainTotalCorrect: 0,
  trainTotalIncorrect: 0,
  game: null,
  strategyOverrides: {},
  settings: DEFAULT_SETTINGS,
  mutating: false,
};

type Listener = () => void;

class AppStore {
  private state: AppState = initialState;
  private readonly listeners = new Set<Listener>();

  getState(): AppState { return this.state; }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private commit(next: AppState): void {
    if (next === this.state) return;
    this.state = next;
    for (const l of this.listeners) {
      try { l(); } catch (e) { console.error('[Store]', e); }
    }
  }

  setTab(tab: AppTab): void {
    if (this.state.tab === tab) return;
    this.commit({ ...this.state, tab });
  }

  setPhase(phase: AppPhase, statusMessage?: string): void {
    this.commit({ ...this.state, phase, statusMessage: statusMessage ?? null });
  }

  setRunningCount(runningCount: number): void {
    this.commit({ ...this.state, runningCount });
  }

  setDecksRemaining(decksRemaining: number): void {
    this.commit({ ...this.state, decksRemaining });
  }

  incrementDiscarded(count: number): void {
    this.commit({ ...this.state, discardedCards: this.state.discardedCards + count });
  }

  resetCount(): void {
    this.commit({
      ...this.state,
      runningCount: 0,
      discardedCards: 0,
      decksRemaining: this.state.settings.deckCount,
    });
  }

  setGame(game: GameState | null): void {
    this.commit({ ...this.state, game });
  }

  recordTrainResult(correct: boolean, entry: StrategyEntry, vs: StrategyVs): void {
    const trainStats = upsertStat(this.state.trainStats, entry, vs, correct);
    this.commit({
      ...this.state,
      trainStats,
      trainStreakCorrect: correct ? this.state.trainStreakCorrect + 1 : 0,
      trainTotalCorrect: this.state.trainTotalCorrect + (correct ? 1 : 0),
      trainTotalIncorrect: this.state.trainTotalIncorrect + (correct ? 0 : 1),
    });
  }

  setStrategyOverride(entry: StrategyEntry, vs: StrategyVs, value: StrategyCellValue): void {
    const overrides: Partial<StrategyTable> = {
      ...this.state.strategyOverrides,
      [entry]: { ...(this.state.strategyOverrides[entry] ?? {}), [vs]: value },
    };
    this.commit({ ...this.state, strategyOverrides: overrides });
  }

  setStrategyOverrides(overrides: Partial<StrategyTable>): void {
    this.commit({ ...this.state, strategyOverrides: overrides });
  }

  resetStrategyOverrides(): void {
    this.commit({ ...this.state, strategyOverrides: {} });
  }

  updateSettings(partial: Partial<UserSettings>): void {
    const settings = clampSettings({ ...this.state.settings, ...partial });
    this.commit({ ...this.state, settings, decksRemaining: settings.deckCount });
  }

  resetTrainStats(): void {
    this.commit({
      ...this.state,
      trainStats: {},
      trainStreakCorrect: 0,
      trainTotalCorrect: 0,
      trainTotalIncorrect: 0,
    });
  }

  hydrate(partial: Partial<AppState>): void {
    this.commit({ ...this.state, ...partial });
  }
}

export const appStore = new AppStore();
