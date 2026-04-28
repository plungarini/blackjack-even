import type { Card } from '../domain/deck';
import { CardImage } from './CardImage';

interface PlayerHandProps {
  hand: { cards: Card[]; outcome?: 'won' | 'lost' | 'push'; doubled?: boolean };
  score: number;
  isCurrent: boolean;
  gameOver: boolean;
  showScore: boolean;
  onToggleScore: () => void;
}

export function PlayerHand({ hand, score, isCurrent, gameOver, showScore, onToggleScore }: PlayerHandProps) {
  const show = showScore || gameOver;

  return (
    <div className={`relative flex flex-col items-center transition-opacity ${!isCurrent && !gameOver ? 'opacity-40' : ''}`}>
      {/* Outcome badge */}
      {hand.outcome && (
        <div className="absolute top-0 z-20 w-14 sm:w-16 -translate-x-1/2 pointer-events-none left-1/2">
          <img src="assets/deck/back.png" alt="Hidden" className="relative block w-14 sm:w-16 opacity-0" />
          <div className="absolute px-2 sm:px-3 py-1 -translate-x-1/2 -translate-y-1/2 border rounded bg-zinc-900 top-1/2 left-1/2 border-zinc-700 w-fit">
            <span
              className={
                hand.outcome === 'lost'
                  ? 'text-red-500'
                  : hand.outcome === 'push'
                    ? 'text-amber-500'
                    : 'text-teal-500'
              }
            >
              {hand.outcome === 'lost' && score > 21 ? 'Busted' : hand.outcome === 'won' ? 'Won' : hand.outcome === 'lost' ? 'Lost' : 'Push'}
            </span>
          </div>
        </div>
      )}

      {/* Cards */}
      <div className="flex flex-row -space-x-8 sm:-space-x-10">
        {hand.cards.map((card, i) => (
          <CardImage
            key={i}
            card={card}
            className={card.doubled ? 'rotate-90' : ''}
          />
        ))}
      </div>

      {/* Score pill */}
      <button
        type="button"
        onClick={onToggleScore}
        className="px-3 py-1 mt-2 overflow-hidden border rounded bg-zinc-900 border-zinc-700 text-zinc-400 w-fit"
      >
        <span
          className={`${
            hand.outcome === 'lost'
              ? 'text-red-500'
              : hand.outcome === 'push'
                ? 'text-amber-500'
                : hand.outcome === 'won'
                  ? 'text-teal-500'
                  : ''
          } ${!show ? 'blur-sm !text-zinc-400' : ''}`}
        >
          {show ? score : 0}
        </span>
      </button>
    </div>
  );
}
