import type { PlayerAction } from '../domain/strategy';

interface StrategyFeedbackBannerProps {
  feedback: {
    isCorrect: boolean;
    entry: string;
    vs: string;
    actions: PlayerAction[];
    action: PlayerAction;
  } | null;
}

export function StrategyFeedbackBanner({ feedback }: StrategyFeedbackBannerProps) {
  if (!feedback) return null;

  const actionLabel = (a: PlayerAction) => {
    switch (a) {
      case 'hit': return 'Hit';
      case 'stand': return 'Stand';
      case 'double': return 'Double';
      case 'split': return 'Split';
      case 'surrender': return 'Surrender';
    }
  };

  return (
    <div className="pt-2">
      {feedback.isCorrect ? (
        <div className="p-3 sm:p-4 bg-teal-900/30 rounded">
          <p className="text-sm inline-flex flex-col sm:flex-row gap-1">
            <span className="font-medium text-teal-300">Correct!</span>
            <span className="text-teal-300 italic opacity-80">
              When the player has "{feedback.entry}" against Dealer "{feedback.vs}" you should{' '}
              {feedback.actions.length > 1
                ? feedback.actions.map((a, i) => (
                    <span key={a}>
                      "<u>{actionLabel(a)}</u>"
                      {i < feedback.actions.length - 1 ? ' or ' : ''}
                    </span>
                  ))
                : `"<u>${actionLabel(feedback.actions[0])}</u>"`}
              .
            </span>
          </p>
        </div>
      ) : (
        <div className="p-3 sm:p-4 bg-red-900/30 rounded">
          <p className="text-sm inline-flex flex-col sm:flex-row gap-1">
            <span className="font-medium text-red-300">Wrong!</span>
            <span className="text-red-300 italic opacity-80">
              When the player has "{feedback.entry}" against Dealer "{feedback.vs}" you should{' '}
              {feedback.actions.length > 1
                ? feedback.actions.map((a, i) => (
                    <span key={a}>
                      "<u>{actionLabel(a)}</u>"
                      {i < feedback.actions.length - 1 ? ' or ' : ''}
                    </span>
                  ))
                : `"<u>${actionLabel(feedback.actions[0])}</u>"`}
              .
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
