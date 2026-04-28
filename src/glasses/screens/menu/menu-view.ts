import { OsEventTypeList } from '@evenrealities/even_hub_sdk';
import type { EvenHubEvent, EvenAppBridge } from '@evenrealities/even_hub_sdk';
import { appStore } from '../../../app/store';
import type { HudLayoutDescriptor, View, ViewKey } from '../../types';
import { HUD_WIDTH, HUD_HEIGHT, HUD_BORDER_RADIUS } from '../../constants';
import { centerLine } from '../../utils';
import type { Router } from '../../router';
import { scheduleRender } from '../../render-loop';
import type { RootViewKey } from '../shared-shell';

interface MenuEntry {
  view: RootViewKey;
  tab: RootViewKey;
  label: string;
  description: string;
}

const MENU_ITEMS: MenuEntry[] = [
  { view: 'count',    tab: 'count',    label: 'Count',    description: 'Running / true' },
  { view: 'strategy', tab: 'strategy', label: 'Strategy', description: 'Lookup table' },
  { view: 'train',    tab: 'train',    label: 'Train',    description: 'Practice hands' },
  { view: 'stats',    tab: 'stats',    label: 'Stats',    description: 'Accuracy heatmap' },
  { view: 'settings', tab: 'settings', label: 'Settings', description: 'Preferences' },
];

const ITEM_Y_START = 48;
const ITEM_STEP = 40;
const ITEM_H = 42;

function buildMenuLayout(selectedIndex: number): HudLayoutDescriptor {
  return {
    key: `menu-${selectedIndex}`,
    textDescriptors: [
      {
        containerID: 0,
        containerName: 'events',
        xPosition: 0,
        yPosition: 0,
        width: 0,
        height: HUD_HEIGHT,
        isEventCapture: 1,
      },
      {
        containerID: 1,
        containerName: 'header',
        xPosition: 0,
        yPosition: 8,
        width: HUD_WIDTH,
        height: 36,
        paddingLength: 4,
      },
      ...MENU_ITEMS.map((_item, index) => {
        const isSelected = index === selectedIndex;
        return {
          containerID: 2 + index,
          containerName: `item-${index}`,
          xPosition: 60,
          yPosition: ITEM_Y_START + index * ITEM_STEP,
          width: HUD_WIDTH - 120,
          height: ITEM_H,
          paddingLength: isSelected ? 6 : 7,
          borderWidth: isSelected ? 1 : 0,
          borderColor: isSelected ? 13 : 0,
          borderRadius: HUD_BORDER_RADIUS,
          isEventCapture: 0,
        };
      }),
    ],
  };
}

function buildMenuContents(activeTab: RootViewKey): Record<string, string> {
  const contents: Record<string, string> = {
    header: centerLine('╭───────    Blackjack    ───────╮', HUD_WIDTH),
  };
  for (let i = 0; i < MENU_ITEMS.length; i++) {
    const item = MENU_ITEMS[i]!;
    const activeIndicator = item.tab === activeTab ? '>  ' : '   ';
    contents[`item-${i}`] = ` ${activeIndicator}${item.label}  •  ${item.description}`;
  }
  return contents;
}

function tabToIndex(tab: RootViewKey): number {
  const idx = MENU_ITEMS.findIndex((item) => item.tab === tab);
  return Math.max(0, idx);
}

export class MenuView implements View {
  readonly key: ViewKey = 'menu';
  private router: Router | null = null;
  private selectedIndex = 0;

  constructor(private readonly bridge: EvenAppBridge) {}

  setRouter(router: Router): void {
    this.router = router;
  }

  enter(): void {
    // Seed selection to the currently active tab so the menu opens with
    // the user's current page highlighted.
    this.selectedIndex = tabToIndex(appStore.getState().tab);
  }

  layout(): HudLayoutDescriptor {
    return buildMenuLayout(this.selectedIndex);
  }

  contents(): Record<string, string> {
    return buildMenuContents(appStore.getState().tab);
  }

  handleEvent(event: EvenHubEvent): void {
    const type = event.textEvent?.eventType ?? event.sysEvent?.eventType ?? event.listEvent?.eventType;

    if (type === OsEventTypeList.DOUBLE_CLICK_EVENT) {
      void this.bridge.shutDownPageContainer(1).catch((error) => {
        console.error('[MenuView] shutDownPageContainer failed', error);
      });
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
      const entry = MENU_ITEMS[this.selectedIndex];
      if (!entry) return;
      appStore.setTab(entry.tab);
      this.router?.reset(entry.view);
    }
  }
}
