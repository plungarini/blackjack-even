import { waitForEvenAppBridge } from '@evenrealities/even_hub_sdk';
import { HudSession } from './glasses/session';
import { Router } from './glasses/router';
import { initRenderLoop, scheduleRender } from './glasses/render-loop';
import { initEventDispatcher } from './glasses/events';
import { CountView } from './glasses/screens/count/count-view';
import { TrainView } from './glasses/screens/train/train-view';
import { StrategyView } from './glasses/screens/strategy/strategy-view';
import { StatsView } from './glasses/screens/stats/stats-view';
import { SettingsView } from './glasses/screens/settings/settings-view';
import { MenuView } from './glasses/screens/menu/menu-view';
import { appStore } from './app/store';
import type { ViewKey } from './glasses/types';

const TAB_TO_VIEW: Record<string, ViewKey> = {
  count: 'count',
  train: 'train',
  strategy: 'strategy',
  stats: 'stats',
  settings: 'settings',
};

async function boot(): Promise<void> {
  try {
    console.log('[GlassesMain] waiting for Even bridge…');
    const bridge = await waitForEvenAppBridge();
    console.log('[GlassesMain] bridge acquired');

    const session = new HudSession(bridge);

    const countView = new CountView();
    const trainView = new TrainView();
    const strategyView = new StrategyView();
    const statsView = new StatsView();
    const settingsView = new SettingsView();
    const menuView = new MenuView(bridge);

    const initialKey = (TAB_TO_VIEW[appStore.getState().tab] ?? 'count') as ViewKey;

    const router = new Router(
      { count: countView, train: trainView, strategy: strategyView, stats: statsView, settings: settingsView, menu: menuView },
      initialKey,
    );

    countView.setRouter(router);
    trainView.setRouter(router);
    strategyView.setRouter(router);
    statsView.setRouter(router);
    settingsView.setRouter(router);
    menuView.setRouter(router);

    initRenderLoop(session, router);
    initEventDispatcher(bridge, router);

    let lastTab = appStore.getState().tab;
    appStore.subscribe(() => {
      const state = appStore.getState();
      if (state.tab !== lastTab) {
        lastTab = state.tab;
        const target = TAB_TO_VIEW[state.tab] as ViewKey | undefined;
        if (target && router.currentKey !== 'menu' && router.currentKey !== target) {
          router.reset(target);
        }
      }
      scheduleRender();
    });

    router.subscribe(scheduleRender);
    scheduleRender();
  } catch (error) {
    console.warn('[GlassesMain] bridge unavailable — web-only mode', error);
  }
}

void boot();
