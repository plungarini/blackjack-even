import { Card, Rank } from './deck';

export function hiLoValue(rank: Rank): number {
  if (rank === 'A' || rank === 'T' || rank === 'J' || rank === 'Q' || rank === 'K') return -1;
  if (rank === 2 || rank === 3 || rank === 4 || rank === 5 || rank === 6) return 1;
  return 0;
}

export function updateRunningCount(runningCount: number, card: Card): number {
  return runningCount + hiLoValue(card.rank);
}

export function computeTrueCount(runningCount: number, discardedCards: number, totalDecks: number): number {
  const halfDeck = 26;
  const discardedHalfDecks = Math.floor(discardedCards / halfDeck);
  const totalHalfDecks = totalDecks * 2;
  const remainingHalfDecks = totalHalfDecks - discardedHalfDecks;
  if (remainingHalfDecks <= 0) return 0;
  return Math.round(runningCount / remainingHalfDecks);
}

export function suggestedUnits(trueCount: number): number {
  if (trueCount <= 0) return 1;
  if (trueCount === 1) return 2;
  if (trueCount === 2) return 4;
  if (trueCount === 3) return 6;
  if (trueCount === 4) return 8;
  return 12;
}
