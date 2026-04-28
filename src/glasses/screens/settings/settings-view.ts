import { OsEventTypeList } from '@evenrealities/even_hub_sdk';
import type { EvenHubEvent } from '@evenrealities/even_hub_sdk';
import type { HudLayoutDescriptor, View, ViewKey } from '../../types';
import { ROOT_LAYOUT, BODY_INNER_WIDTH, buildHeader, buildFooter } from '../shared-shell';
import { centerLine } from '../../utils';
import type { Router } from '../../router';

export class SettingsView implements View {
  readonly key: ViewKey = 'settings';
  private router: Router | null = null;

  setRouter(router: Router): void {
    this.router = router;
  }

  layout(): HudLayoutDescriptor {
    return ROOT_LAYOUT;
  }

  contents(): Record<string, string> {
    return {
      shield: '',
      header: buildHeader('Settings'),
      body: [
        '',
        centerLine('Settings', BODY_INNER_WIDTH),
        '',
        centerLine('Adjust on your phone', BODY_INNER_WIDTH),
      ].join('\n'),
      footer: buildFooter('settings'),
    };
  }

  handleEvent(event: EvenHubEvent): void {
    const type = event.textEvent?.eventType ?? event.sysEvent?.eventType ?? event.listEvent?.eventType;
    if (type === OsEventTypeList.DOUBLE_CLICK_EVENT) {
      this.router?.push('menu');
    }
  }
}
