import { OsEventTypeList } from '@evenrealities/even_hub_sdk';
import type { EvenHubEvent } from '@evenrealities/even_hub_sdk';
import type { HudLayoutDescriptor, View, ViewKey } from '../../types';
import { ROOT_LAYOUT, BODY_INNER_WIDTH } from '../shared-shell';
import { centerLine } from '../../utils';
import type { Router } from '../../router';
import { scheduleRender } from '../../render-loop';
import { appStore } from '../../../app/store';
import { pickTrainingHand, ALL_ENTRIES, ALL_VS } from '../../../domain/training';
import type { TrainHand } from '../../../domain/training';
import { lookupStrategy, resolveAction } from '../../../domain/strategy';
import type { PlayerAction } from '../../../domain/strategy';
import { handValue, isPair } from '../../../domain/hand';
import { displayCard } from '../../../domain/deck';

const ACTION_LABELS: Record<PlayerAction, string> = {
  hit: 'Hit',
  stand: 'Stand',
  double: 'Double',
  split: 'Split',
  surrender: 'Surrender',
};

export class TrainView implements View {
  readonly key: ViewKey = 'train';
  private router: Router | null = null;

  private currentHand: TrainHand | null = null;
  private phase: 'question' | 'feedback' = 'question';
  private selectedActionIndex = 0;
  private lastAction: PlayerAction | null = null;
  private wasCorrect = false;

  setRouter(router: Router): void {
    this.router = router;
  }

  enter(): void {
    this.loadNextHand();
  }

  layout(): HudLayoutDescriptor {
    return ROOT_LAYOUT;
  }

  private get availableActions(): PlayerAction[] {
    if (!this.currentHand) return ['hit', 'stand'];
    const cards = this.currentHand.playerCards;
    const actions: PlayerAction[] = ['hit', 'stand'];
    if (cards.length === 2) actions.push('double');
    if (cards.length === 2 && isPair(cards)) actions.push('split');
    return actions;
  }

  private loadNextHand(): void {
    const state = appStore.getState();
    const threshold = state.settings.trainingThreshold / 100;
    const hand = pickTrainingHand(state.trainStats, threshold, ALL_ENTRIES, ALL_VS);
    this.currentHand = hand;
    this.phase = 'question';
    this.selectedActionIndex = 0;
    this.lastAction = null;
  }

  private submitAction(action: PlayerAction): void {
    if (!this.currentHand) return;
    const state = appStore.getState();
    const { entry, vs } = this.currentHand;
    const cell = lookupStrategy(entry, vs, state.strategyOverrides);
    const correctAction = resolveAction(
      cell,
      action === 'double',
      action === 'split',
      false,
    );
    this.wasCorrect = action === correctAction;
    this.lastAction = action;
    appStore.recordTrainResult(this.wasCorrect, entry, vs);
    this.phase = 'feedback';
    scheduleRender();
  }

  contents(): Record<string, string> {
    if (!this.currentHand) {
      return {
        shield: '',
        header: centerLine('♠ BLACKJACK ♠', BODY_INNER_WIDTH),
        body: [
          '',
          centerLine('All scenarios mastered!', BODY_INNER_WIDTH),
          '',
          centerLine('Reset stats to keep training', BODY_INNER_WIDTH),
        ].join('\n'),
        footer: centerLine('2×=menu', BODY_INNER_WIDTH),
      };
    }

    const { playerCards, dealerUpcard } = this.currentHand;
    const playerStr = playerCards.map(displayCard).join(' ');
    const playerTotal = handValue(playerCards);
    const dealerStr = displayCard(dealerUpcard);

    if (this.phase === 'question') {
      const actions = this.availableActions;
      const footerParts = actions.map((a, i) =>
        i === this.selectedActionIndex
          ? `▶${ACTION_LABELS[a]}`
          : ` ${ACTION_LABELS[a]}`
      );
      const footerLine = footerParts.join('   ');

      return {
        shield: '',
        header: centerLine('♠ BLACKJACK ♠', BODY_INNER_WIDTH),
        body: [
          '',
          `  Dealer: ${dealerStr}`,
          '',
          `  You: ${playerStr}  (${playerTotal})`,
        ].join('\n'),
        footer: centerLine(footerLine, BODY_INNER_WIDTH),
      };
    }

    const state = appStore.getState();
    const total = state.trainTotalCorrect + state.trainTotalIncorrect;
    const accPct = total === 0 ? 0 : Math.round((state.trainTotalCorrect / total) * 100);
    const streak = state.trainStreakCorrect;

    const { entry, vs } = this.currentHand;
    const cell = lookupStrategy(entry, vs, state.strategyOverrides);
    const correctAction = resolveAction(cell, true, true, false);

    const resultLine = this.wasCorrect
      ? `✓ Correct! (${ACTION_LABELS[correctAction]})`
      : `✗ Wrong  (you said: ${this.lastAction ? ACTION_LABELS[this.lastAction] : '?'})`;

    const lines: string[] = [
      `  ${resultLine}`,
      '',
    ];

    if (!this.wasCorrect) {
      lines.push(`  Correct: ${ACTION_LABELS[correctAction]}`);
      lines.push('');
    }

    lines.push(`  Dealer: ${dealerStr}  You: ${playerStr} (${playerTotal})`);
    lines.push('');
    lines.push(`  Streak: ${streak}  |  Acc: ${accPct}%`);

    return {
      shield: '',
      header: centerLine('♠ BLACKJACK ♠', BODY_INNER_WIDTH),
      body: lines.join('\n'),
      footer: centerLine('Tap or scroll = next  ·  2×=menu', BODY_INNER_WIDTH),
    };
  }

  handleEvent(event: EvenHubEvent): void {
    const type = event.textEvent?.eventType ?? event.sysEvent?.eventType ?? event.listEvent?.eventType;

    if (type === OsEventTypeList.DOUBLE_CLICK_EVENT) {
      this.router?.push('menu');
      return;
    }

    if (this.phase === 'feedback') {
      this.loadNextHand();
      scheduleRender();
      return;
    }

    if (type === OsEventTypeList.SCROLL_TOP_EVENT) {
      const actions = this.availableActions;
      this.selectedActionIndex = (this.selectedActionIndex - 1 + actions.length) % actions.length;
      scheduleRender();
      return;
    }

    if (type === OsEventTypeList.SCROLL_BOTTOM_EVENT) {
      const actions = this.availableActions;
      this.selectedActionIndex = (this.selectedActionIndex + 1) % actions.length;
      scheduleRender();
      return;
    }

    if (type === OsEventTypeList.CLICK_EVENT || type === undefined) {
      const actions = this.availableActions;
      const selected = actions[this.selectedActionIndex];
      if (selected) this.submitAction(selected);
      return;
    }
  }
}
