import { OsEventTypeList } from '@evenrealities/even_hub_sdk';
import type { EvenHubEvent, EvenAppBridge } from '@evenrealities/even_hub_sdk';
import type { HudLayoutDescriptor, View, ViewKey } from '../../types';
import { ROOT_LAYOUT, BODY_INNER_WIDTH } from '../shared-shell';
import { centerLine } from '../../utils';
import type { Router } from '../../router';
import { scheduleRender } from '../../render-loop';

const MENU_ITEMS: { label: string; view: Exclude<ViewKey, 'menu'> }[] = [
  { label: 'Count',    view: 'count' },
  { label: 'Train',    view: 'train' },
  { label: 'Strategy', view: 'strategy' },
  { label: 'Stats',    view: 'stats' },
  { label: 'Settings', view: 'settings' },
];

export class MenuView implements View {
  readonly key: ViewKey = 'menu';
  private router: Router | null = null;
  private selectedIndex = 0;

  constructor(private readonly bridge: EvenAppBridge) {}

  setRouter(router: Router): void {
    this.router = router;
  }

  enter(): void {
    const current = this.router?.currentKey;
    const idx = MENU_ITEMS.findIndex((item) => item.view === current);
    this.selectedIndex = idx >= 0 ? idx : 0;
  }

  layout(): HudLayoutDescriptor {
    return ROOT_LAYOUT;
  }

  contents(): Record<string, string> {
    const lines = MENU_ITEMS.map((item, i) => {
      const prefix = i === this.selectedIndex ? '▶ ' : '  ';
      return `${prefix}${item.label}`;
    });
    return {
      shield: '',
      header: centerLine('MENU', BODY_INNER_WIDTH),
      body: '\n' + lines.join('\n'),
      footer: centerLine('Scroll=navigate  Tap=select  2×tap=exit', BODY_INNER_WIDTH),
    };
  }

  handleEvent(event: EvenHubEvent): void {
    const type = event.textEvent?.eventType ?? event.sysEvent?.eventType ?? event.listEvent?.eventType;

    if (type === OsEventTypeList.DOUBLE_CLICK_EVENT) {
      void this.bridge.shutDownPageContainer(1);
      return;
    }

    if (type === OsEventTypeList.SCROLL_TOP_EVENT) {
      this.selectedIndex = (this.selectedIndex - 1 + MENU_ITEMS.length) % MENU_ITEMS.length;
      scheduleRender();
      return;
    }

    if (type === OsEventTypeList.SCROLL_BOTTOM_EVENT) {
      this.selectedIndex = (this.selectedIndex + 1) % MENU_ITEMS.length;
      scheduleRender();
      return;
    }

    if (type === OsEventTypeList.CLICK_EVENT || type === undefined) {
      const item = MENU_ITEMS[this.selectedIndex];
      if (!item) return;
      void import('../../../app/store').then(({ appStore }) => {
        appStore.setTab(item.view);
      });
      this.router?.reset(item.view);
    }
  }
}
