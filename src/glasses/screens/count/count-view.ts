import type { EvenHubEvent } from '@evenrealities/even_hub_sdk';
import { OsEventTypeList } from '@evenrealities/even_hub_sdk';
import { appStore } from '../../../app/store';
import { computeTrueCount, suggestedUnits } from '../../../domain/count';
import type { Router } from '../../router';
import type { HudLayoutDescriptor, View, ViewKey } from '../../types';
import { alignRow } from '../../utils';
import { BODY_INNER_WIDTH, buildFooter, buildHeader, ROOT_LAYOUT } from '../shared-shell';

function fwDigits(str: string): string {
	return str.replace(/[0-9]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0xFEE0));
}

export class CountView implements View {
	readonly key: ViewKey = 'count';
	private router: Router | null = null;

	setRouter(router: Router): void {
		this.router = router;
	}

	enter(): void {
		// no-op
	}

	layout(): HudLayoutDescriptor {
		return ROOT_LAYOUT;
	}

	contents(): Record<string, string> {
		const state = appStore.getState();
		const { runningCount, discardedCards, settings } = state;
		const trueCount = computeTrueCount(runningCount, discardedCards, settings.deckCount);
		const sign = (n: number) => (n > 0 ? `+${n}` : String(n));
		const totalCards = settings.deckCount * 52;
		const remainingCards = Math.max(0, totalCards - discardedCards);
		const decksRemaining = (remainingCards / 52).toFixed(1);

		return {
			shield: '',
			header: buildHeader(),
			body: [
			alignRow('Running count', fwDigits(sign(runningCount)), BODY_INNER_WIDTH),
			alignRow('True count', fwDigits(sign(trueCount)), BODY_INNER_WIDTH),
			'',
			alignRow('Suggested unit', fwDigits(String(suggestedUnits(trueCount))), BODY_INNER_WIDTH),
			'',
			alignRow('Decks remaining', fwDigits(decksRemaining), BODY_INNER_WIDTH),
			alignRow('Cards dealt', fwDigits(String(discardedCards)), BODY_INNER_WIDTH),
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
			// Neutral card: count unchanged, but card is accounted for
			appStore.incrementDiscarded(1);
		}
	}
}
