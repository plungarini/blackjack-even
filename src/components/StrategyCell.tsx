import { useState, useRef, useEffect } from 'react';
import type { StrategyCellValue } from '../domain/strategy';

const CELL_COLORS: Record<StrategyCellValue, string> = {
  H: 'bg-blue-600',
  S: 'bg-red-600',
  P: 'bg-yellow-500',
  'P/H': 'bg-amber-600',
  'D/H': 'bg-green-500',
  'D/S': 'bg-green-700',
  'R/H': 'bg-purple-600',
};

const ALL_ACTIONS: StrategyCellValue[] = ['H', 'S', 'D/H', 'D/S', 'P', 'P/H', 'R/H'];

interface StrategyCellProps {
  value: StrategyCellValue;
  canSplit: boolean;
  onChange: (value: StrategyCellValue) => void;
}

export function StrategyCell({ value, canSplit, onChange }: StrategyCellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const options = canSplit
    ? ALL_ACTIONS
    : ALL_ACTIONS.filter((a) => a !== 'P' && a !== 'P/H');

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [open]);

  return (
    <div ref={ref} className="relative flex-1 w-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full cursor-pointer opacity-85 hover:opacity-100"
      >
        <p className={`leading-8 text-center !text-white ${CELL_COLORS[value]}`}>
          {value}
        </p>
      </button>

      {open && (
        <div className="absolute left-0 z-30 flex flex-col w-full overflow-hidden border divide-y rounded divide-zinc-700 bg-zinc-900 border-zinc-700">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={`px-2 py-1 text-xs sm:text-sm ${
                value === opt
                  ? 'bg-zinc-600'
                  : 'bg-zinc-800 hover:bg-opacity-60'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
