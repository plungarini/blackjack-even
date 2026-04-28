import type { EvenHubEvent } from '@evenrealities/even_hub_sdk';
import { OsEventTypeList } from '@evenrealities/even_hub_sdk';
import { appStore } from '../../../app/store';
import type { StrategyCellValue, StrategyEntry, StrategyVs } from '../../../domain/strategy';
import { lookupStrategy } from '../../../domain/strategy';
import { HUD_WIDTH } from '../../constants';
import { scheduleRender } from '../../render-loop';
import type { Router } from '../../router';
import type { HudLayoutDescriptor, View, ViewKey } from '../../types';
import { alignRow, toFullwidth } from '../../utils';
import { BODY_INNER_WIDTH, buildFooter } from '../shared-shell';

const COLS: StrategyVs[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];

const CELL_CHAR: Record<StrategyCellValue, string> = {
	H: 'Ｈ',
	S: 'Ｓ',
	P: 'Ｐ',
	'D/H': 'Ｄ',
	'D/S': 'Ｄ',
	'P/H': 'Ｐ',
	'R/H': 'Ｒ',
};

const HARD_ROWS: StrategyEntry[] = ['8', '9', '10', '11', '12', '13', '14', '15', '16', '17'];
const SOFT_ROWS: StrategyEntry[] = ['A,2', 'A,3', 'A,4', 'A,5', 'A,6', 'A,7', 'A,8'];
const PAIR_ROWS: StrategyEntry[] = ['2,2', '3,3', '4,4', '5,5', '6,6', '7,7', '8,8', '9,9', '10,10', 'A,A'];
const SECTIONS = [HARD_ROWS, SOFT_ROWS, PAIR_ROWS] as const;
const SECTION_NAMES = ['Hard', 'Soft', 'Pairs'] as const;

/** All labels normalized to exactly 2 fullwidth chars so every row has the same width. */
const LABEL_MAP: Record<string, string> = {
	'8': '８　',
	'9': '９　',
	'10': '１０',
	'11': '１１',
	'12': '１２',
	'13': '１３',
	'14': '１４',
	'15': '１５',
	'16': '１６',
	'17': '１７',
	'A,2': 'Ａ２',
	'A,3': 'Ａ３',
	'A,4': 'Ａ４',
	'A,5': 'Ａ５',
	'A,6': 'Ａ６',
	'A,7': 'Ａ７',
	'A,8': 'Ａ８',
	'2,2': '２２',
	'3,3': '３３',
	'4,4': '４４',
	'5,5': '５５',
	'6,6': '６６',
	'7,7': '７７',
	'8,8': '８８',
	'9,9': '９９',
	'10,10': 'ＴＴ',
	'A,A': 'ＡＡ',
};

const PIPE = ' \u2502 '; // space + Box Drawing Vertical Line + space
const MID_DOT = '\u00B7';

function buildDealerHeader(): string {
	return '\u3000\u3000' + PIPE + COLS.map((c) => toFullwidth(c === '10' ? 'T' : c)).join(PIPE);
}

function buildSectionBody(rows: readonly StrategyEntry[]): string {
	const state = appStore.getState();
	const lines = rows.map((entry) => {
		const label = LABEL_MAP[entry] ?? toFullwidth(entry);
		const cells = COLS.map((vs) => {
			const cell = lookupStrategy(entry, vs, state.strategyOverrides);
			return CELL_CHAR[cell] ?? '\u3000';
		});
		return label + PIPE + cells.join(PIPE);
	});
	// No trailing newline — phantom scrollbar per display docs
	return lines.join('\n');
}

function buildSectionHeader(sectionName: string): string {
	return alignRow('\u2660 Blackjack', `Strategy ${MID_DOT} ${sectionName}`, BODY_INNER_WIDTH);
}

function buildStrategyLayout(): HudLayoutDescriptor {
	return {
		key: 'strategy',
		textDescriptors: [
			{
				containerID: 0,
				containerName: 'header',
				xPosition: 12,
				yPosition: 0,
				width: HUD_WIDTH - 24,
				height: 36,
				paddingLength: 4,
			},
			{
				containerID: 1,
				containerName: 'dealer',
				xPosition: 0,
				yPosition: 36,
				width: HUD_WIDTH,
				height: 44,
				paddingLength: 4,
			},
			{
				containerID: 2,
				containerName: 'body',
				xPosition: 0,
				yPosition: 68,
				width: HUD_WIDTH,
				height: 184,
				paddingLength: 4,
				isEventCapture: 1,
			},
			{
				containerID: 3,
				containerName: 'footer',
				xPosition: 10,
				yPosition: 252,
				width: HUD_WIDTH - 20,
				height: 36,
				paddingLength: 2,
			},
		],
	};
}

export class StrategyView implements View {
	readonly key: ViewKey = 'strategy';
	private router: Router | null = null;
	private sectionIndex = 0;

	setRouter(router: Router): void {
		this.router = router;
	}

	enter(): void {
		this.sectionIndex = 0;
	}

	layout(): HudLayoutDescriptor {
		return buildStrategyLayout();
	}

	contents(): Record<string, string> {
		const section = SECTIONS[this.sectionIndex] ?? HARD_ROWS;
		const name = SECTION_NAMES[this.sectionIndex] ?? 'Hard';
		return {
			header: buildSectionHeader(name),
			dealer: buildDealerHeader(),
			body: buildSectionBody(section),
			footer: buildFooter('strategy'),
		};
	}

	handleEvent(event: EvenHubEvent): void {
		const type = event.textEvent?.eventType ?? event.sysEvent?.eventType ?? event.listEvent?.eventType;
		if (type === OsEventTypeList.DOUBLE_CLICK_EVENT) {
			this.router?.push('menu');
			return;
		}
		if (type === OsEventTypeList.SCROLL_BOTTOM_EVENT) {
			this.sectionIndex = (this.sectionIndex + 1) % SECTIONS.length;
			scheduleRender();
			return;
		}
		if (type === OsEventTypeList.SCROLL_TOP_EVENT) {
			this.sectionIndex = (this.sectionIndex - 1 + SECTIONS.length) % SECTIONS.length;
			scheduleRender();
			return;
		}
	}
}
