import { appStore } from '../store';
import { lookupStrategy, getStrategyEntry, resolveAction } from '../../domain/strategy';
import type { StrategyVs } from '../../domain/strategy';
import { persistTrainStats } from '../bootstrap';
import type { Card } from '../../domain/deck';
import type { PlayerAction } from '../../domain/strategy';

export function useTrainActions() {
  const checkAnswer = (
    playerCards: Card[],
    dealerUpcard: Card,
    action: PlayerAction,
  ): boolean => {
    const state = appStore.getState();
    const entry = getStrategyEntry(playerCards);
    if (!entry) return false;

    const vs = dealerUpcardToVs(dealerUpcard);
    const cell = lookupStrategy(entry, vs, state.strategyOverrides);
    const correct =
      resolveAction(
        cell,
        action === 'double',
        action === 'split',
        action === 'surrender',
      ) === action;

    appStore.recordTrainResult(correct, entry, vs);
    void persistTrainStats();
    return correct;
  };

  return { checkAnswer };
}

function dealerUpcardToVs(card: Card): StrategyVs {
  const { rank } = card;
  if (rank === 'A') return 'A';
  if (rank === 'T' || rank === 'J' || rank === 'Q' || rank === 'K' || rank === 10) return '10';
  return String(rank) as StrategyVs;
}
