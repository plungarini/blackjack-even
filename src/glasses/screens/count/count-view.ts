import type { EvenHubEvent } from '@evenrealities/even_hub_sdk';
import { OsEventTypeList } from '@evenrealities/even_hub_sdk';
import { appStore } from '../../../app/store';
import { computeTrueCount } from '../../../domain/count';
import { scheduleRender } from '../../render-loop';
import type { Router } from '../../router';
import type { HudLayoutDescriptor, View, ViewKey } from '../../types';
import { alignRow, centerLine } from '../../utils';
import { BODY_INNER_WIDTH, buildFooter, buildHeader, ROOT_LAYOUT } from '../shared-shell';

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
		const halfDecks = Math.floor(discardedCards / 26);
		const totalHalfDecks = settings.deckCount * 2;
		const remainingHalfDecks = Math.max(0, totalHalfDecks - halfDecks);

		if (this.confirmShowing) {
			return {
				shield: '',
				header: buildHeader(),
				body: [
					'',
					centerLine('Reset count?', BODY_INNER_WIDTH),
					'',
					`  ${this.confirmChoice === 'yes' ? '▶' : ' '} Yes`,
					`  ${this.confirmChoice === 'no' ? '▶' : ' '} No`,
				].join('\n'),
				footer: buildFooter('count'),
			};
		}

		return {
			shield: '',
			header: buildHeader(),
			body: [
				'',
				centerLine(`${sign(runningCount)}`, BODY_INNER_WIDTH),
				'',
				alignRow('True count', sign(trueCount), BODY_INNER_WIDTH),
				'',
				alignRow('Decks remaining', `${(remainingHalfDecks / 2).toFixed(1)}`, BODY_INNER_WIDTH),
				alignRow('Cards dealt', `${discardedCards}`, BODY_INNER_WIDTH),
			].join('\n'),
			footer: buildFooter('count'),
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
			return;
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
