import { Card, Rank, displayCard } from './deck';

export function cardValue(rank: Rank): number {
  if (rank === 'A') return 11;
  if (rank === 'T' || rank === 'J' || rank === 'Q' || rank === 'K') return 10;
  return rank;
}

export function handValue(hand: Card[]): number {
  let total = 0;
  let aces = 0;
  for (const card of hand) {
    if (card.hidden) continue;
    if (card.rank === 'A') { aces++; total += 11; }
    else total += cardValue(card.rank);
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

export function isSoft(hand: Card[]): boolean {
  let total = 0;
  let aces = 0;
  for (const card of hand) {
    if (card.hidden) continue;
    if (card.rank === 'A') { aces++; total += 11; }
    else total += cardValue(card.rank);
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return aces > 0 && total <= 21;
}

export function isBust(hand: Card[]): boolean {
  return handValue(hand) > 21;
}

export function isBlackjack(hand: Card[]): boolean {
  const visible = hand.filter((c) => !c.hidden);
  return visible.length === 2 && handValue(visible) === 21;
}

export function isPair(hand: Card[]): boolean {
  if (hand.length !== 2) return false;
  const [a, b] = hand;
  return cardValue(a!.rank) === cardValue(b!.rank);
}

export function canDouble(hand: Card[]): boolean {
  return hand.length === 2;
}

export function canSplit(hand: Card[]): boolean {
  return isPair(hand);
}

export function formatHand(hand: Card[]): string {
  const parts = hand.map(displayCard).join(' ');
  const value = handValue(hand);
  return `${parts} (${value})`;
}

export function handSummary(hand: Card[]): string {
  const parts = hand.filter((c) => !c.hidden).map(displayCard).join(' ');
  const value = handValue(hand);
  return `${parts} (${value})`;
}
