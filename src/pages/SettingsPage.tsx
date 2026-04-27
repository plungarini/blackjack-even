import { useState } from 'react';
import { Card, Toggle, Slider, ConfirmDialog, SettingsGroup } from 'even-toolkit/web';
import { useAppSelector } from '../app/hooks/useAppSelector';
import { appStore } from '../app/store';
import { persistSettings, persistTrainStats } from '../app/bootstrap';
import type { UserSettings } from '../domain/settings';

function update(partial: Partial<UserSettings>): void {
  appStore.updateSettings(partial);
  void persistSettings();
}

export function SettingsPage() {
  const settings = useAppSelector((s) => s.settings);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleResetStats = () => {
    appStore.resetTrainStats();
    void persistTrainStats();
    setConfirmReset(false);
  };

  return (
    <div className="px-3 pt-4 pb-32 space-y-4">
      <SettingsGroup label="Shoe">
        <Card className="divide-y divide-border">
          <div className="flex items-center justify-between px-3 py-3">
            <div>
              <p className="text-sm font-medium">Deck count</p>
              <p className="text-xs text-text-dim">Number of decks in the shoe (1–8)</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-lg font-bold text-text-dim active:bg-border"
                onClick={() => update({ deckCount: settings.deckCount - 1 })}
                disabled={settings.deckCount <= 1}
              >
                −
              </button>
              <span className="w-6 text-center font-semibold tabular-nums">{settings.deckCount}</span>
              <button
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-lg font-bold text-text-dim active:bg-border"
                onClick={() => update({ deckCount: settings.deckCount + 1 })}
                disabled={settings.deckCount >= 8}
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between px-3 py-3">
            <div>
              <p className="text-sm font-medium">Dealer hits on soft 17</p>
              <p className="text-xs text-text-dim">H17 rule (affects optimal play)</p>
            </div>
            <Toggle
              checked={settings.dealerHitsOnSoft17}
              onChange={(v) => update({ dealerHitsOnSoft17: v })}
            />
          </div>

          <div className="flex items-center justify-between px-3 py-3">
            <div>
              <p className="text-sm font-medium">Double after split</p>
              <p className="text-xs text-text-dim">Allow doubling after a pair split</p>
            </div>
            <Toggle
              checked={settings.allowDoubleAfterSplit}
              onChange={(v) => update({ allowDoubleAfterSplit: v })}
            />
          </div>

          <div className="flex items-center justify-between px-3 py-3">
            <div>
              <p className="text-sm font-medium">Allow surrender</p>
              <p className="text-xs text-text-dim">Late surrender available</p>
            </div>
            <Toggle
              checked={settings.allowSurrender}
              onChange={(v) => update({ allowSurrender: v })}
            />
          </div>
        </Card>
      </SettingsGroup>

      <SettingsGroup label="Display">
        <Card className="divide-y divide-border">
          <div className="flex items-center justify-between px-3 py-3">
            <div>
              <p className="text-sm font-medium">Hide count</p>
              <p className="text-xs text-text-dim">Mask running count on Count page</p>
            </div>
            <Toggle
              checked={settings.hideCount}
              onChange={(v) => update({ hideCount: v })}
            />
          </div>

          <div className="flex items-center justify-between px-3 py-3">
            <div>
              <p className="text-sm font-medium">Hide score</p>
              <p className="text-xs text-text-dim">Mask hand totals during play</p>
            </div>
            <Toggle
              checked={settings.hideScore}
              onChange={(v) => update({ hideScore: v })}
            />
          </div>
        </Card>
      </SettingsGroup>

      <SettingsGroup label="Training">
        <Card className="divide-y divide-border">
          <div className="flex items-center justify-between px-3 py-3">
            <div>
              <p className="text-sm font-medium">Training mode</p>
              <p className="text-xs text-text-dim">Show strategy hints during glass play</p>
            </div>
            <Toggle
              checked={settings.trainingMode}
              onChange={(v) => update({ trainingMode: v })}
            />
          </div>

          <div className="px-3 py-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Mastery threshold</p>
              <span className="text-sm font-semibold tabular-nums">{settings.trainingThreshold}%</span>
            </div>
            <p className="text-xs text-text-dim mb-3">
              Scenarios above this accuracy are skipped in training
            </p>
            <Slider
              value={settings.trainingThreshold}
              onChange={(v) => update({ trainingThreshold: v })}
              min={10}
              max={90}
              step={5}
            />
          </div>
        </Card>
      </SettingsGroup>

      <SettingsGroup label="Data">
        <Card>
          <button
            className="w-full text-left px-3 py-3 text-sm font-medium text-red-500 active:bg-red-500/10 rounded-xl"
            onClick={() => setConfirmReset(true)}
          >
            Reset training stats
          </button>
        </Card>
      </SettingsGroup>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={handleResetStats}
        title="Reset training stats?"
        description="All correct/incorrect counts and accuracy data will be permanently deleted."
        confirmLabel="Reset"
        variant="danger"
      />
    </div>
  );
}
