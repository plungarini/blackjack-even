import { OsEventTypeList } from '@evenrealities/even_hub_sdk';
import type { EvenHubEvent } from '@evenrealities/even_hub_sdk';
import type { HudLayoutDescriptor, View, ViewKey } from '../../types';
import { ROOT_LAYOUT, BODY_INNER_WIDTH } from '../shared-shell';
import { centerLine, alignRow } from '../../utils';
import type { Router } from '../../router';
import { scheduleRender } from '../../render-loop';
import { appStore } from '../../../app/store';
import type { StrategyVs, StrategyCellValue } from '../../../domain/strategy';
import { lookupStrategy } from '../../../domain/strategy';

type StrategyPageEntry = '8' | '9' | '10' | '11' | '12' | '13' | '14' | '15' | '16' | '17'
  | 'A,2' | 'A,3' | 'A,4' | 'A,5' | 'A,6' | 'A,7' | 'A,8'
  | '2,2' | '3,3' | '4,4' | '5,5' | '6,6' | '7,7' | '8,8' | '9,9' | '10,10' | 'A,A';

const HARD_ROWS: StrategyPageEntry[] = ['8', '9', '10', '11', '12', '13', '14', '15', '16', '17'];
const SOFT_ROWS: StrategyPageEntry[] = ['A,2', 'A,3', 'A,4', 'A,5', 'A,6', 'A,7', 'A,8'];
const PAIR_ROWS: StrategyPageEntry[] = ['2,2', '3,3', '4,4', '5,5', '6,6', '7,7', '8,8', '9,9', '10,10', 'A,A'];

const PAGE_ROWS: StrategyPageEntry[][] = [HARD_ROWS, SOFT_ROWS, PAIR_ROWS];
const PAGE_TITLES = ['Hard Totals', 'Soft Hands', 'Pairs'];

const CELL_CHARS: Record<StrategyCellValue, string> = {
  'H':   'Ｈ',
  'S':   'Ｓ',
  'P':   'Ｐ',
  'D/H': 'Ｄ',
  'D/S': 'Ｄ',
  'P/H': 'Ｐ',
  'R/H': 'Ｒ',
};

const COLS: StrategyVs[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];

function buildTableBody(page: number): string {
  const state = appStore.getState();
  const rows = PAGE_ROWS[page] ?? HARD_ROWS;

  const header = `     ２ ３ ４ ５ ６ ７ ８ ９ Ｔ Ａ`;
  const dataRows = rows.map((entry) => {
    const label = entry.padEnd(4);
    const cells = COLS.map((vs) => {
      const cell = lookupStrategy(entry, vs, state.strategyOverrides);
      return CELL_CHARS[cell];
    }).join(' ');
    return `${label} ${cells}`;
  });

  return [header, ...dataRows].join('\n');
}

export class StrategyView implements View {
  readonly key: ViewKey = 'strategy';
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
    const title = PAGE_TITLES[this.page] ?? 'Hard Totals';
    const pageLabel = `${this.page + 1}/3`;
    return {
      shield: '',
      header: alignRow(title, pageLabel, BODY_INNER_WIDTH),
      body: buildTableBody(this.page),
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
