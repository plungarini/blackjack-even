import { OsEventTypeList } from '@evenrealities/even_hub_sdk';
import type { EvenHubEvent } from '@evenrealities/even_hub_sdk';
import type { HudLayoutDescriptor, View, ViewKey } from '../../types';
import { ROOT_LAYOUT, BODY_INNER_WIDTH, buildHeader, buildFooter } from '../shared-shell';
import { centerLine, alignRow } from '../../utils';
import type { Router } from '../../router';
import { appStore } from '../../../app/store';
import { computeTrueCount } from '../../../domain/count';

export class TrainView implements View {
  readonly key: ViewKey = 'train';
  private router: Router | null = null;

  setRouter(router: Router): void {
    this.router = router;
  }

  layout(): HudLayoutDescriptor {
    return ROOT_LAYOUT;
  }

  contents(): Record<string, string> {
    const state = appStore.getState();
    const { runningCount, discardedCards, settings } = state;
    const trueCount = computeTrueCount(runningCount, discardedCards, settings.deckCount);
    const sign = (n: number) => (n > 0 ? `+${n}` : String(n));
    const halfDecks = Math.floor(discardedCards / 26);
    const totalHalfDecks = settings.deckCount * 2;
    const remainingHalfDecks = Math.max(0, totalHalfDecks - halfDecks);

    return {
      shield: '',
      header: buildHeader('Train'),
      body: [
        '',
        centerLine('Play on your phone', BODY_INNER_WIDTH),
        '',
        alignRow('Running', sign(runningCount), BODY_INNER_WIDTH),
        alignRow('True', sign(trueCount), BODY_INNER_WIDTH),
        '',
        alignRow('Decks left', `${(remainingHalfDecks / 2).toFixed(1)}`, BODY_INNER_WIDTH),
      ].join('\n'),
      footer: buildFooter('train'),
    };
  }

  handleEvent(event: EvenHubEvent): void {
    const type = event.textEvent?.eventType ?? event.sysEvent?.eventType ?? event.listEvent?.eventType;
    if (type === OsEventTypeList.DOUBLE_CLICK_EVENT) {
      this.router?.push('menu');
    }
  }
}
