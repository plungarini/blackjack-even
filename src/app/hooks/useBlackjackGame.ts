import { useState, useCallback, useEffect } from 'react';
import { computeTrueCount } from '../../domain/count';
import { canDouble, canSplit } from '../../domain/hand';
import { appStore } from '../store';
import {
  dealAndSync,
  hitAndSync,
  standAndSync,
  doubleAndSync,
  splitAndSync,
  advanceAfterFeedback,
} from '../../domain/game-controller';

export function useBlackjackGame(deckCount: number, trainingMode: boolean, trainingThreshold: number) {
  const [, setTick] = useState(0);
  const [showCount, setShowCount] = useState(true);
  const [showScore, setShowScore] = useState(true);

  // Subscribe to appStore changes so both webview and HUD re-render
  useEffect(() => {
    return appStore.subscribe(() => setTick((t) => t + 1));
  }, []);

  const game = appStore.getState().game;
  const trueCount = computeTrueCount(
    game?.runningCount ?? 0,
    game?.discardedCount ?? 0,
    deckCount,
  );

  const newGame = useCallback(() => {
    dealAndSync(deckCount, trainingMode, trainingThreshold);
  }, [deckCount, trainingMode, trainingThreshold]);

  const hit = useCallback(() => {
    hitAndSync();
  }, []);

  const stand = useCallback(() => {
    standAndSync();
  }, []);

  const double = useCallback(() => {
    doubleAndSync();
  }, []);

  const split = useCallback(() => {
    splitAndSync();
  }, []);

  const skipOrClear = useCallback(() => {
    const g = appStore.getState().game;
    if (!g) return;
    if (g.phase === 'result') {
      dealAndSync(deckCount, trainingMode, trainingThreshold);
    } else if (g.feedback) {
      advanceAfterFeedback();
    }
  }, [deckCount, trainingMode, trainingThreshold]);

  const activeHand = game?.playerHands[game.activeHandIndex];
  const canDoubleCurrent = game?.phase === 'player-turn' && canDouble(activeHand?.cards ?? []);
  const canSplitCurrent = game?.phase === 'player-turn' && canSplit(activeHand?.cards ?? []);
  const gameOver = game?.phase === 'result';

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
    skipOrClear,
    canDoubleCurrent,
    canSplitCurrent,
    gameOver,
  };
}
