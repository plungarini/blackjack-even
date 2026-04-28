import { useState, useCallback } from 'react';
import { Card, buildShoe, drawCard, drawCardByValue, Rank } from '../../domain/deck';
import { handValue, isBust, isBlackjack, canDouble, canSplit } from '../../domain/hand';
import { updateRunningCount, computeTrueCount } from '../../domain/count';
import { getStrategyFeedback, isActionCorrect, type PlayerAction } from '../../domain/strategy';
import { upsertStat, type StatsMap } from '../../domain/stats';
import { appStore } from '../store';
import { persistTrainStats } from '../bootstrap';

export interface PlayerHand {
  cards: Card[];
  outcome?: 'won' | 'lost' | 'push';
  doubled?: boolean;
}

export interface GameUIState {
  phase: 'idle' | 'player-turn' | 'dealer-turn' | 'result';
  shoe: Card[];
  dealerHand: Card[];
  playerHands: PlayerHand[];
  activeHandIndex: number;
  runningCount: number;
  discardedCount: number;
  feedback: { isCorrect: boolean; entry: string; vs: string; actions: PlayerAction[]; action: PlayerAction } | null;
  resultMessage?: string;
}

interface TrainingTarget {
  player: [Rank, Rank];
  dealer: Rank;
}

function getTrainingTarget(stats: StatsMap, threshold: number): TrainingTarget | null {
  const entries = [
    '8','9','10','11','12','13','14','15','16','17',
    'A,2','A,3','A,4','A,5','A,6','A,7','A,8',
    '2,2','3,3','4,4','5,5','6,6','7,7','8,8','9,9','10,10','A,A',
  ] as const;
  const vss = ['2','3','4','5','6','7','8','9','10','A'] as const;

  const weak: { id: string; entry: string; vs: string }[] = [];
  for (const entry of entries) {
    for (const vs of vss) {
      const id = `${entry}_${vs}`;
      const stat = stats[id];
      const total = (stat?.correct ?? 0) + (stat?.incorrect ?? 0);
      const acc = total === 0 ? 0 : (stat!.correct / total);
      if (acc <= threshold / 100) {
        weak.push({ id, entry, vs });
      }
    }
  }

  if (weak.length === 0) return null;
  const pick = weak[Math.floor(Math.random() * weak.length)];

  // Parse entry into player cards
  let p1: Rank, p2: Rank;
  if (pick.entry.includes(',')) {
    const [a, b] = pick.entry.split(',');
    p1 = (a === 'A' ? 'A' : a === 'T' ? 'T' : parseInt(a)) as Rank;
    p2 = (b === 'A' ? 'A' : b === 'T' ? 'T' : parseInt(b)) as Rank;
  } else {
    const score = parseInt(pick.entry);
    // Find two non-matching cards that sum to score
    const nums: number[] = [2,3,4,5,6,7,8,9,10];
    const pairs: [Rank, Rank][] = [];
    for (const n1 of nums) {
      for (const n2 of nums) {
        if (n1 + n2 === score && n1 !== n2) {
          pairs.push([n1 as Rank, n2 as Rank]);
        }
      }
    }
    if (pairs.length === 0) {
      // Fallback: use any pair
      p1 = Math.floor(score / 2) as Rank;
      p2 = Math.ceil(score / 2) as Rank;
    } else {
      const pair = pairs[Math.floor(Math.random() * pairs.length)];
      p1 = pair[0];
      p2 = pair[1];
    }
  }

  const dealerVs = pick.vs;
  const dRank = (dealerVs === 'A' ? 'A' : dealerVs === '10' ? 'T' : parseInt(dealerVs)) as Rank;

  return { player: [p1, p2], dealer: dRank };
}

function createGameState(deckCount: number): GameUIState {
  return {
    phase: 'idle',
    shoe: buildShoe(deckCount),
    dealerHand: [],
    playerHands: [],
    activeHandIndex: 0,
    runningCount: 0,
    discardedCount: 0,
    feedback: null,
  };
}

export function useBlackjackGame(deckCount: number, trainingMode: boolean, trainingThreshold: number) {
  const [game, setGame] = useState<GameUIState>(() => createGameState(deckCount));
  const [showCount, setShowCount] = useState(true);
  const [showScore, setShowScore] = useState(true);

  const trueCount = computeTrueCount(game.runningCount, game.discardedCount, deckCount);

  const newGame = useCallback(() => {
    setGame((prev) => {
      let shoe = prev.shoe;
      let runningCount = prev.runningCount;
      let discardedCount = prev.discardedCount;

      if (shoe.length <= 15) {
        shoe = buildShoe(deckCount);
        runningCount = 0;
        discardedCount = 0;
      }

      // Count previous hands as discarded
      const prevCards = prev.playerHands.reduce((sum, h) => sum + h.cards.length, 0) + prev.dealerHand.length;
      discardedCount += prevCards;

      const stats = appStore.getState().trainStats;
      const target = trainingMode ? getTrainingTarget(stats, trainingThreshold) : null;

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
      const playerHand: PlayerHand = { cards: [p1, p2] };

      runningCount = updateRunningCount(runningCount, p1);
      runningCount = updateRunningCount(runningCount, d2);
      runningCount = updateRunningCount(runningCount, p2);

      discardedCount += 4;

      let phase: GameUIState['phase'] = 'player-turn';
      let resultMessage: string | undefined;

      // Check blackjacks
      if (isBlackjack(playerHand.cards)) {
        const revealedDealer = [{ ...d1 }, d2];
        runningCount = updateRunningCount(runningCount, d1);
        const dealerBJ = isBlackjack(revealedDealer);
        let outcome: PlayerHand['outcome'];
        if (dealerBJ) outcome = 'push';
        else outcome = 'won';
        phase = 'result';
        resultMessage = outcome === 'won' ? 'Blackjack!' : 'Push';
        return {
          ...prev,
          phase,
          shoe,
          dealerHand: revealedDealer,
          playerHands: [{ ...playerHand, outcome }],
          activeHandIndex: 0,
          runningCount,
          discardedCount,
          feedback: null,
          resultMessage,
        };
      }

      // Check dealer blackjack
      if (handValue([d1, d2]) === 21) {
        const revealedDealer = [{ ...d1 }, d2];
        runningCount = updateRunningCount(runningCount, d1);
        phase = 'result';
        resultMessage = 'Dealer Blackjack';
        return {
          ...prev,
          phase,
          shoe,
          dealerHand: revealedDealer,
          playerHands: [{ ...playerHand, outcome: 'lost' }],
          activeHandIndex: 0,
          runningCount,
          discardedCount,
          feedback: null,
          resultMessage,
        };
      }

      return {
        ...prev,
        phase,
        shoe,
        dealerHand,
        playerHands: [playerHand],
        activeHandIndex: 0,
        runningCount,
        discardedCount,
        feedback: null,
        resultMessage,
      };
    });
  }, [deckCount, trainingMode, trainingThreshold]);

  const logAction = useCallback((action: PlayerAction) => {
    setGame((prev) => {
      if (prev.phase !== 'player-turn') return prev;
      const hand = prev.playerHands[prev.activeHandIndex];
      if (!hand) return prev;

      const dealerUpcard = prev.dealerHand.find((c) => !c.hidden);
      if (!dealerUpcard) return prev;

      const feedback = getStrategyFeedback(hand.cards, dealerUpcard, appStore.getState().strategyOverrides);
      const isCorrect = isActionCorrect(feedback, action);

      // Persist stat
      const newStats = upsertStat(appStore.getState().trainStats, feedback.entry, feedback.vs, isCorrect);
      appStore.hydrate({ trainStats: newStats });
      void persistTrainStats();

      return { ...prev, feedback: { isCorrect, entry: feedback.entry, vs: feedback.vs, actions: feedback.actions, action } };
    });
  }, []);

  const hit = useCallback(() => {
    logAction('hit');
    setGame((prev) => {
      if (prev.phase !== 'player-turn') return prev;
      const hand = prev.playerHands[prev.activeHandIndex];
      if (!hand) return prev;

      const [card, shoe] = drawCard(prev.shoe);
      const runningCount = updateRunningCount(prev.runningCount, card);
      const newCards = [...hand.cards, card];
      const updatedHand: PlayerHand = { ...hand, cards: newCards };
      const playerHands = prev.playerHands.map((h, i) =>
        i === prev.activeHandIndex ? updatedHand : h
      );

      if (isBust(newCards)) {
        // Bust - move to next hand or dealer
        const bustedHand: PlayerHand = { ...updatedHand, outcome: 'lost' };
        const nextHands = playerHands.map((h, i) => i === prev.activeHandIndex ? bustedHand : h);
        const nextIndex = prev.activeHandIndex + 1;
        if (nextIndex < nextHands.length) {
          return {
            ...prev,
            shoe,
            playerHands: nextHands.map((h, i) => i === nextIndex ? { ...h, cards: [...h.cards, drawCard(shoe)[0]] } : h),
            activeHandIndex: nextIndex,
            runningCount,
            discardedCount: prev.discardedCount + 1,
          };
        }
        // All hands done - run dealer
        return runDealer({ ...prev, shoe, playerHands: nextHands, runningCount, discardedCount: prev.discardedCount + 1 });
      }

      return { ...prev, shoe, playerHands, runningCount, discardedCount: prev.discardedCount + 1 };
    });
  }, [logAction]);

  const stand = useCallback(() => {
    logAction('stand');
    setGame((prev) => {
      if (prev.phase !== 'player-turn') return prev;
      const nextIndex = prev.activeHandIndex + 1;
      if (nextIndex < prev.playerHands.length) {
        return {
          ...prev,
          activeHandIndex: nextIndex,
          playerHands: prev.playerHands.map((h, i) =>
            i === nextIndex ? { ...h, cards: [...h.cards, drawCard(prev.shoe)[0]] } : h
          ),
          shoe: prev.shoe.slice(0, -1),
          discardedCount: prev.discardedCount + 1,
        };
      }
      return runDealer(prev);
    });
  }, [logAction]);

  const double = useCallback(() => {
    logAction('double');
    setGame((prev) => {
      if (prev.phase !== 'player-turn') return prev;
      const hand = prev.playerHands[prev.activeHandIndex];
      if (!hand) return prev;

      const [card, shoe] = drawCard(prev.shoe);
      const runningCount = updateRunningCount(prev.runningCount, card);
      const newCards = [...hand.cards, { ...card, hidden: false, doubled: true }] as Card[];
      const updatedHand: PlayerHand = { ...hand, cards: newCards, doubled: true };
      const playerHands = prev.playerHands.map((h, i) =>
        i === prev.activeHandIndex ? updatedHand : h
      );

      if (isBust(newCards)) {
        const bustedHand: PlayerHand = { ...updatedHand, outcome: 'lost' };
        const nextHands = playerHands.map((h, i) => i === prev.activeHandIndex ? bustedHand : h);
        const nextIndex = prev.activeHandIndex + 1;
        if (nextIndex < nextHands.length) {
          return {
            ...prev,
            shoe,
            playerHands: nextHands.map((h, i) => i === nextIndex ? { ...h, cards: [...h.cards, drawCard(shoe)[0]] } : h),
            activeHandIndex: nextIndex,
            runningCount,
            discardedCount: prev.discardedCount + 1,
          };
        }
        return runDealer({ ...prev, shoe, playerHands: nextHands, runningCount, discardedCount: prev.discardedCount + 1 });
      }

      // Auto-stand after double
      const nextIndex = prev.activeHandIndex + 1;
      if (nextIndex < playerHands.length) {
        return {
          ...prev,
          shoe,
          activeHandIndex: nextIndex,
          playerHands: playerHands.map((h, i) => i === nextIndex ? { ...h, cards: [...h.cards, drawCard(shoe)[0]] } : h),
          runningCount,
          discardedCount: prev.discardedCount + 1,
        };
      }
      return runDealer({ ...prev, shoe, playerHands, runningCount, discardedCount: prev.discardedCount + 1 });
    });
  }, [logAction]);

  const split = useCallback(() => {
    logAction('split');
    setGame((prev) => {
      if (prev.phase !== 'player-turn') return prev;
      const hand = prev.playerHands[prev.activeHandIndex];
      if (!hand || hand.cards.length !== 2) return prev;

      const [cardA, cardB] = hand.cards;
      const [newA, shoe1] = drawCard(prev.shoe);
      const [newB, shoe2] = drawCard(shoe1);

      let runningCount = prev.runningCount;
      runningCount = updateRunningCount(runningCount, newA);
      runningCount = updateRunningCount(runningCount, newB);

      const handA: PlayerHand = { cards: [cardA!, newA] };
      const handB: PlayerHand = { cards: [cardB!, newB] };

      const before = prev.playerHands.slice(0, prev.activeHandIndex);
      const after = prev.playerHands.slice(prev.activeHandIndex + 1);
      const playerHands = [...before, handA, handB, ...after];

      return {
        ...prev,
        shoe: shoe2,
        playerHands,
        activeHandIndex: prev.activeHandIndex,
        runningCount,
        discardedCount: prev.discardedCount + 2,
      };
    });
  }, [logAction]);

  const canDoubleCurrent = game.phase === 'player-turn' && canDouble(game.playerHands[game.activeHandIndex]?.cards ?? []);
  const canSplitCurrent = game.phase === 'player-turn' && canSplit(game.playerHands[game.activeHandIndex]?.cards ?? []);
  const gameOver = game.phase === 'result';

  return {
    game,
    trueCount,
    showCount,
    setShowCount,
    showScore,
    setShowScore,
    newGame,
    hit,
    stand,
    double,
    split,
    canDoubleCurrent,
    canSplitCurrent,
    gameOver,
  };
}

function runDealer(state: GameUIState): GameUIState {
  // Reveal hole card
  const revealed: Card[] = state.dealerHand.map((c) => ({ ...c, hidden: false }));
  let runningCount = state.runningCount;
  const holeCard = revealed[0];
  if (holeCard) {
    runningCount = updateRunningCount(runningCount, holeCard);
  }

  let dealerHand = revealed;
  let shoe = state.shoe;
  let discardedCount = state.discardedCount;

  // Check if all player hands busted
  const allBusted = state.playerHands.every((h) => isBust(h.cards));

  if (!allBusted) {
    while (handValue(dealerHand) < 17) {
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

  const playerHands = state.playerHands.map((hand): PlayerHand => {
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
    resultMessage,
  };
}
