import { useCallback } from 'react';
import { useAppSelector } from '../app/hooks/useAppSelector';
import { appStore } from '../app/store';
import { persistStrategyOverrides } from '../app/bootstrap';
import { DEFAULT_STRATEGY, type StrategyEntry, type StrategyVs, type StrategyCellValue } from '../domain/strategy';
import { StrategyCell } from '../components/StrategyCell';

const ALL_VS: StrategyVs[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];

const SECTIONS: { label: string; entries: StrategyEntry[] }[] = [
  { label: 'Hard totals', entries: ['8', '9', '10', '11', '12', '13', '14', '15', '16', '17'] },
  { label: 'Soft hands', entries: ['A,2', 'A,3', 'A,4', 'A,5', 'A,6', 'A,7', 'A,8'] },
  { label: 'Pairs', entries: ['2,2', '3,3', '4,4', '5,5', '6,6', '7,7', '8,8', '9,9', '10,10', 'A,A'] },
];

const LEGEND: { code: StrategyCellValue; label: string; color: string }[] = [
  { code: 'H', label: 'Hit', color: 'bg-blue-600' },
  { code: 'S', label: 'Stand', color: 'bg-red-600' },
  { code: 'P', label: 'Split', color: 'bg-yellow-500' },
  { code: 'P/H', label: 'Split, or Hit', color: 'bg-amber-600' },
  { code: 'D/H', label: 'Double Down, or Hit', color: 'bg-green-500' },
  { code: 'D/S', label: 'Double Down, or Stand', color: 'bg-green-700' },
  { code: 'R/H', label: 'Surrender, or Hit', color: 'bg-purple-600' },
];

function canSplitEntry(entry: StrategyEntry): boolean {
  return entry.includes(',') && entry.split(',')[0] === entry.split(',')[1];
}

export function StrategyPage() {
  const strategyOverrides = useAppSelector((s) => s.strategyOverrides);
  const hasOverrides = Object.keys(strategyOverrides).length > 0;

  const getValue = useCallback(
    (entry: StrategyEntry, vs: StrategyVs): StrategyCellValue => {
      return strategyOverrides[entry]?.[vs] ?? DEFAULT_STRATEGY[entry][vs];
    },
    [strategyOverrides]
  );

  const handleChange = (entry: StrategyEntry, vs: StrategyVs, value: StrategyCellValue) => {
    const defaultValue = DEFAULT_STRATEGY[entry][vs];
    if (value === defaultValue) {
      // Remove override if it matches default
      const entryOverrides = { ...strategyOverrides[entry] };
      delete entryOverrides[vs];
      if (Object.keys(entryOverrides).length === 0) {
        const newOverrides = { ...strategyOverrides };
        delete newOverrides[entry];
        appStore.setStrategyOverrides(newOverrides);
      } else {
        appStore.setStrategyOverrides({
          ...strategyOverrides,
          [entry]: entryOverrides,
        });
      }
    } else {
      appStore.setStrategyOverride(entry, vs, value);
    }
    void persistStrategyOverrides();
  };

  const handleReset = () => {
    appStore.resetStrategyOverrides();
    void persistStrategyOverrides();
  };

  return (
    <div className="pb-32 max-h-[100dvh] overflow-y-auto">
      <div className="flex flex-col-reverse lg:flex-row gap-4 md:pb-4 pb-24 p-3 sm:p-4">
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

          {SECTIONS.map(({ label, entries }) => (
            <div key={label}>
              {entries.map((entry) => (
                <div
                  key={entry}
                  className="flex flex-row items-center leading-8 divide-x divide-zinc-700"
                >
                  <p className="flex-1 w-0 text-center sm:text-sm text-xs !leading-8 bg-zinc-900">
                    {entry}
                  </p>
                  {ALL_VS.map((vs) => (
                    <StrategyCell
                      key={vs}
                      value={getValue(entry, vs)}
                      canSplit={canSplitEntry(entry)}
                      onChange={(value) => handleChange(entry, vs, value)}
                    />
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Legend sidebar */}
        <div className="flex-1 md:block hidden">
          {hasOverrides && (
            <button
              type="button"
              onClick={handleReset}
              className="mb-2 px-4 py-2 text-sm font-medium border rounded bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700"
            >
              Reset to Default
            </button>
          )}
          <div className="flex flex-col gap-y-1 mb-4">
            {LEGEND.map(({ code, label, color }) => (
              <div key={code} className="flex flex-row items-center gap-x-2">
                <p className={`w-screen block max-w-14 leading-8 rounded text-center !text-white ${color}`}>
                  {code}
                </p>
                <p className="font-semibold text-sm text-zinc-200">- {label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile legend */}
      <div className="md:hidden px-3 pb-4">
        {hasOverrides && (
          <button
            type="button"
            onClick={handleReset}
            className="mb-2 px-4 py-2 text-sm font-medium border rounded w-full bg-zinc-800 border-zinc-700 text-zinc-200"
          >
            Reset to Default
          </button>
        )}
        <div className="flex flex-wrap gap-2">
          {LEGEND.map(({ code, label, color }) => (
            <span key={code} className="flex items-center gap-1 text-[10px] text-zinc-400">
              <span className={`inline-block w-6 h-5 rounded text-[9px] font-bold text-white leading-5 text-center ${color}`}>
                {code}
              </span>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
