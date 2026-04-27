import { OsEventTypeList } from '@evenrealities/even_hub_sdk';
import type { EvenHubEvent } from '@evenrealities/even_hub_sdk';
import type { HudLayoutDescriptor, View, ViewKey } from '../../types';
import { ROOT_LAYOUT, BODY_INNER_WIDTH } from '../shared-shell';
import { centerLine, alignRow } from '../../utils';
import type { Router } from '../../router';
import { scheduleRender } from '../../render-loop';
import { appStore } from '../../../app/store';
import type { StrategyVs } from '../../../domain/strategy';
import { makeStatKey } from '../../../domain/stats';
import { accuracy, totalHands } from '../../../domain/stats';

type StatsPageEntry = '8' | '9' | '10' | '11' | '12' | '13' | '14' | '15' | '16' | '17'
  | 'A,2' | 'A,3' | 'A,4' | 'A,5' | 'A,6' | 'A,7' | 'A,8'
  | '2,2' | '3,3' | '4,4' | '5,5' | '6,6' | '7,7' | '8,8' | '9,9' | '10,10' | 'A,A';

const HARD_ROWS: StatsPageEntry[] = ['8', '9', '10', '11', '12', '13', '14', '15', '16', '17'];
const SOFT_ROWS: StatsPageEntry[] = ['A,2', 'A,3', 'A,4', 'A,5', 'A,6', 'A,7', 'A,8'];
const PAIR_ROWS: StatsPageEntry[] = ['2,2', '3,3', '4,4', '5,5', '6,6', '7,7', '8,8', '9,9', '10,10', 'A,A'];

const PAGE_ROWS: StatsPageEntry[][] = [HARD_ROWS, SOFT_ROWS, PAIR_ROWS];
const PAGE_TITLES = ['Hard Totals', 'Soft Hands', 'Pairs'];

const COLS: StrategyVs[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];

function barForAccuracy(acc: number): string {
  if (acc >= 0.8) return '▓▓▓';
  if (acc >= 0.6) return '▓▓░';
  if (acc >= 0.4) return '▓░░';
  return '░░░';
}

function buildStatsBody(page: number): string {
  const { trainStats } = appStore.getState();
  const rows = PAGE_ROWS[page] ?? HARD_ROWS;

  const header = `     ２ ３ ４ ５ ６ ７ ８ ９ Ｔ Ａ`;
  const dataRows = rows.map((entry) => {
    const label = entry.padEnd(4);
    const cells = COLS.map((vs) => {
      const key = makeStatKey(entry, vs);
      const stat = trainStats[key];
      if (!stat) return ' — ';
      return barForAccuracy(accuracy(stat));
    }).join(' ');
    return `${label} ${cells}`;
  });

  return [header, ...dataRows].join('\n');
}

function overallAccuracy(stats: ReturnType<typeof appStore.getState>['trainStats']): number {
  let correct = 0;
  let total = 0;
  for (const s of Object.values(stats)) {
    correct += s.correct;
    total += s.correct + s.incorrect;
  }
  return total === 0 ? 0 : correct / total;
}

export class StatsView implements View {
  readonly key: ViewKey = 'stats';
  private router: Router | null = null;
  private page = 0;

  setRouter(router: Router): void {
    this.router = router;
  }

  enter(): void {
    this.page = 0;
  }

  layout(): HudLayoutDescriptor {
    return ROOT_LAYOUT;
  }

  contents(): Record<string, string> {
    const { trainStats } = appStore.getState();
    const hands = totalHands(trainStats);
    const acc = overallAccuracy(trainStats);
    const accPct = hands === 0 ? '—' : `${Math.round(acc * 100)}%`;
    const title = PAGE_TITLES[this.page] ?? 'Hard Totals';
    const pageLabel = `${this.page + 1}/3`;
    const headerLeft = `${title}`;
    const summaryLine = hands === 0
      ? centerLine('No hands yet', BODY_INNER_WIDTH)
      : alignRow(`Acc: ${accPct}`, `${hands} hands`, BODY_INNER_WIDTH);

    return {
      shield: '',
      header: alignRow(headerLeft, pageLabel, BODY_INNER_WIDTH),
      body: hands === 0
        ? `\n\n${summaryLine}\n${centerLine('Play training to see stats', BODY_INNER_WIDTH)}`
        : `${summaryLine}\n${buildStatsBody(this.page)}`,
      footer: centerLine('↕ scroll · 2×-tap = menu', BODY_INNER_WIDTH),
    };
  }

  handleEvent(event: EvenHubEvent): void {
    const type = event.textEvent?.eventType ?? event.sysEvent?.eventType ?? event.listEvent?.eventType;
    if (type === OsEventTypeList.DOUBLE_CLICK_EVENT) {
      this.router?.push('menu');
      return;
    }
    if (type === OsEventTypeList.SCROLL_BOTTOM_EVENT) {
      this.page = (this.page + 1) % 3;
      scheduleRender();
      return;
    }
    if (type === OsEventTypeList.SCROLL_TOP_EVENT) {
      this.page = (this.page + 2) % 3;
      scheduleRender();
      return;
    }
  }
}
