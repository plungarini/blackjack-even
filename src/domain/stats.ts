import { StrategyEntry, StrategyVs } from './strategy';

export interface FeedbackStat {
  correct: number;
  incorrect: number;
}

export type StatsMap = Record<string, FeedbackStat>;

export function makeStatKey(entry: StrategyEntry, vs: StrategyVs): string {
  return `${entry}_${vs}`;
}

export function upsertStat(stats: StatsMap, entry: StrategyEntry, vs: StrategyVs, correct: boolean): StatsMap {
  const key = makeStatKey(entry, vs);
  const existing = stats[key] ?? { correct: 0, incorrect: 0 };
  return {
    ...stats,
    [key]: {
      correct: existing.correct + (correct ? 1 : 0),
      incorrect: existing.incorrect + (correct ? 0 : 1),
    },
  };
}

export function accuracy(stat: FeedbackStat): number {
  const total = stat.correct + stat.incorrect;
  return total === 0 ? 1 : stat.correct / total;
}

export function totalHands(stats: StatsMap): number {
  return Object.values(stats).reduce((sum, s) => sum + s.correct + s.incorrect, 0);
}
