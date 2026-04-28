import { useEffect } from 'react';
import { useAppSelector } from '../app/hooks/useAppSelector';
import { useBlackjackGame } from '../app/hooks/useBlackjackGame';
import { DealerArea } from '../components/DealerArea';
import { PlayerHand } from '../components/PlayerHand';
import { GameControls } from '../components/GameControls';
import { StrategyFeedbackBanner } from '../components/StrategyFeedbackBanner';
import { handValue } from '../domain/hand';

export function TrainPage() {
  const settings = useAppSelector((s) => s.settings);

  const {
    game,
    trueCount,
    showCount,
    setShowCount,
    showScore,
    setShowScore,
    newGame,
    hit,
    stand,
    double,
    split,
    canDoubleCurrent,
    canSplitCurrent,
    gameOver,
  } = useBlackjackGame(settings.deckCount, settings.trainingMode, settings.trainingThreshold);

  // Auto-deal on first mount if no hands
  useEffect(() => {
    if (game.phase === 'idle') {
      newGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dealerScore = handValue(game.dealerHand);
  const discardedHalfDecks = Math.floor(game.discardedCount / 26);

  return (
    <div className="p-3 sm:p-4 pb-32 max-h-[100dvh] overflow-y-auto">
      <div className="relative flex flex-col p-3 sm:p-4 rounded-md gap-y-6 sm:gap-y-8 bg-slate-800">
        <DealerArea
          hand={game.dealerHand}
          score={dealerScore}
          discardedHalfDecks={discardedHalfDecks}
        />

        <div className="flex flex-row justify-center gap-x-4 sm:gap-x-6">
          {game.playerHands.map((hand, i) => (
            <PlayerHand
              key={i}
              hand={hand}
              score={handValue(hand.cards)}
              isCurrent={i === game.activeHandIndex && !gameOver}
              gameOver={gameOver}
              showScore={showScore}
              onToggleScore={() => setShowScore((s) => !s)}
            />
          ))}
        </div>

        <GameControls
          canDouble={canDoubleCurrent}
          canSplit={canSplitCurrent}
          gameOver={gameOver}
          showCount={showCount}
          runningCount={game.runningCount}
          trueCount={trueCount}
          trainingMode={settings.trainingMode}
          onToggleCount={() => setShowCount((s) => !s)}
          onHit={hit}
          onStand={stand}
          onDouble={double}
          onSplit={split}
          onNewGame={newGame}
        />
      </div>

      <StrategyFeedbackBanner feedback={game.feedback} />
    </div>
  );
}
