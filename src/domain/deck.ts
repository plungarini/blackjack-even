export type Suit = 'H' | 'D' | 'C' | 'S';
export type FaceRank = 'A' | 'T' | 'J' | 'Q' | 'K';
export type NumRank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type Rank = FaceRank | NumRank;

export interface Card {
  suit: Suit;
  rank: Rank;
  hidden?: boolean;
}

export function displayRank(rank: Rank): string {
  if (rank === 10) return 'T';
  return String(rank);
}

export function displaySuit(suit: Suit): string {
  const map: Record<Suit, string> = { H: '♥', D: '♦', C: '♣', S: '♠' };
  return map[suit];
}

export function displayCard(card: Card): string {
  if (card.hidden) return '[?]';
  return `${displayRank(card.rank)}${displaySuit(card.suit)}`;
}

const SUITS: Suit[] = ['H', 'D', 'C', 'S'];
const RANKS: Rank[] = ['A', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K'];

export function buildShoe(deckCount = 6): Card[] {
  const cards: Card[] = [];
  for (let d = 0; d < deckCount; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        cards.push({ suit, rank });
      }
    }
  }
  // Fisher-Yates shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j]!, cards[i]!];
  }
  return cards;
}

export function drawCard(shoe: Card[]): [Card, Card[]] {
  const card = shoe[shoe.length - 1]!;
  return [card, shoe.slice(0, shoe.length - 1)];
}

export function shouldReshuffle(shoe: Card[], deckCount: number): boolean {
  return shoe.length < deckCount * 52 * 0.25;
}
