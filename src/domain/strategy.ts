import { Card, Rank } from './deck';
import { cardValue, handValue } from './hand';

export type StrategyEntry =
  | '8' | '9' | '10' | '11' | '12' | '13' | '14' | '15' | '16' | '17'
  | 'A,2' | 'A,3' | 'A,4' | 'A,5' | 'A,6' | 'A,7' | 'A,8'
  | '2,2' | '3,3' | '4,4' | '5,5' | '6,6' | '7,7' | '8,8' | '9,9' | '10,10' | 'A,A';

export type StrategyVs = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'A';

export type StrategyCellValue = 'H' | 'S' | 'P' | 'D/H' | 'D/S' | 'P/H' | 'R/H';

export type StrategyTable = Record<StrategyEntry, Record<StrategyVs, StrategyCellValue>>;

const VS: StrategyVs[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];

function row(values: StrategyCellValue[]): Record<StrategyVs, StrategyCellValue> {
  return Object.fromEntries(VS.map((v, i) => [v, values[i]])) as Record<StrategyVs, StrategyCellValue>;
}

export const DEFAULT_STRATEGY: StrategyTable = {
  '8':     row(['H',   'H',   'H',   'H',   'H',   'H',   'H',   'H',   'H',   'H'  ]),
  '9':     row(['H',   'D/H', 'D/H', 'D/H', 'D/H', 'H',   'H',   'H',   'H',   'H'  ]),
  '10':    row(['D/H', 'D/H', 'D/H', 'D/H', 'D/H', 'D/H', 'D/H', 'D/H', 'H',   'H'  ]),
  '11':    row(['D/H', 'D/H', 'D/H', 'D/H', 'D/H', 'D/H', 'D/H', 'D/H', 'D/H', 'D/H']),
  '12':    row(['H',   'H',   'S',   'S',   'S',   'H',   'H',   'H',   'H',   'H'  ]),
  '13':    row(['S',   'S',   'S',   'S',   'S',   'H',   'H',   'H',   'H',   'H'  ]),
  '14':    row(['S',   'S',   'S',   'S',   'S',   'H',   'H',   'H',   'H',   'H'  ]),
  '15':    row(['S',   'S',   'S',   'S',   'S',   'H',   'H',   'H',   'R/H', 'R/H']),
  '16':    row(['S',   'S',   'S',   'S',   'S',   'H',   'H',   'R/H', 'R/H', 'R/H']),
  '17':    row(['S',   'S',   'S',   'S',   'S',   'S',   'S',   'S',   'S',   'S'  ]),
  'A,2':   row(['H',   'H',   'H',   'D/H', 'D/H', 'H',   'H',   'H',   'H',   'H'  ]),
  'A,3':   row(['H',   'H',   'H',   'D/H', 'D/H', 'H',   'H',   'H',   'H',   'H'  ]),
  'A,4':   row(['H',   'H',   'D/H', 'D/H', 'D/H', 'H',   'H',   'H',   'H',   'H'  ]),
  'A,5':   row(['H',   'H',   'D/H', 'D/H', 'D/H', 'H',   'H',   'H',   'H',   'H'  ]),
  'A,6':   row(['H',   'D/H', 'D/H', 'D/H', 'D/H', 'H',   'H',   'H',   'H',   'H'  ]),
  'A,7':   row(['S',   'D/S', 'D/S', 'D/S', 'D/S', 'S',   'S',   'H',   'H',   'H'  ]),
  'A,8':   row(['S',   'S',   'S',   'S',   'S',   'S',   'S',   'S',   'S',   'S'  ]),
  '2,2':   row(['P/H', 'P/H', 'P',   'P',   'P',   'P',   'H',   'H',   'H',   'H'  ]),
  '3,3':   row(['P/H', 'P/H', 'P',   'P',   'P',   'P',   'H',   'H',   'H',   'H'  ]),
  '4,4':   row(['H',   'H',   'H',   'P/H', 'P/H', 'H',   'H',   'H',   'H',   'H'  ]),
  '5,5':   row(['D/H', 'D/H', 'D/H', 'D/H', 'D/H', 'D/H', 'D/H', 'D/H', 'H',   'H'  ]),
  '6,6':   row(['P/H', 'P',   'P',   'P',   'P',   'H',   'H',   'H',   'H',   'H'  ]),
  '7,7':   row(['P',   'P',   'P',   'P',   'P',   'P',   'H',   'H',   'H',   'H'  ]),
  '8,8':   row(['P',   'P',   'P',   'P',   'P',   'P',   'P',   'P',   'P',   'P'  ]),
  '9,9':   row(['P',   'P',   'P',   'P',   'P',   'S',   'P',   'P',   'S',   'S'  ]),
  '10,10': row(['S',   'S',   'S',   'S',   'S',   'S',   'S',   'S',   'S',   'S'  ]),
  'A,A':   row(['P',   'P',   'P',   'P',   'P',   'P',   'P',   'P',   'P',   'P'  ]),
};

export function lookupStrategy(
  entry: StrategyEntry,
  vs: StrategyVs,
  overrides?: Partial<StrategyTable>,
): StrategyCellValue {
  return overrides?.[entry]?.[vs] ?? DEFAULT_STRATEGY[entry][vs];
}

export function getStrategyEntry(hand: Card[]): StrategyEntry | null {
  const visible = hand.filter((c) => !c.hidden);
  if (visible.length < 2) return null;

  if (visible.length === 2) {
    const [a, b] = visible;
    const aRank = a!.rank;
    const bRank = b!.rank;

    if (aRank === 'A' && bRank === 'A') return 'A,A';

    const tenValues: Rank[] = ['T', 'J', 'Q', 'K', 10];
    const aIsTen = tenValues.includes(aRank);
    const bIsTen = tenValues.includes(bRank);
    if (aIsTen && bIsTen) return '10,10';

    if (typeof aRank === 'number' && typeof bRank === 'number' && aRank === bRank) {
      if (aRank === 5) return '5,5';
      if (aRank === 4) return '4,4';
      return `${aRank},${aRank}` as StrategyEntry;
    }

    const aceIdx = visible.findIndex((c) => c.rank === 'A');
    if (aceIdx >= 0) {
      const other = visible[aceIdx === 0 ? 1 : 0]!;
      const otherVal = cardValue(other.rank);
      if (otherVal <= 8 && otherVal >= 2) return `A,${otherVal}` as StrategyEntry;
      // A,9 or A,10 (blackjack) — treat as hard total or A,8
      if (otherVal === 9 || otherVal === 10) return 'A,8';
    }
  }

  const total = handValue(visible);
  if (total <= 8) return '8';
  if (total >= 17) return '17';
  return String(total) as StrategyEntry;
}

export type PlayerAction = 'hit' | 'stand' | 'double' | 'split' | 'surrender';

export function resolveAction(
  cell: StrategyCellValue,
  canDoubleDown: boolean,
  canSplitHand: boolean,
  canSurrender: boolean,
): PlayerAction {
  switch (cell) {
    case 'H': return 'hit';
    case 'S': return 'stand';
    case 'P': return canSplitHand ? 'split' : 'hit';
    case 'D/H': return canDoubleDown ? 'double' : 'hit';
    case 'D/S': return canDoubleDown ? 'double' : 'stand';
    case 'P/H': return canSplitHand ? 'split' : 'hit';
    case 'R/H': return canSurrender ? 'surrender' : 'hit';
  }
}
