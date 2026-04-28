import type { EvenHubEvent } from '@evenrealities/even_hub_sdk';
import { OsEventTypeList } from '@evenrealities/even_hub_sdk';
import type { Router } from '../../router';
import type { HudLayoutDescriptor, View, ViewKey } from '../../types';
import { centerLine } from '../../utils';
import { BODY_INNER_WIDTH, buildFooter, buildHeader, ROOT_LAYOUT } from '../shared-shell';

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
			header: buildHeader(),
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
