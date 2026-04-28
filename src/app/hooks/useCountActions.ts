import { appStore } from '../store';
import { updateRunningCount } from '../../domain/count';
import type { Card } from '../../domain/deck';
import { persistSettings } from '../bootstrap';

export function useCountActions() {
  const logCard = (card: Card): void => {
    const state = appStore.getState();
    const newCount = updateRunningCount(state.runningCount, card);
    appStore.setRunningCount(newCount);
    appStore.incrementDiscarded(1);
  };

  const resetCount = (): void => {
    appStore.resetCount();
  };

  const setDecks = (deckCount: number): void => {
    appStore.updateSettings({ deckCount });
    void persistSettings();
  };

  return { logCard, resetCount, setDecks };
}
