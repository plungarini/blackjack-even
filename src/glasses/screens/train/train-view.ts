import type { EvenHubEvent } from '@evenrealities/even_hub_sdk';
import { OsEventTypeList } from '@evenrealities/even_hub_sdk';
import { appStore } from '../../../app/store';
import type { Card, Rank } from '../../../domain/deck';
import {
	dealAndSync,
	doubleAndSync,
	hitAndSync,
	skipAndSync,
	splitAndSync,
	standAndSync,
} from '../../../domain/game-controller';
import { canDouble, canSplit, handValue } from '../../../domain/hand';
import type { PlayerAction } from '../../../domain/strategy';
import { scheduleRender } from '../../render-loop';
import type { Router } from '../../router';
import type { HudLayoutDescriptor, View, ViewKey } from '../../types';
import { centerLine } from '../../utils';
import { BODY_INNER_WIDTH, buildFooter, buildHeader, ROOT_LAYOUT } from '../shared-shell';

function displayRank(rank: Rank): string {
	if (rank === 'A') return 'A';
	if (rank === 'T' || rank === 'J' || rank === 'Q' || rank === 'K') return 'T';
	return String(rank);
}

function formatHand(cards: Card[]): string {
	return cards
		.filter((c) => !c.hidden)
		.map((c) => displayRank(c.rank))
		.join(' + ');
}

function formatDealerHand(cards: Card[]): string {
	if (cards.length < 2) {
		return cards.map((c) => (c.hidden ? '?' : displayRank(c.rank))).join(' + ');
	}
	// Dealer hand is stored as [hole, up, hit1, hit2, ...]
	// Display as [up, hole, hit1, hit2, ...] so the visible card comes first
	const upCard = cards[1];
	const holeCard = cards[0];
	const hits = cards.slice(2);
	const ordered = [upCard, holeCard, ...hits];
	return ordered.map((c) => (c.hidden ? '?' : displayRank(c.rank))).join(' + ');
}

function actionLabel(action: PlayerAction): string {
	const map: Record<PlayerAction, string> = {
		hit: 'Hit',
		stand: 'Stand',
		double: 'Double',
		split: 'Split',
		surrender: 'Surrender',
	};
	return map[action];
}

function availableActions(handCards: Card[]): PlayerAction[] {
	const actions: PlayerAction[] = ['hit', 'stand'];
	if (canDouble(handCards)) actions.push('double');
	if (canSplit(handCards)) actions.push('split');
	return actions;
}

export class TrainView implements View {
	readonly key: ViewKey = 'train';
	private router: Router | null = null;
	private actionIndex = 0;

	setRouter(router: Router): void {
		this.router = router;
	}

	enter(): void {
		if (!appStore.getState().game) {
			const { settings } = appStore.getState();
			dealAndSync(settings.deckCount, settings.trainingMode, settings.trainingThreshold);
		}
		this.actionIndex = 0;
	}

	layout(): HudLayoutDescriptor {
		return ROOT_LAYOUT;
	}

	contents(): Record<string, string> {
		const game = appStore.getState().game;
		const settings = appStore.getState().settings;
		if (!game) {
			return {
				shield: '',
				header: buildHeader(),
				body: centerLine('Dealing...', BODY_INNER_WIDTH),
				footer: buildFooter('train'),
			};
		}

		const { dealerHand, playerHands, activeHandIndex, phase, feedback } = game;
		const activeHand = playerHands[activeHandIndex];

		// Build dealer text
		const dealerCards = formatDealerHand(dealerHand);
		const dealerTotal = handValue(dealerHand);
		const dealerText =
			dealerHand.length >= 2
				? settings.hideScore || dealerHand.filter((h) => !h.hidden).length <= 1
					? `${dealerCards}`
					: `${dealerCards} = ${dealerTotal}`
				: '--';

		// Build player text
		const playerCards = activeHand ? formatHand(activeHand.cards) : '--';
		const playerTotal = activeHand ? handValue(activeHand.cards) : 0;
		const playerText = activeHand ? (settings.hideScore ? `${playerCards}` : `${playerCards} = ${playerTotal}`) : '--';

		let body: string;

		if (phase === 'result') {
			// On result, show the feedback (correct/wrong) instead of won/lost
			let feedbackLine = '';
			if (feedback) {
				const correctActions = feedback.actions.map((a) => actionLabel(a)).join('/');
				feedbackLine = feedback.isCorrect
					? `Correct! ${feedback.entry} vs ${feedback.vs} -> ${correctActions}`
					: `Wrong! ${feedback.entry} vs ${feedback.vs} -> ${correctActions}`;
			}

			body = [
				centerLine(dealerText, BODY_INNER_WIDTH),
				'',
				centerLine(playerText, BODY_INNER_WIDTH),
				'',
				...(feedbackLine ? [centerLine(feedbackLine, BODY_INNER_WIDTH)] : []),
				'',
				centerLine('[Tap for new hand]', BODY_INNER_WIDTH),
			].join('\n');
		} else if (phase === 'player-turn' && activeHand) {
			const actions: (PlayerAction | 'skip')[] = [...availableActions(activeHand.cards), 'skip'];
			const selected = actions[this.actionIndex] ?? actions[0];

			let feedbackLine = '';
			if (feedback) {
				const correctActions = feedback.actions.map((a) => actionLabel(a)).join('/');
				feedbackLine = feedback.isCorrect
					? `Correct! ${feedback.entry} vs ${feedback.vs} -> ${correctActions}`
					: `Wrong! ${feedback.entry} vs ${feedback.vs} -> ${correctActions}`;
			}

			// Horizontal action bar with [ ] selector like footer tabs
			const actionBar = actions
				.map((a) => {
					const label = a === 'skip' ? 'Skip' : actionLabel(a);
					return a === selected ? `[${label}]` : ` ${label} `;
				})
				.join('  ');

			body = [
				centerLine(dealerText, BODY_INNER_WIDTH),
				'',
				centerLine(playerText, BODY_INNER_WIDTH),
				'',
				...(feedbackLine ? [centerLine(feedbackLine, BODY_INNER_WIDTH)] : []),
				centerLine(actionBar, BODY_INNER_WIDTH),
			].join('\n');
		} else {
			body = centerLine('Dealing...', BODY_INNER_WIDTH);
		}

		return {
			shield: '',
			header: buildHeader(),
			body,
			footer: buildFooter('train'),
		};
	}

	handleEvent(event: EvenHubEvent): void {
		const type = event.textEvent?.eventType ?? event.sysEvent?.eventType ?? event.listEvent?.eventType;

		if (type === OsEventTypeList.DOUBLE_CLICK_EVENT) {
			this.router?.push('menu');
			return;
		}

		const game = appStore.getState().game;
		if (!game) return;

		if (game.phase === 'result') {
			if (type === OsEventTypeList.CLICK_EVENT || type === undefined) {
				const { settings } = appStore.getState();
				dealAndSync(settings.deckCount, settings.trainingMode, settings.trainingThreshold);
			}
			return;
		}

		if (game.phase === 'player-turn') {
			const activeHand = game.playerHands[game.activeHandIndex];
			if (!activeHand) return;

			const actions: (PlayerAction | 'skip')[] = [...availableActions(activeHand.cards), 'skip'];

			if (type === OsEventTypeList.SCROLL_TOP_EVENT) {
				this.actionIndex = (this.actionIndex - 1 + actions.length) % actions.length;
				scheduleRender();
				return;
			}

			if (type === OsEventTypeList.SCROLL_BOTTOM_EVENT) {
				this.actionIndex = (this.actionIndex + 1) % actions.length;
				scheduleRender();
				return;
			}

			if (type === OsEventTypeList.CLICK_EVENT || type === undefined) {
				const action = actions[this.actionIndex];
				if (!action) return;

				switch (action) {
					case 'hit':
						hitAndSync();
						break;
					case 'stand':
						standAndSync();
						break;
					case 'double':
						doubleAndSync();
						break;
					case 'split':
						splitAndSync();
						break;
					case 'skip':
						skipAndSync();
						break;
				}

				this.actionIndex = 0;
			}
		}
	}
}
