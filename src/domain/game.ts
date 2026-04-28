import type { Card } from './deck';
import type { PlayerAction } from './strategy';

export type GamePhase = 'idle' | 'player-turn' | 'dealer-turn' | 'result';
export type HandOutcome = 'won' | 'lost' | 'push';

export interface GameFeedback {
  isCorrect: boolean;
  entry: string;
  vs: string;
  actions: PlayerAction[];
  action: PlayerAction;
}

export interface PlayerHandState {
  cards: Card[];
  outcome?: HandOutcome;
  doubled?: boolean;
}

export interface GameState {
  phase: GamePhase;
  shoe: Card[];
  deckCount: number;
  dealerHand: Card[];
  playerHands: PlayerHandState[];
  activeHandIndex: number;
  runningCount: number;
  discardedCount: number;
  feedback: GameFeedback | null;
  resultMessage: string;
}
