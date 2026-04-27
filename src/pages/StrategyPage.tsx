import { useAppSelector } from '../app/hooks/useAppSelector';
import { lookupStrategy } from '../domain/strategy';
import type { StrategyEntry, StrategyVs, StrategyCellValue } from '../domain/strategy';

const ALL_VS: StrategyVs[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];

const SECTION_LABELS: { entries: StrategyEntry[]; label: string }[] = [
  { label: 'Hard totals', entries: ['8', '9', '10', '11', '12', '13', '14', '15', '16', '17'] },
  { label: 'Soft hands', entries: ['A,2', 'A,3', 'A,4', 'A,5', 'A,6', 'A,7', 'A,8'] },
  { label: 'Pairs', entries: ['2,2', '3,3', '4,4', '5,5', '6,6', '7,7', '8,8', '9,9', '10,10', 'A,A'] },
];

function cellStyle(value: StrategyCellValue): string {
  switch (value) {
    case 'H':   return 'bg-green-600 text-white';
    case 'S':   return 'bg-red-600 text-white';
    case 'D/H': return 'bg-blue-500 text-white';
    case 'D/S': return 'bg-purple-600 text-white';
    case 'P':   return 'bg-yellow-500 text-white';
    case 'P/H': return 'bg-orange-500 text-white';
    case 'R/H': return 'bg-gray-500 text-white';
  }
}

function cellLabel(value: StrategyCellValue): string {
  return value;
}

export function StrategyPage() {
  const strategyOverrides = useAppSelector((s) => s.strategyOverrides);

  return (
    <div className="pb-32">
      <div className="px-3 pt-4 pb-2">
        <p className="text-xs text-text-dim">Basic strategy chart · Hi-Lo · S17 · DAS · Surrender</p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[480px] px-3 space-y-6 pb-2">
          {SECTION_LABELS.map(({ label, entries }) => (
            <div key={label}>
              <p className="text-xs font-semibold text-text-dim uppercase tracking-wide mb-2">{label}</p>
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr>
                    <th className="w-12 text-left px-1 py-1 text-text-dim font-normal">Hand</th>
                    {ALL_VS.map((vs) => (
                      <th key={vs} className="text-center px-0.5 py-1 text-text-dim font-normal w-8">
                        {vs}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry}>
                      <td className="px-1 py-0.5 font-medium text-foreground">{entry}</td>
                      {ALL_VS.map((vs) => {
                        const value = lookupStrategy(entry, vs, strategyOverrides);
                        const isOverride = strategyOverrides[entry]?.[vs] !== undefined;
                        return (
                          <td key={vs} className="px-0.5 py-0.5 text-center">
                            <span
                              className={`inline-block w-7 h-6 rounded text-[10px] font-bold leading-6 ${cellStyle(value)} ${isOverride ? 'ring-2 ring-white/60' : ''}`}
                            >
                              {cellLabel(value)}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>

      <div className="px-3 pt-4">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['H', 'Hit', 'bg-green-600'],
              ['S', 'Stand', 'bg-red-600'],
              ['D/H', 'Double/Hit', 'bg-blue-500'],
              ['D/S', 'Double/Stand', 'bg-purple-600'],
              ['P', 'Split', 'bg-yellow-500'],
              ['P/H', 'Split/Hit', 'bg-orange-500'],
              ['R/H', 'Surrender/Hit', 'bg-gray-500'],
            ] as [string, string, string][]
          ).map(([code, desc, bg]) => (
            <span key={code} className="flex items-center gap-1 text-[10px] text-text-dim">
              <span className={`inline-block w-6 h-5 rounded text-[9px] font-bold text-white leading-5 text-center ${bg}`}>
                {code}
              </span>
              {desc}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
