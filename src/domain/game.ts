import { Card, buildShoe, drawCard, shouldReshuffle } from './deck';
import { handValue, isBust, isBlackjack, isSoft } from './hand';
import { updateRunningCount } from './count';

export type GamePhase = 'idle' | 'player-turn' | 'dealer-turn' | 'result';
export type HandOutcome = 'blackjack' | 'win' | 'push' | 'lose' | 'bust' | 'surrender';

export interface PlayerHandState {
  cards: Card[];
  outcome?: HandOutcome;
  doubled?: boolean;
  surrendered?: boolean;
}

export interface GameState {
  phase: GamePhase;
  shoe: Card[];
  deckCount: number;
  dealerHand: Card[];
  playerHands: PlayerHandState[];
  activeHandIndex: number;
  runningCount: number;
  discardedCount: number;
  lastAction?: string;
  resultMessage?: string;
}

export function createGameState(deckCount: number): GameState {
  return {
    phase: 'idle',
    shoe: buildShoe(deckCount),
    deckCount,
    dealerHand: [],
    playerHands: [],
    activeHandIndex: 0,
    runningCount: 0,
    discardedCount: 0,
  };
}

function draw(state: GameState): [Card, GameState] {
  let shoe = state.shoe;
  if (shouldReshuffle(shoe, state.deckCount)) {
    shoe = buildShoe(state.deckCount);
  }
  const [card, remaining] = drawCard(shoe);
  return [card, { ...state, shoe: remaining }];
}

export function dealGame(state: GameState): GameState {
  let s = state;
  let p1: Card, p2: Card, d1: Card, d2: Card;

  [p1, s] = draw(s);
  [d1, s] = draw(s);
  [p2, s] = draw(s);
  [d2, s] = draw(s);

  // d1 is hidden (hole card), d2 is visible upcard
  const hiddenD1: Card = { ...d1, hidden: true };
  const dealerHand: Card[] = [hiddenD1, d2];
  const playerHand: Card[] = [p1, p2];

  let rc = s.runningCount;
  rc = updateRunningCount(rc, p1);
  rc = updateRunningCount(rc, d2); // only count visible dealer card
  rc = updateRunningCount(rc, p2);

  const discardedCount = s.discardedCount + 4;

  const playerHandState: PlayerHandState = { cards: playerHand };

  let phase: GamePhase = 'player-turn';

  // Player blackjack: reveal dealer hole card and go to result
  if (isBlackjack(playerHand)) {
    const revealedDealer = [{ ...d1 }, d2];
    rc = updateRunningCount(rc, d1);
    return resolveOutcomes({
      ...s,
      phase: 'result',
      dealerHand: revealedDealer,
      playerHands: [playerHandState],
      activeHandIndex: 0,
      runningCount: rc,
      discardedCount,
      lastAction: 'Deal',
    });
  }

  return {
    ...s,
    phase,
    dealerHand,
    playerHands: [playerHandState],
    activeHandIndex: 0,
    runningCount: rc,
    discardedCount,
    lastAction: 'Deal',
  };
}

export function hitGame(state: GameState): GameState {
  if (state.phase !== 'player-turn') return state;
  const hand = state.playerHands[state.activeHandIndex];
  if (!hand) return state;

  let s = state;
  let card: Card;
  [card, s] = draw(s);

  const rc = updateRunningCount(s.runningCount, card);
  const newCards = [...hand.cards, card];
  const updatedHand: PlayerHandState = { ...hand, cards: newCards };
  const playerHands = state.playerHands.map((h, i) =>
    i === state.activeHandIndex ? updatedHand : h
  );

  const bust = isBust(newCards);
  const next: GameState = {
    ...s,
    playerHands,
    runningCount: rc,
    discardedCount: s.discardedCount + 1,
    lastAction: 'Hit',
  };

  return bust ? advanceHand(next) : next;
}

export function standGame(state: GameState): GameState {
  if (state.phase !== 'player-turn') return state;
  return advanceHand({ ...state, lastAction: 'Stand' });
}

export function doubleGame(state: GameState): GameState {
  if (state.phase !== 'player-turn') return state;
  const hand = state.playerHands[state.activeHandIndex];
  if (!hand) return state;

  let s = state;
  let card: Card;
  [card, s] = draw(s);

  const rc = updateRunningCount(s.runningCount, card);
  const newCards = [...hand.cards, card];
  const updatedHand: PlayerHandState = { ...hand, cards: newCards, doubled: true };
  const playerHands = state.playerHands.map((h, i) =>
    i === state.activeHandIndex ? updatedHand : h
  );

  return advanceHand({
    ...s,
    playerHands,
    runningCount: rc,
    discardedCount: s.discardedCount + 1,
    lastAction: 'Double',
  });
}

export function splitGame(state: GameState): GameState {
  if (state.phase !== 'player-turn') return state;
  const hand = state.playerHands[state.activeHandIndex];
  if (!hand || hand.cards.length !== 2) return state;

  const [cardA, cardB] = hand.cards;

  let s = state;
  let newA: Card, newB: Card;
  [newA, s] = draw(s);
  [newB, s] = draw(s);

  let rc = s.runningCount;
  rc = updateRunningCount(rc, newA);
  rc = updateRunningCount(rc, newB);

  const handA: PlayerHandState = { cards: [cardA!, newA] };
  const handB: PlayerHandState = { cards: [cardB!, newB] };

  const before = state.playerHands.slice(0, state.activeHandIndex);
  const after = state.playerHands.slice(state.activeHandIndex + 1);
  const playerHands = [...before, handA, handB, ...after];

  return {
    ...s,
    playerHands,
    runningCount: rc,
    discardedCount: s.discardedCount + 2,
    lastAction: 'Split',
  };
}

export function surrenderGame(state: GameState): GameState {
  if (state.phase !== 'player-turn') return state;
  const hand = state.playerHands[state.activeHandIndex];
  if (!hand) return state;

  const updatedHand: PlayerHandState = { ...hand, surrendered: true };
  const playerHands = state.playerHands.map((h, i) =>
    i === state.activeHandIndex ? updatedHand : h
  );

  return advanceHand({ ...state, playerHands, lastAction: 'Surrender' });
}

function advanceHand(state: GameState): GameState {
  const nextIndex = state.activeHandIndex + 1;
  if (nextIndex < state.playerHands.length) {
    return { ...state, activeHandIndex: nextIndex };
  }
  // All hands done — run dealer
  const afterDealer = runDealer(state, false);
  return resolveOutcomes(afterDealer);
}

export function runDealer(state: GameState, dealerHitsOnSoft17: boolean): GameState {
  // Reveal hole card
  const revealed: Card[] = state.dealerHand.map((c) => ({ ...c, hidden: false }));
  let s: GameState = { ...state, dealerHand: revealed, phase: 'dealer-turn' as GamePhase };

  // Count the revealed hole card
  const holeCard = revealed[0];
  if (holeCard) {
    s = { ...s, runningCount: updateRunningCount(s.runningCount, holeCard) };
  }

  // Dealer draws until hard 17+ (or soft 17+ if dealerHitsOnSoft17 = false means stand on soft 17)
  while (true) {
    const val = handValue(s.dealerHand);
    if (val > 21) break;
    if (val >= 17) {
      if (!dealerHitsOnSoft17) break;
      if (!isSoft(s.dealerHand)) break;
    }
    let card: Card;
    [card, s] = draw(s) as [Card, GameState];
    const rc = updateRunningCount(s.runningCount, card);
    const newDealerHand: Card[] = [...s.dealerHand, card];
    s = {
      ...s,
      dealerHand: newDealerHand,
      runningCount: rc,
      discardedCount: s.discardedCount + 1,
    };
  }

  return s;
}

export function resolveOutcomes(state: GameState): GameState {
  const dealerVal = handValue(state.dealerHand);
  const dealerBJ = isBlackjack(state.dealerHand);

  const playerHands = state.playerHands.map((hand): PlayerHandState => {
    if (hand.surrendered) return { ...hand, outcome: 'surrender' };

    const playerVal = handValue(hand.cards);
    const playerBJ = isBlackjack(hand.cards);

    if (isBust(hand.cards)) return { ...hand, outcome: 'bust' };

    if (playerBJ && dealerBJ) return { ...hand, outcome: 'push' };
    if (playerBJ) return { ...hand, outcome: 'blackjack' };
    if (dealerBJ) return { ...hand, outcome: 'lose' };

    if (isBust(state.dealerHand)) return { ...hand, outcome: 'win' };

    if (playerVal > dealerVal) return { ...hand, outcome: 'win' };
    if (playerVal < dealerVal) return { ...hand, outcome: 'lose' };
    return { ...hand, outcome: 'push' };
  });

  const outcomes = playerHands.map((h) => h.outcome);
  const resultMessage = outcomes
    .map((o) => {
      switch (o) {
        case 'blackjack': return 'Blackjack!';
        case 'win': return 'Win';
        case 'push': return 'Push';
        case 'lose': return 'Lose';
        case 'bust': return 'Bust';
        case 'surrender': return 'Surrender';
        default: return '';
      }
    })
    .join(' | ');

  return { ...state, phase: 'result', playerHands, resultMessage };
}
