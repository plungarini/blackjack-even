import { useEffect } from 'react';
import { useAppSelector } from '../app/hooks/useAppSelector';
import { useBlackjackGame } from '../app/hooks/useBlackjackGame';
import { DealerArea } from '../components/DealerArea';
import { GameControls } from '../components/GameControls';
import { PlayerHand } from '../components/PlayerHand';
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
		newGame,
		hit,
		stand,
		double,
		split,
		canDoubleCurrent,
		canSplitCurrent,
		gameOver,
	} = useBlackjackGame(settings.deckCount, settings.trainingMode, settings.trainingThreshold);

	// Auto-deal on first mount if no game
	useEffect(() => {
		if (!game || game.phase === 'idle') {
			newGame();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	if (!game) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-center">
					<div className="text-5xl mb-4">♠</div>
					<p className="text-text-dim text-sm font-['Poppins']">Dealing…</p>
				</div>
			</div>
		);
	}

	const dealerScore = handValue(game.dealerHand);
	const discardedHalfDecks = Math.floor(game.discardedCount / 26);

	return (
    <div className="p-3 sm:p-4 pb-32">
			{/* Feedback banner above the play table */}
			<StrategyFeedbackBanner feedback={game.feedback} />

			<div className="relative flex flex-col p-3 sm:p-4 rounded-md gap-y-6 sm:gap-y-8 bg-slate-800">
				<DealerArea hand={game.dealerHand} score={dealerScore} discardedHalfDecks={discardedHalfDecks} />

				<div className="flex flex-row justify-center gap-x-4 sm:gap-x-6">
					{game.playerHands.map((hand, i) => (
						<PlayerHand
							key={i}
							hand={hand}
							score={handValue(hand.cards)}
							isCurrent={i === game.activeHandIndex && !gameOver}
							gameOver={gameOver}
							showScore={showScore}
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
		</div>
	);
}
