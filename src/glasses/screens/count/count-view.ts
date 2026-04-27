import { OsEventTypeList } from '@evenrealities/even_hub_sdk';
import type { EvenHubEvent } from '@evenrealities/even_hub_sdk';
import type { HudLayoutDescriptor, View, ViewKey } from '../../types';
import { ROOT_LAYOUT, BODY_INNER_WIDTH } from '../shared-shell';
import { centerLine } from '../../utils';
import type { Router } from '../../router';
import { scheduleRender } from '../../render-loop';
import { appStore } from '../../../app/store';
import { computeTrueCount } from '../../../domain/count';

type ConfirmChoice = 'yes' | 'no';

export class CountView implements View {
  readonly key: ViewKey = 'count';
  private router: Router | null = null;
  private confirmShowing = false;
  private confirmChoice: ConfirmChoice = 'yes';

  setRouter(router: Router): void {
    this.router = router;
  }

  enter(): void {
    this.confirmShowing = false;
  }

  layout(): HudLayoutDescriptor {
    return ROOT_LAYOUT;
  }

  contents(): Record<string, string> {
    const state = appStore.getState();
    const { runningCount, discardedCards, settings } = state;
    const trueCount = computeTrueCount(runningCount, discardedCards, settings.deckCount);
    const sign = (n: number) => (n > 0 ? `+${n}` : String(n));

    if (this.confirmShowing) {
      return {
        shield: '',
        header: centerLine('♠ BLACKJACK ♠', BODY_INNER_WIDTH),
        body: [
          '',
          centerLine('Reset count?', BODY_INNER_WIDTH),
          '',
          `  ${this.confirmChoice === 'yes' ? '▶' : ' '} Yes`,
          `  ${this.confirmChoice === 'no'  ? '▶' : ' '} No`,
        ].join('\n'),
        footer: centerLine('Scroll=select  ·  Tap=confirm', BODY_INNER_WIDTH),
      };
    }

    return {
      shield: '',
      header: centerLine('♠ BLACKJACK ♠', BODY_INNER_WIDTH),
      body: [
        '',
        centerLine(`Running count:  ${sign(runningCount)}`, BODY_INNER_WIDTH),
        '',
        centerLine(`True count:  ${sign(trueCount)}`, BODY_INNER_WIDTH),
        '',
        centerLine(`Shoe: ${settings.deckCount} decks  ·  ${discardedCards} cards dealt`, BODY_INNER_WIDTH),
      ].join('\n'),
      footer: centerLine('↑ +1  ↓ −1  ·  Tap=reset  ·  2×=menu', BODY_INNER_WIDTH),
    };
  }

  handleEvent(event: EvenHubEvent): void {
    const type = event.textEvent?.eventType ?? event.sysEvent?.eventType ?? event.listEvent?.eventType;

    if (type === OsEventTypeList.DOUBLE_CLICK_EVENT) {
      this.router?.push('menu');
      return;
    }

    if (this.confirmShowing) {
      if (type === OsEventTypeList.SCROLL_TOP_EVENT || type === OsEventTypeList.SCROLL_BOTTOM_EVENT) {
        this.confirmChoice = this.confirmChoice === 'yes' ? 'no' : 'yes';
        scheduleRender();
        return;
      }
      if (type === OsEventTypeList.CLICK_EVENT || type === undefined) {
        if (this.confirmChoice === 'yes') appStore.resetCount();
        this.confirmShowing = false;
        scheduleRender();
        return;
      }
      return;
    }

    if (type === OsEventTypeList.SCROLL_TOP_EVENT) {
      appStore.setRunningCount(appStore.getState().runningCount + 1);
      appStore.incrementDiscarded(1);
      return; // store commit triggers scheduleRender via subscription
    }

    if (type === OsEventTypeList.SCROLL_BOTTOM_EVENT) {
      appStore.setRunningCount(appStore.getState().runningCount - 1);
      appStore.incrementDiscarded(1);
      return;
    }

    if (type === OsEventTypeList.CLICK_EVENT || type === undefined) {
      this.confirmShowing = true;
      this.confirmChoice = 'yes';
      scheduleRender();
    }
  }
}
