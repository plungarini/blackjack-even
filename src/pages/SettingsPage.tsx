import { useState, useEffect } from 'react';
import { useAppSelector } from '../app/hooks/useAppSelector';
import { appStore } from '../app/store';
import { persistSettings, persistTrainStats } from '../app/bootstrap';
import type { UserSettings, ThemeMode } from '../domain/settings';

function update(partial: Partial<UserSettings>): void {
  appStore.updateSettings(partial);
  void persistSettings();
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative flex flex-shrink-0 h-6 transition-colors duration-200 ease-in-out border-2 border-transparent rounded-full cursor-pointer w-11 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ring-offset-zinc-950 ${
        checked ? 'bg-indigo-600' : 'bg-zinc-800'
      }`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`relative inline-block w-5 h-5 transition duration-200 ease-in-out transform translate-x-0 bg-zinc-600 rounded-full shadow pointer-events-none ring-0 ${
          checked ? 'translate-x-5 bg-zinc-300' : 'translate-x-0 bg-zinc-600'
        }`}
      />
    </button>
  );
}

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-4 border-b border-zinc-800 last:border-0">
      <div className="flex-1">
        <h3 className="text-sm font-medium text-zinc-100">{title}</h3>
        <p className="text-xs text-zinc-400 max-w-prose mt-0.5">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function SettingsPage() {
  const settings = useAppSelector((s) => s.settings);
  const [confirmReset, setConfirmReset] = useState(false);

  // Theme effect: toggle dark class on html
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // system
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [settings.theme]);

  // Ensure dark class is present on mount
  useEffect(() => {
    if (!document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleResetStats = () => {
    appStore.resetTrainStats();
    void persistTrainStats();
    setConfirmReset(false);
  };

  return (
    <div className="p-3 sm:p-4 pb-32">
      <h2 className="pb-2 border-b border-zinc-800 text-lg font-semibold text-zinc-100">
        Settings & Preferences
      </h2>

      <div className="flex flex-col gap-0 mt-6">
        <SettingRow
          title="Hide Count"
          description="Toggle On if you want to hide the running and true count by default."
        >
          <Toggle checked={settings.hideCount} onChange={(v) => update({ hideCount: v })} />
        </SettingRow>

        <SettingRow
          title="Training Mode"
          description="When enabled, search for hands combo that you need to improve strategy, instead of giving you or the dealer random cards."
        >
          <Toggle checked={settings.trainingMode} onChange={(v) => update({ trainingMode: v })} />
        </SettingRow>

        <SettingRow
          title="Training Threshold"
          description="Sets the highest threshold for identifying challenging hands in training mode. If set to 60, it includes hands combo with 60% or fewer correct responses."
        >
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="number"
              min={10}
              max={90}
              value={settings.trainingThreshold}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val)) update({ trainingThreshold: val });
              }}
              className="w-12 text-center border rounded bg-zinc-900 border-zinc-700 text-zinc-100 py-1 text-sm"
            />
            <p className="text-xs text-zinc-400">%</p>
          </div>
        </SettingRow>

        <SettingRow
          title="Hide Cards Score"
          description="Toggle On if you want to hide the cards score by default."
        >
          <Toggle checked={settings.hideScore} onChange={(v) => update({ hideScore: v })} />
        </SettingRow>

        <SettingRow
          title="Toggle Theme"
          description="Use this button to toggle theme from dark to light and vice versa."
        >
          <button
            type="button"
            onClick={() => {
              const next: ThemeMode =
                settings.theme === 'system' ? 'dark' : settings.theme === 'dark' ? 'light' : 'system';
              update({ theme: next });
            }}
            className="flex p-2 rounded-md w-fit text-zinc-400 hover:text-white hover:bg-gray-800"
          >
            <svg
              className="size-6 transition-colors shrink-0 !duration-0"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12,3c5,0,9,4,9,9c0,5-4,9-9,9c-5,0-9-4-9-9C3,7,7,3,12,3z"
              />
              <path
                fill="currentColor"
                d="M20.5,12c0-4.7-3.8-8.5-8.5-8.5v17C16.7,20.5,20.5,16.7,20.5,12z"
              />
            </svg>
            <span className="sr-only">Dark Mode</span>
          </button>
        </SettingRow>
      </div>

      {/* Advanced section */}
      <h3 className="pb-2 border-b border-zinc-800 text-base font-semibold text-zinc-100 mt-8">
        Advanced
      </h3>
      <div className="flex flex-col gap-0 mt-4">
        <SettingRow
          title="Deck count"
          description="Number of decks in the shoe (1–8)"
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="w-8 h-8 rounded-lg border border-zinc-700 flex items-center justify-center text-lg font-bold text-zinc-400 active:bg-zinc-800 disabled:opacity-40"
              onClick={() => update({ deckCount: settings.deckCount - 1 })}
              disabled={settings.deckCount <= 1}
            >
              −
            </button>
            <span className="w-6 text-center font-semibold tabular-nums text-sm text-zinc-100">
              {settings.deckCount}
            </span>
            <button
              type="button"
              className="w-8 h-8 rounded-lg border border-zinc-700 flex items-center justify-center text-lg font-bold text-zinc-400 active:bg-zinc-800 disabled:opacity-40"
              onClick={() => update({ deckCount: settings.deckCount + 1 })}
              disabled={settings.deckCount >= 8}
            >
              +
            </button>
          </div>
        </SettingRow>

        <SettingRow
          title="Dealer hits on soft 17"
          description="H17 rule (affects optimal play)"
        >
          <Toggle checked={settings.dealerHitsOnSoft17} onChange={(v) => update({ dealerHitsOnSoft17: v })} />
        </SettingRow>

        <SettingRow
          title="Double after split"
          description="Allow doubling after a pair split"
        >
          <Toggle checked={settings.allowDoubleAfterSplit} onChange={(v) => update({ allowDoubleAfterSplit: v })} />
        </SettingRow>

      </div>

      {/* Reset stats */}
      <div className="mt-8">
        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          className="px-4 py-2 text-sm font-medium border rounded bg-zinc-800 border-zinc-700 text-red-400 hover:bg-red-900/20"
        >
          Reset training stats
        </button>
      </div>

      {/* Confirm dialog */}
      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-zinc-900 rounded-xl p-6 max-w-sm w-full shadow-xl border border-zinc-700">
            <h3 className="text-lg font-semibold mb-2 text-zinc-100">Reset training stats?</h3>
            <p className="text-sm text-zinc-400 mb-6">
              All correct/incorrect counts and accuracy data will be permanently deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-4 py-2 text-sm font-medium rounded bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetStats}
                className="px-4 py-2 text-sm font-medium rounded bg-red-600 text-white hover:bg-red-700"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
