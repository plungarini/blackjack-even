import type { Card } from '../domain/deck';
import { CardImage } from './CardImage';

interface DealerAreaProps {
  hand: Card[];
  score: number;
  discardedHalfDecks: number;
}

export function DealerArea({ hand, score, discardedHalfDecks }: DealerAreaProps) {
  return (
    <div className="flex flex-row px-2 sm:px-4 pt-4">
      {/* Used Cards */}
      <div className="flex-1">
        <div className="relative w-fit">
          <img
            src="assets/deck/deck_pile.png"
            className="w-14 sm:w-16 shadow-xl"
            alt="Discarded"
          />
          <div className="rounded bg-zinc-900 border-zinc-700 text-zinc-400 border w-fit py-1 px-2 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs sm:text-sm">
            {discardedHalfDecks}
          </div>
        </div>
      </div>

      {/* Dealer Cards */}
      <div className="flex-1 flex flex-row justify-center">
        <div className="relative flex flex-col items-center">
          <div className="flex flex-row -space-x-8 sm:-space-x-10">
            {hand.map((card, i) => (
              <CardImage key={i} card={card} />
            ))}
          </div>
          <div className="px-3 py-1 mt-2 overflow-hidden border rounded bg-zinc-900 border-zinc-700 text-zinc-400 w-fit">
            <span className={score > 21 ? 'text-red-500' : ''}>{score}</span>
          </div>
        </div>
      </div>

      {/* Main Deck */}
      <div className="flex-1">
        <img
          src="assets/deck/deck_pile.png"
          className="ml-auto w-14 sm:w-16 shadow-xl"
          alt="Deck"
        />
      </div>
    </div>
  );
}
