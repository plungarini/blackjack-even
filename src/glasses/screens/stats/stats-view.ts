import { OsEventTypeList } from '@evenrealities/even_hub_sdk';
import type { EvenHubEvent } from '@evenrealities/even_hub_sdk';
import type { HudLayoutDescriptor, View, ViewKey } from '../../types';
import { ROOT_LAYOUT, BODY_INNER_WIDTH, buildHeader, buildFooter } from '../shared-shell';
import { centerLine } from '../../utils';
import type { Router } from '../../router';

export class StatsView implements View {
  readonly key: ViewKey = 'stats';
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
      header: buildHeader('Stats'),
      body: [
        '',
        centerLine('Stats', BODY_INNER_WIDTH),
        '',
        centerLine('Check on your phone', BODY_INNER_WIDTH),
      ].join('\n'),
      footer: buildFooter('stats'),
    };
  }

  handleEvent(event: EvenHubEvent): void {
    const type = event.textEvent?.eventType ?? event.sysEvent?.eventType ?? event.listEvent?.eventType;
    if (type === OsEventTypeList.DOUBLE_CLICK_EVENT) {
      this.router?.push('menu');
    }
  }
}
