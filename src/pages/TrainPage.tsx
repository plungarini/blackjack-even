import { useState, useCallback } from 'react';
import { Button, Card } from 'even-toolkit/web';
import { useAppSelector } from '../app/hooks/useAppSelector';
import { useTrainActions } from '../app/hooks/useTrainActions';
import { pickTrainingHand, ALL_ENTRIES, ALL_VS } from '../domain/training';
import { lookupStrategy, resolveAction } from '../domain/strategy';
import type { TrainHand } from '../domain/training';
import type { PlayerAction } from '../domain/strategy';
import { displayRank, displaySuit } from '../domain/deck';

interface FeedbackState {
  chosen: PlayerAction;
  correct: boolean;
  correctAction: PlayerAction;
}

const ACTION_LABELS: { action: PlayerAction; label: string }[] = [
  { action: 'hit', label: 'Hit' },
  { action: 'stand', label: 'Stand' },
  { action: 'double', label: 'Double' },
  { action: 'split', label: 'Split' },
  { action: 'surrender', label: 'Surrender' },
];

function CardDisplay({ rank, suit }: { rank: string; suit: string }) {
  return (
    <div className="w-14 h-20 rounded-xl border-2 border-border bg-white dark:bg-surface flex items-center justify-center shadow-sm">
      <span className="text-2xl font-bold text-gray-800 dark:text-gray-100 leading-none">
        {rank}
        <span className="text-base">{suit}</span>
      </span>
    </div>
  );
}

export function TrainPage() {
  const trainStats = useAppSelector((s) => s.trainStats);
  const strategyOverrides = useAppSelector((s) => s.strategyOverrides);
  const settings = useAppSelector((s) => s.settings);
  const totalCorrect = useAppSelector((s) => s.trainTotalCorrect);
  const totalIncorrect = useAppSelector((s) => s.trainTotalIncorrect);
  const streak = useAppSelector((s) => s.trainStreakCorrect);
  const { checkAnswer } = useTrainActions();

  const [hand, setHand] = useState<TrainHand | null>(() =>
    pickTrainingHand(trainStats, settings.trainingThreshold / 100, ALL_ENTRIES, ALL_VS),
  );
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const nextHand = useCallback(() => {
    setFeedback(null);
    setHand(pickTrainingHand(trainStats, settings.trainingThreshold / 100, ALL_ENTRIES, ALL_VS));
  }, [trainStats, settings.trainingThreshold]);

  const handleAnswer = (action: PlayerAction) => {
    if (!hand || feedback) return;
    const correct = checkAnswer(hand.playerCards, hand.dealerUpcard, action);
    const cell = lookupStrategy(hand.entry, hand.vs, strategyOverrides);
    const correctAction = resolveAction(
      cell,
      true,
      true,
      settings.allowSurrender,
    );
    setFeedback({ chosen: action, correct, correctAction });
  };

  const total = totalCorrect + totalIncorrect;
  const pct = total === 0 ? 0 : Math.round((totalCorrect / total) * 100);

  if (!hand) {
    return (
      <div className="px-3 pt-4 pb-32 flex flex-col items-center justify-center min-h-64 text-center gap-3">
        <p className="text-2xl">🎉</p>
        <p className="font-semibold">All scenarios mastered!</p>
        <p className="text-text-dim text-sm">Lower the threshold in Settings to keep practicing.</p>
      </div>
    );
  }

  return (
    <div className="px-3 pt-4 pb-32 space-y-4">
      <div className="flex justify-between text-xs text-text-dim px-1">
        <span>{total} hands · {pct}% accuracy</span>
        <span>Streak: {streak}</span>
      </div>

      <Card className="space-y-4 py-5">
        <div>
          <p className="text-xs text-text-dim text-center mb-2 uppercase tracking-wide">Dealer shows</p>
          <div className="flex justify-center">
            <CardDisplay
              rank={displayRank(hand.dealerUpcard.rank)}
              suit={displaySuit(hand.dealerUpcard.suit)}
            />
          </div>
        </div>

        <div>
          <p className="text-xs text-text-dim text-center mb-2 uppercase tracking-wide">Your hand</p>
          <div className="flex justify-center gap-2">
            {hand.playerCards.map((card, i) => (
              <CardDisplay
                key={i}
                rank={displayRank(card.rank)}
                suit={displaySuit(card.suit)}
              />
            ))}
          </div>
          <p className="text-center text-xs text-text-dim mt-2">{hand.entry} vs {hand.vs}</p>
        </div>
      </Card>

      {feedback ? (
        <Card className={`py-4 text-center border-2 ${feedback.correct ? 'border-green-500/40 bg-green-500/5' : 'border-red-500/40 bg-red-500/5'}`}>
          <p className={`text-lg font-bold mb-1 ${feedback.correct ? 'text-green-500' : 'text-red-500'}`}>
            {feedback.correct ? '✓ Correct!' : '✗ Wrong'}
          </p>
          {!feedback.correct && (
            <p className="text-sm text-text-dim">
              Correct play: <span className="font-semibold text-foreground capitalize">{feedback.correctAction}</span>
            </p>
          )}
          <Button className="mt-3 w-full" onClick={nextHand}>
            Next hand
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {ACTION_LABELS.map(({ action, label }) => (
            <Button
              key={action}
              variant="secondary"
              className="py-4 text-base"
              onClick={() => handleAnswer(action)}
            >
              {label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
