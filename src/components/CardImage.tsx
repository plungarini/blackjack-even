import { cardFileName, type Card } from '../domain/deck';

interface CardImageProps {
  card: Card;
  className?: string;
}

export function CardImage({ card, className = '' }: CardImageProps) {
  return (
    <img
      src={`assets/deck/${cardFileName(card)}`}
      alt={card.hidden ? 'Hidden' : `${card.rank}${card.suit}`}
      className={`relative z-10 block w-14 sm:w-16 shadow-lg ${card.hidden ? '' : ''} ${className}`}
      draggable={false}
    />
  );
}
