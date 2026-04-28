import { Card, Rank } from './deck';
import { StrategyEntry, StrategyVs } from './strategy';
import { StatsMap, makeStatKey, accuracy } from './stats';

export interface TrainHand {
  playerCards: Card[];
  dealerUpcard: Card;
  entry: StrategyEntry;
  vs: StrategyVs;
}

export function pickTrainingHand(
  stats: StatsMap,
  threshold: number,
  allEntries: StrategyEntry[],
  allVs: StrategyVs[],
): TrainHand | null {
  const candidates = allEntries.flatMap((entry) =>
    allVs.map((vs) => ({ entry, vs }))
  ).filter(({ entry, vs }) => {
    const stat = stats[makeStatKey(entry, vs)];
    if (!stat) return true;
    return accuracy(stat) < threshold;
  });

  if (candidates.length === 0) return null;

  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  if (!pick) return null;

  return buildTrainHand(pick.entry, pick.vs);
}

function buildTrainHand(entry: StrategyEntry, vs: StrategyVs): TrainHand {
  const dealerUpcard = makeCardForRank(vsToRank(vs));
  const playerCards = entryToCards(entry);
  return { playerCards, dealerUpcard, entry, vs };
}

export function vsToRank(vs: StrategyVs): Rank {
  if (vs === 'A') return 'A';
  if (vs === '10') return 'T';
  return parseInt(vs, 10) as Rank;
}

export function makeCardForRank(rank: Rank): Card {
  return { suit: 'S', rank };
}

// Hard total pairs: consistent two-card representations
const HARD_TOTAL_PAIRS: Record<string, [Rank, Rank]> = {
  '8':  [5, 3],
  '9':  [5, 4],
  '10': [6, 4],
  '11': [6, 5],
  '12': [7, 5],
  '13': [8, 5],
  '14': [8, 6],
  '15': [8, 7],
  '16': [9, 7],
  '17': ['T', 7],
};

export function entryToCards(entry: StrategyEntry): Card[] {
  // Pair entries like '8,8', 'A,A', '10,10'
  if (entry.includes(',')) {
    const [left, right] = entry.split(',') as [string, string];

    if (left === 'A') {
      // 'A,A' or 'A,2' through 'A,8'
      const rightRank: Rank = right === 'A' ? 'A' : (parseInt(right, 10) as Rank);
      return [
        makeCardForRank('A'),
        makeCardForRank(rightRank),
      ];
    }

    // Numeric pairs: '2,2' through '10,10'
    const pairRank: Rank = left === '10' ? 'T' : (parseInt(left, 10) as Rank);
    return [
      { suit: 'S', rank: pairRank },
      { suit: 'H', rank: pairRank },
    ];
  }

  // Hard totals
  const pair = HARD_TOTAL_PAIRS[entry];
  if (pair) {
    return [makeCardForRank(pair[0]), makeCardForRank(pair[1])];
  }

  // Fallback: shouldn't reach here with valid entries
  return [makeCardForRank(8 as Rank), makeCardForRank(8 as Rank)];
}

export const ALL_ENTRIES: StrategyEntry[] = [
  '8', '9', '10', '11', '12', '13', '14', '15', '16', '17',
  'A,2', 'A,3', 'A,4', 'A,5', 'A,6', 'A,7', 'A,8',
  '2,2', '3,3', '4,4', '5,5', '6,6', '7,7', '8,8', '9,9', '10,10', 'A,A',
];

export const ALL_VS: StrategyVs[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];
