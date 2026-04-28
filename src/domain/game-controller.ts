import { Card, buildShoe, drawCard, drawCardByValue, type Rank } from './deck';
import { handValue, isBust, isBlackjack } from './hand';
import { updateRunningCount } from './count';
import { getStrategyFeedback, isActionCorrect, type PlayerAction } from './strategy';
import { upsertStat } from './stats';
import { appStore } from '../app/store';
import { persistTrainStats } from '../app/bootstrap';
import type { GameState, PlayerHandState, GameFeedback } from './game';



function createGameState(deckCount: number): GameState {
  return {
    phase: 'idle',
    shoe: buildShoe(deckCount),
    deckCount,
    dealerHand: [],
    playerHands: [],
    activeHandIndex: 0,
    runningCount: 0,
    discardedCount: 0,
    feedback: null,
    resultMessage: '',
  };
}

// ── Training mode helpers ─────────────────────────────────────────

interface TrainingTarget {
  player: [Rank, Rank];
  dealer: Rank;
}

function getTrainingTarget(threshold: number): TrainingTarget | null {
  const entries = [
    '8','9','10','11','12','13','14','15','16','17',
    'A,2','A,3','A,4','A,5','A,6','A,7','A,8',
    '2,2','3,3','4,4','5,5','6,6','7,7','8,8','9,9','10,10','A,A',
  ] as const;
  const vss = ['2','3','4','5','6','7','8','9','10','A'] as const;

  const stats = appStore.getState().trainStats;
  const weak: { entry: string; vs: string }[] = [];

  for (const entry of entries) {
    for (const vs of vss) {
      const stat = stats[`${entry}_${vs}`];
      const total = (stat?.correct ?? 0) + (stat?.incorrect ?? 0);
      const acc = total === 0 ? 0 : stat!.correct / total;
      if (acc <= threshold / 100) {
        weak.push({ entry, vs });
      }
    }
  }

  if (weak.length === 0) return null;
  const pick = weak[Math.floor(Math.random() * weak.length)];

  let p1: Rank, p2: Rank;
  if (pick.entry.includes(',')) {
    const [a, b] = pick.entry.split(',');
    p1 = (a === 'A' ? 'A' : a === 'T' ? 'T' : parseInt(a)) as Rank;
    p2 = (b === 'A' ? 'A' : b === 'T' ? 'T' : parseInt(b)) as Rank;
  } else {
    const score = parseInt(pick.entry);
    const nums = [2,3,4,5,6,7,8,9,10];
    const pairs: [Rank, Rank][] = [];
    for (const n1 of nums) {
      for (const n2 of nums) {
        if (n1 + n2 === score && n1 !== n2) {
          pairs.push([n1 as Rank, n2 as Rank]);
        }
      }
    }
    if (pairs.length === 0) {
      p1 = Math.floor(score / 2) as Rank;
      p2 = Math.ceil(score / 2) as Rank;
    } else {
      const pair = pairs[Math.floor(Math.random() * pairs.length)];
      p1 = pair[0];
      p2 = pair[1];
    }
  }

  const dRank = (pick.vs === 'A' ? 'A' : pick.vs === '10' ? 'T' : parseInt(pick.vs)) as Rank;
  return { player: [p1, p2], dealer: dRank };
}

// ── Core game actions ─────────────────────────────────────────────

export function newGame(deckCount: number, trainingMode: boolean, trainingThreshold: number): GameState {
  let state = appStore.getState().game;
  let shoe = state?.shoe ?? buildShoe(deckCount);
  let runningCount = state?.runningCount ?? 0;
  let discardedCount = state?.discardedCount ?? 0;

  // Count previous hands as discarded
  if (state) {
    const prevCards = state.playerHands.reduce((sum, h) => sum + h.cards.length, 0) + state.dealerHand.length;
    discardedCount += prevCards;
  }

  if (shoe.length <= 15) {
    shoe = buildShoe(deckCount);
    runningCount = 0;
    discardedCount = 0;
  }

  const target = trainingMode ? getTrainingTarget(trainingThreshold) : null;

  let p1: Card, p2: Card, d1: Card, d2: Card;

  if (target) {
    const [c1, s1] = drawCardByValue(shoe, target.player[0]);
    p1 = c1 ?? drawCard(s1)[0];
    shoe = c1 ? s1 : s1.slice(0, -1);

    const [cD, sD] = drawCardByValue(shoe, target.dealer);
    d1 = cD ?? drawCard(sD)[0];
    shoe = cD ? sD : sD.slice(0, -1);

    const [c2, s2] = drawCardByValue(shoe, target.player[1]);
    p2 = c2 ?? drawCard(s2)[0];
    shoe = c2 ? s2 : s2.slice(0, -1);

    d2 = drawCard(shoe)[0];
    shoe = shoe.slice(0, -1);
  } else {
    [p1, shoe] = drawCard(shoe);
    [d1, shoe] = drawCard(shoe);
    [p2, shoe] = drawCard(shoe);
    [d2, shoe] = drawCard(shoe);
  }

  const dealerHand: Card[] = [{ ...d1, hidden: true }, d2];
  const playerHand: PlayerHandState = { cards: [p1, p2] };

  runningCount = updateRunningCount(runningCount, p1);
  runningCount = updateRunningCount(runningCount, d2);
  runningCount = updateRunningCount(runningCount, p2);

  discardedCount += 4;

  // Player blackjack
  if (isBlackjack(playerHand.cards)) {
    const revealedDealer = [{ ...d1 }, d2];
    runningCount = updateRunningCount(runningCount, d1);
    const dealerBJ = isBlackjack(revealedDealer);
    const outcome = dealerBJ ? 'push' : 'won';
    return {
      phase: 'result',
      shoe,
      deckCount,
      dealerHand: revealedDealer,
      playerHands: [{ ...playerHand, outcome }],
      activeHandIndex: 0,
      runningCount,
      discardedCount,
      feedback: null,
      resultMessage: outcome === 'won' ? 'Blackjack!' : 'Push',
    };
  }

  // Dealer blackjack
  if (handValue([d1, d2]) === 21) {
    const revealedDealer = [{ ...d1 }, d2];
    runningCount = updateRunningCount(runningCount, d1);
    return {
      phase: 'result',
      shoe,
      deckCount,
      dealerHand: revealedDealer,
      playerHands: [{ ...playerHand, outcome: 'lost' }],
      activeHandIndex: 0,
      runningCount,
      discardedCount,
      feedback: null,
      resultMessage: 'Dealer Blackjack',
    };
  }

  return {
    phase: 'player-turn',
    shoe,
    deckCount,
    dealerHand,
    playerHands: [playerHand],
    activeHandIndex: 0,
    runningCount,
    discardedCount,
    feedback: null,
    resultMessage: '',
  };
}

function logStrategyFeedback(action: PlayerAction): GameFeedback {
  const state = appStore.getState().game;
  if (!state || state.phase !== 'player-turn') {
    return { isCorrect: true, entry: '', vs: '', actions: [action], action };
  }
  const hand = state.playerHands[state.activeHandIndex];
  if (!hand) {
    return { isCorrect: true, entry: '', vs: '', actions: [action], action };
  }
  const dealerUpcard = state.dealerHand.find((c) => !c.hidden);
  if (!dealerUpcard) {
    return { isCorrect: true, entry: '', vs: '', actions: [action], action };
  }

  const feedback = getStrategyFeedback(hand.cards, dealerUpcard, appStore.getState().strategyOverrides);
  const isCorrect = isActionCorrect(feedback, action);

  const newStats = upsertStat(appStore.getState().trainStats, feedback.entry, feedback.vs, isCorrect);
  appStore.hydrate({ trainStats: newStats });
  void persistTrainStats();

  return { isCorrect, entry: feedback.entry, vs: feedback.vs, actions: feedback.actions, action };
}

export function gameHit(): GameState {
  const state = appStore.getState().game;
  if (!state || state.phase !== 'player-turn') return state ?? createGameState(6);
  const hand = state.playerHands[state.activeHandIndex];
  if (!hand) return state;

  const feedback = logStrategyFeedback('hit');

  const [card, shoe] = drawCard(state.shoe);
  const runningCount = updateRunningCount(state.runningCount, card);
  const newCards = [...hand.cards, card];
  const updatedHand: PlayerHandState = { ...hand, cards: newCards };
  const playerHands = state.playerHands.map((h, i) =>
    i === state.activeHandIndex ? updatedHand : h
  );

  if (isBust(newCards)) {
    const bustedHand: PlayerHandState = { ...updatedHand, outcome: 'lost' };
    const nextHands = playerHands.map((h, i) => i === state.activeHandIndex ? bustedHand : h);
    const nextState: GameState = {
      ...state,
      shoe,
      playerHands: nextHands,
      runningCount,
      discardedCount: state.discardedCount + 1,
      feedback,
    };
    return advanceHand(nextState);
  }

  return { ...state, shoe, playerHands, runningCount, discardedCount: state.discardedCount + 1, feedback };
}

export function gameStand(): GameState {
  const state = appStore.getState().game;
  if (!state || state.phase !== 'player-turn') return state ?? createGameState(6);

  const feedback = logStrategyFeedback('stand');
  return advanceHand({ ...state, feedback });
}

export function gameDouble(): GameState {
  const state = appStore.getState().game;
  if (!state || state.phase !== 'player-turn') return state ?? createGameState(6);
  const hand = state.playerHands[state.activeHandIndex];
  if (!hand) return state;

  const feedback = logStrategyFeedback('double');

  const [card, shoe] = drawCard(state.shoe);
  const runningCount = updateRunningCount(state.runningCount, card);
  const newCards = [...hand.cards, card];
  const updatedHand: PlayerHandState = { ...hand, cards: newCards, doubled: true };
  const playerHands = state.playerHands.map((h, i) =>
    i === state.activeHandIndex ? updatedHand : h
  );

  if (isBust(newCards)) {
    const bustedHand: PlayerHandState = { ...updatedHand, outcome: 'lost' };
    const nextHands = playerHands.map((h, i) => i === state.activeHandIndex ? bustedHand : h);
    const nextState: GameState = {
      ...state,
      shoe,
      playerHands: nextHands,
      runningCount,
      discardedCount: state.discardedCount + 1,
      feedback,
    };
    return advanceHand(nextState);
  }

  // Auto-stand after double
  return advanceHand({
    ...state,
    shoe,
    playerHands,
    runningCount,
    discardedCount: state.discardedCount + 1,
    feedback,
  });
}

export function gameSplit(): GameState {
  const state = appStore.getState().game;
  if (!state || state.phase !== 'player-turn') return state ?? createGameState(6);
  const hand = state.playerHands[state.activeHandIndex];
  if (!hand || hand.cards.length !== 2) return state;

  const feedback = logStrategyFeedback('split');

  const [cardA, cardB] = hand.cards;
  const [newA, shoe1] = drawCard(state.shoe);
  const [newB, shoe2] = drawCard(shoe1);

  let runningCount = state.runningCount;
  runningCount = updateRunningCount(runningCount, newA);
  runningCount = updateRunningCount(runningCount, newB);

  const handA: PlayerHandState = { cards: [cardA!, newA] };
  const handB: PlayerHandState = { cards: [cardB!, newB] };

  const before = state.playerHands.slice(0, state.activeHandIndex);
  const after = state.playerHands.slice(state.activeHandIndex + 1);
  const playerHands = [...before, handA, handB, ...after];

  return {
    ...state,
    shoe: shoe2,
    playerHands,
    runningCount,
    discardedCount: state.discardedCount + 2,
    feedback,
  };
}

export function gameSkip(): GameState {
  const state = appStore.getState().game;
  if (!state) return createGameState(6);
  const { settings } = appStore.getState();
  return newGame(settings.deckCount, settings.trainingMode, settings.trainingThreshold);
}

function advanceHand(state: GameState): GameState {
  const nextIndex = state.activeHandIndex + 1;
  if (nextIndex < state.playerHands.length) {
    return { ...state, activeHandIndex: nextIndex, feedback: state.feedback };
  }
  return runDealer(state);
}

function runDealer(state: GameState): GameState {
  const revealed: Card[] = state.dealerHand.map((c) => ({ ...c, hidden: false }));
  let runningCount = state.runningCount;
  const holeCard = revealed[0];
  if (holeCard) {
    runningCount = updateRunningCount(runningCount, holeCard);
  }

  let dealerHand = revealed;
  let shoe = state.shoe;
  let discardedCount = state.discardedCount;

  const allBusted = state.playerHands.every((h) => isBust(h.cards));

  const { dealerHitsOnSoft17 } = appStore.getState().settings;

  if (!allBusted) {
    while (true) {
      const val = handValue(dealerHand);
      if (val > 21) break;
      if (val >= 17) {
        if (!dealerHitsOnSoft17) break;
        // Check if soft 17
        let total = 0;
        let aces = 0;
        for (const card of dealerHand) {
          if (card.rank === 'A') { aces++; total += 11; }
          else if (['T','J','Q','K'].includes(card.rank as string)) total += 10;
          else total += card.rank as number;
        }
        while (total > 21 && aces > 0) { total -= 10; aces--; }
        if (aces === 0 || total !== 17) break;
      }
      const [card, remaining] = drawCard(shoe);
      shoe = remaining;
      runningCount = updateRunningCount(runningCount, card);
      dealerHand = [...dealerHand, card];
      discardedCount++;
    }
  }

  const dealerVal = handValue(dealerHand);
  const dealerBust = dealerVal > 21;
  const dealerBJ = isBlackjack(dealerHand);

  const playerHands = state.playerHands.map((hand): PlayerHandState => {
    if (hand.outcome) return hand;
    const playerVal = handValue(hand.cards);
    const playerBJ = isBlackjack(hand.cards);

    if (isBust(hand.cards)) return { ...hand, outcome: 'lost' };
    if (playerBJ && dealerBJ) return { ...hand, outcome: 'push' };
    if (playerBJ) return { ...hand, outcome: 'won' };
    if (dealerBJ) return { ...hand, outcome: 'lost' };
    if (dealerBust) return { ...hand, outcome: 'won' };
    if (playerVal > dealerVal) return { ...hand, outcome: 'won' };
    if (playerVal < dealerVal) return { ...hand, outcome: 'lost' };
    return { ...hand, outcome: 'push' };
  });

  const outcomes = playerHands.map((h) => h.outcome);
  const resultMessage = outcomes
    .map((o) => {
      switch (o) {
        case 'won': return 'Won';
        case 'lost': return 'Lost';
        case 'push': return 'Push';
        default: return '';
      }
    })
    .filter(Boolean)
    .join(' | ');

  return {
    ...state,
    phase: 'result',
    shoe,
    dealerHand,
    playerHands,
    runningCount,
    discardedCount,
    feedback: state.feedback,
    resultMessage,
  };
}

// ── Convenience wrappers that sync to appStore ────────────────────

export function dealAndSync(deckCount: number, trainingMode: boolean, trainingThreshold: number): void {
  const game = newGame(deckCount, trainingMode, trainingThreshold);
  appStore.setGame(game);
}

export function hitAndSync(): void {
  const game = gameHit();
  appStore.setGame(game);
}

export function standAndSync(): void {
  const game = gameStand();
  appStore.setGame(game);
}

export function doubleAndSync(): void {
  const game = gameDouble();
  appStore.setGame(game);
}

export function splitAndSync(): void {
  const game = gameSplit();
  appStore.setGame(game);
}

export function skipAndSync(): void {
  const game = gameSkip();
  appStore.setGame(game);
}

export function clearFeedbackAndSync(): void {
  const state = appStore.getState().game;
  if (!state) return;
  appStore.setGame({ ...state, feedback: null });
}

export function advanceAfterFeedback(): void {
  const state = appStore.getState().game;
  if (!state || !state.feedback) return;

  const hand = state.playerHands[state.activeHandIndex];
  // If hand has outcome (bust/stand after double/surrender), advance
  if (hand?.outcome) {
    const next = advanceHand({ ...state, feedback: null });
    appStore.setGame(next);
    return;
  }

  // If there are more hands to play
  if (state.playerHands.length > 1 && state.activeHandIndex < state.playerHands.length - 1) {
    const next = advanceHand({ ...state, feedback: null });
    appStore.setGame(next);
    return;
  }

  // Just clear feedback
  appStore.setGame({ ...state, feedback: null });
}
