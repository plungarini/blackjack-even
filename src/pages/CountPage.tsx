import { useAppSelector } from '../app/hooks/useAppSelector';
import { useCountActions } from '../app/hooks/useCountActions';
import { computeTrueCount, suggestedUnits } from '../domain/count';
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
  if (n > 0) return 'text-green-400';
  if (n < 0) return 'text-red-400';
  return 'text-zinc-400';
}

function toFw(str: string): string {
  return str.replace(/[\x20-\x7E]/g, (ch) =>
    ch === ' ' ? '\u3000' : String.fromCharCode(ch.charCodeAt(0) + 0xFEE0)
  );
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
    <div className="p-3 sm:p-4 pb-32 max-h-[100dvh] overflow-y-auto">
      {/* Count Display */}
      <div className="bg-slate-800 rounded-md p-6 text-center mb-4">
        {hideCount ? (
          <p className="text-zinc-400 text-sm font-['Poppins']">Count hidden</p>
        ) : (
          <>
            <p className="text-xs text-zinc-400 mb-1 uppercase tracking-wide font-['Poppins']">
              Running count
            </p>
            <p className={`text-6xl font-bold tabular-nums font-['Poppins'] ${countColor(runningCount)}`}>
              {toFw(runningCount > 0 ? `+${runningCount}` : String(runningCount))}
            </p>
            <div className="mt-3 flex justify-center gap-6">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wide">True count</p>
                <p className={`text-xl font-semibold tabular-nums ${countColor(trueCount)}`}>
                  {toFw(trueCount > 0 ? `+${trueCount}` : String(trueCount))}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Decks left</p>
                <p className="text-xl font-semibold tabular-nums text-zinc-300">{toFw(decksLeft)}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Cards seen</p>
                <p className="text-xl font-semibold tabular-nums text-zinc-300">{toFw(String(discardedCards))}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Suggested unit</p>
                <p className="text-xl font-semibold tabular-nums text-emerald-400">{toFw(String(suggestedUnits(trueCount)))}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Card Buttons */}
      <div className="space-y-3">
        {CARD_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-[11px] text-zinc-500 uppercase tracking-wide mb-2 px-1 font-['Poppins']">
              {group.label}
            </p>
            <div className="flex gap-2">
              {group.ranks.map(({ display, rank }) => (
                <button
                  key={display}
                  type="button"
                  onClick={() => logCard({ suit: 'S', rank })}
                  className={`flex-1 py-3 rounded-xl font-bold text-lg border transition-colors active:scale-95 ${
                    group.delta > 0
                      ? 'border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20'
                      : group.delta < 0
                        ? 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                        : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {display}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Reset */}
      <button
        type="button"
        onClick={resetCount}
        className="w-full mt-4 py-3 text-sm font-semibold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors border border-zinc-600 hover:border-zinc-500 active:scale-95"
      >
        Reset count
      </button>
    </div>
  );
}
