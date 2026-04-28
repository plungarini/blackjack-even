import { useState } from 'react';
import { useAppSelector } from '../app/hooks/useAppSelector';
import { appStore } from '../app/store';
import { persistTrainStats } from '../app/bootstrap';
import type { StrategyEntry, StrategyVs } from '../domain/strategy';

const ALL_ENTRIES: StrategyEntry[] = [
  '8', '9', '10', '11', '12', '13', '14', '15', '16', '17',
  'A,2', 'A,3', 'A,4', 'A,5', 'A,6', 'A,7', 'A,8',
  '2,2', '3,3', '4,4', '5,5', '6,6', '7,7', '8,8', '9,9', '10,10', 'A,A',
];

const ALL_VS: StrategyVs[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];

function getPerc(correct: number, incorrect: number): number {
  const total = correct + incorrect;
  if (total === 0) return -1;
  return Math.round((correct / total) * 100);
}

interface StatCellProps {
  correct: number;
  incorrect: number;
}

function StatCell({ correct, incorrect }: StatCellProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const perc = getPerc(correct, incorrect);

  const bgClass =
    perc < 0
      ? 'bg-zinc-950 text-zinc-400'
      : perc < 50
        ? 'bg-red-600 text-white'
        : perc < 90
          ? 'bg-amber-600 text-white'
          : 'bg-teal-600 text-white';

  return (
    <div className="relative flex-1 w-0 group">
      <button
        type="button"
        onClick={() => setShowTooltip((s) => !s)}
        className={`text-center relative h-full z-10 w-full text-[0.55rem] sm:text-xs !leading-8 ${bgClass}`}
      >
        {perc === -1 ? <span>-</span> : <span>{perc}%</span>}
      </button>

      {showTooltip && (
        <div className="absolute right-0 z-20 flex flex-col gap-2 p-2 border rounded shadow-2xl border-zinc-700 bg-zinc-900 top-8">
          <p className="text-xs whitespace-nowrap text-zinc-200">
            Correct: {correct}
          </p>
          <p className="text-xs whitespace-nowrap text-zinc-200">
            Incorrect: {incorrect}
          </p>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }}
            className="text-[10px] text-zinc-500 hover:text-zinc-300 text-right"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

export function StatsPage() {
  const trainStats = useAppSelector((s) => s.trainStats);

  const totalHands = Object.values(trainStats).reduce(
    (sum, stat) => sum + stat.correct + stat.incorrect,
    0
  );

  const handleReset = () => {
    if (!confirm('Are you sure? This will delete all data.')) return;
    appStore.resetTrainStats();
    void persistTrainStats();
  };

  return (
    <div className="max-h-full p-3 sm:p-4 pb-24 overflow-y-auto sm:pb-4">
      <div className="flex flex-col-reverse gap-4 lg:flex-row">
        <div className="flex flex-col w-full max-w-2xl overflow-hidden border divide-y rounded divide-zinc-700 border-zinc-700">
          {/* Header */}
          <div className="flex flex-row items-center leading-8 divide-x bg-zinc-900 divide-zinc-700 border-zinc-700">
            <p className="flex-1 w-0 text-center sm:text-sm text-xs !leading-8" />
            {ALL_VS.map((vs) => (
              <p key={vs} className="flex-1 w-0 text-center sm:text-sm text-xs !leading-8">
                {vs}
              </p>
            ))}
          </div>

          {/* Rows */}
          {ALL_ENTRIES.map((entry) => (
            <div
              key={entry}
              className="flex flex-row items-center leading-8 divide-x divide-zinc-700"
            >
              <p className="relative flex-1 w-0 text-center sm:text-sm text-xs !leading-8 bg-zinc-900">
                {entry}
              </p>
              {ALL_VS.map((vs) => {
                const id = `${entry}_${vs}`;
                const stat = trainStats[id] ?? { correct: 0, incorrect: 0 };
                return (
                  <StatCell
                    key={vs}
                    correct={stat.correct}
                    incorrect={stat.incorrect}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="flex flex-row items-center flex-1 gap-4 lg:flex-col lg:items-start">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium border rounded bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700"
          >
            Reset Stats
          </button>
          <p className="font-medium text-zinc-50">
            Total Hands:{' '}
            <span className="font-normal opacity-60">{totalHands}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
