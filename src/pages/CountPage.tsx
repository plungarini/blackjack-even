import { Button, Card } from 'even-toolkit/web';
import { useAppSelector } from '../app/hooks/useAppSelector';
import { useCountActions } from '../app/hooks/useCountActions';
import { computeTrueCount } from '../domain/count';
import type { Rank } from '../domain/deck';

interface CardGroup {
  label: string;
  delta: number;
  ranks: { display: string; rank: Rank }[];
}

const CARD_GROUPS: CardGroup[] = [
  {
    label: '+1  (low)',
    delta: 1,
    ranks: [
      { display: '2', rank: 2 },
      { display: '3', rank: 3 },
      { display: '4', rank: 4 },
      { display: '5', rank: 5 },
      { display: '6', rank: 6 },
    ],
  },
  {
    label: '0  (neutral)',
    delta: 0,
    ranks: [
      { display: '7', rank: 7 },
      { display: '8', rank: 8 },
      { display: '9', rank: 9 },
    ],
  },
  {
    label: '−1  (high)',
    delta: -1,
    ranks: [
      { display: 'T', rank: 'T' },
      { display: 'J', rank: 'J' },
      { display: 'Q', rank: 'Q' },
      { display: 'K', rank: 'K' },
      { display: 'A', rank: 'A' },
    ],
  },
];

function countColor(n: number): string {
  if (n > 0) return 'text-green-500';
  if (n < 0) return 'text-red-500';
  return 'text-text-dim';
}

export function CountPage() {
  const runningCount = useAppSelector((s) => s.runningCount);
  const discardedCards = useAppSelector((s) => s.discardedCards);
  const deckCount = useAppSelector((s) => s.settings.deckCount);
  const hideCount = useAppSelector((s) => s.settings.hideCount);
  const { logCard, resetCount } = useCountActions();

  const trueCount = computeTrueCount(runningCount, discardedCards, deckCount);
  const totalCards = deckCount * 52;
  const remaining = totalCards - discardedCards;
  const decksLeft = (remaining / 52).toFixed(1);

  return (
    <div className="px-3 pt-4 pb-32 space-y-4">
      <Card className="text-center py-6">
        {hideCount ? (
          <p className="text-text-dim text-sm">Count hidden</p>
        ) : (
          <>
            <p className="text-xs text-text-dim mb-1 uppercase tracking-wide">Running count</p>
            <p className={`text-6xl font-bold tabular-nums ${countColor(runningCount)}`}>
              {runningCount > 0 ? `+${runningCount}` : runningCount}
            </p>
            <p className="text-xs text-text-dim mt-3">
              True count:{' '}
              <span className={`font-semibold ${countColor(trueCount)}`}>
                {trueCount > 0 ? `+${trueCount}` : trueCount}
              </span>
            </p>
          </>
        )}
        <p className="text-xs text-text-dim mt-2">
          {decksLeft} decks left · {discardedCards} cards seen
        </p>
      </Card>

      <div className="space-y-3">
        {CARD_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-[11px] text-text-dim uppercase tracking-wide mb-1 px-1">
              {group.label}
            </p>
            <div className="flex gap-2">
              {group.ranks.map(({ display, rank }) => (
                <button
                  key={display}
                  onClick={() => logCard({ suit: 'S', rank })}
                  className={`flex-1 py-3 rounded-xl font-bold text-lg border transition-colors
                    ${group.delta > 0
                      ? 'border-green-400/40 bg-green-500/10 text-green-400 active:bg-green-500/20'
                      : group.delta < 0
                      ? 'border-red-400/40 bg-red-500/10 text-red-400 active:bg-red-500/20'
                      : 'border-border bg-surface text-text-dim active:bg-border'
                    }`}
                >
                  {display}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Button variant="ghost" className="w-full" onClick={resetCount}>
        Reset count
      </Button>
    </div>
  );
}
