import { Button, Card, StatGrid } from 'even-toolkit/web';
import { useAppSelector } from '../app/hooks/useAppSelector';
import { accuracy } from '../domain/stats';
import type { FeedbackStat } from '../domain/stats';
import { appStore } from '../app/store';
import { persistTrainStats } from '../app/bootstrap';

interface WorstCombo {
  key: string;
  entry: string;
  vs: string;
  stat: FeedbackStat;
  acc: number;
}

export function StatsPage() {
  const trainStats = useAppSelector((s) => s.trainStats);
  const totalCorrect = useAppSelector((s) => s.trainTotalCorrect);
  const totalIncorrect = useAppSelector((s) => s.trainTotalIncorrect);
  const streak = useAppSelector((s) => s.trainStreakCorrect);

  const total = totalCorrect + totalIncorrect;
  const pct = total === 0 ? 0 : Math.round((totalCorrect / total) * 100);

  const worstCombos: WorstCombo[] = Object.entries(trainStats)
    .map(([key, stat]) => {
      const [entry, vs] = key.split('_') as [string, string];
      return { key, entry, vs, stat, acc: accuracy(stat) };
    })
    .filter(({ stat }) => stat.correct + stat.incorrect >= 3)
    .sort((a, b) => a.acc - b.acc)
    .slice(0, 10);

  const handleReset = () => {
    appStore.resetTrainStats();
    void persistTrainStats();
  };

  return (
    <div className="px-3 pt-4 pb-32 space-y-4">
      <StatGrid
        columns={3}
        stats={[
          { label: 'Hands', value: total },
          { label: 'Accuracy', value: `${pct}%` },
          { label: 'Streak', value: streak },
        ]}
      />

      <div className="flex gap-3">
        <Card className="flex-1 text-center py-3">
          <p className="text-2xl font-bold text-green-500">{totalCorrect}</p>
          <p className="text-xs text-text-dim mt-0.5">Correct</p>
        </Card>
        <Card className="flex-1 text-center py-3">
          <p className="text-2xl font-bold text-red-500">{totalIncorrect}</p>
          <p className="text-xs text-text-dim mt-0.5">Incorrect</p>
        </Card>
      </div>

      {worstCombos.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-text-dim uppercase tracking-wide mb-2 px-1">
            Weakest spots
          </p>
          <Card className="divide-y divide-border">
            {worstCombos.map(({ key, entry, vs, stat, acc }) => (
              <div key={key} className="flex items-center justify-between px-3 py-2.5">
                <div>
                  <span className="font-medium text-sm">{entry}</span>
                  <span className="text-text-dim text-sm"> vs {vs}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-red-500">
                    {Math.round(acc * 100)}%
                  </span>
                  <span className="text-text-dim text-xs ml-1">
                    ({stat.correct}/{stat.correct + stat.incorrect})
                  </span>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {total === 0 && (
        <Card className="text-center py-8">
          <p className="text-text-dim text-sm">No training sessions yet.</p>
          <p className="text-text-dim text-xs mt-1">Go to Train to start practicing.</p>
        </Card>
      )}

      <Button variant="danger" className="w-full" onClick={handleReset}>
        Reset training stats
      </Button>
    </div>
  );
}
