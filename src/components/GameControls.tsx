interface GameControlsProps {
  canDouble: boolean;
  canSplit: boolean;
  gameOver: boolean;
  showCount: boolean;
  runningCount: number;
  trueCount: number;
  trainingMode: boolean;
  onToggleCount: () => void;
  onHit: () => void;
  onStand: () => void;
  onDouble: () => void;
  onSplit: () => void;
  onNewGame: () => void;
}

export function GameControls({
  canDouble,
  canSplit,
  gameOver,
  showCount,
  runningCount,
  trueCount,
  trainingMode,
  onToggleCount,
  onHit,
  onStand,
  onDouble,
  onSplit,
  onNewGame,
}: GameControlsProps) {
  const show = showCount;

  return (
    <div className="relative">
      <div className="grid grid-cols-6 gap-1 max-w-3xl mx-auto mb-2">
        {/* Desktop Deal button overlay */}
        <div className="relative hidden sm:block">
          <button
            type="button"
            onClick={onNewGame}
            className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 px-4 py-3 text-base font-medium text-white bg-blue-500 rounded sm:text-lg ${
              gameOver ? 'bg-blue-500 hover:bg-blue-600' : 'opacity-0 pointer-events-none'
            }`}
          >
            <svg className="size-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.1241 4.79505L19.2096 5.44691C20.9871 5.67457 21.9328 7.07169 21.7051 8.84728L20.4919 18.309C20.2642 20.0855 18.9975 21.1985 17.219 20.9709L12.1335 20.318C10.356 20.0904 9.41128 18.6942 9.63894 16.9177L10.8512 7.456C11.0789 5.68041 12.3515 4.56738 14.1241 4.79505Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M11.1064 20.0104L9.03503 20.2838C7.13296 20.528 5.78644 19.342 5.54126 17.4487L4.25116 7.34485C4.00599 5.46127 5.01394 3.96394 6.916 3.71973L12.3401 3.03187C13.8559 2.83437 15.0234 3.56893 15.5507 4.84054" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M13.5456 11.8921C13.4367 10.9736 13.9523 10.0474 14.9165 9.93165C15.4234 9.8723 15.9283 10.061 16.2718 10.4395C16.731 10.2196 17.268 10.2333 17.7156 10.4755C18.5669 10.9435 18.7012 11.9952 18.2565 12.8066C17.5589 14.0928 15.4302 14.7749 15.4302 14.7749C15.4302 14.7749 13.7227 13.3641 13.5456 11.8921Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Deal</span>
          </button>
        </div>

        {/* Desktop Split */}
        <button
          type="button"
          onClick={onSplit}
          disabled={gameOver || !canSplit}
          className="hidden px-4 py-3 text-base font-medium text-white bg-yellow-500 rounded disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-yellow-500 sm:text-lg hover:bg-yellow-600 lg:block"
        >
          Split
        </button>

        {/* Center block */}
        <div className="flex flex-col col-span-6 gap-1 sm:col-span-4 lg:col-span-2">
          {/* Count display */}
          <div className="sm:-mt-[4.35rem]">
            <div className="flex justify-between gap-1" style={{ opacity: show ? 1 : 0 }}>
              <p className="text-zinc-400 flex-1 text-center text-xs sm:text-sm">Running:</p>
              <p className="text-zinc-400 flex-1 text-center text-xs sm:text-sm">True:</p>
            </div>
            <div className="relative flex justify-between overflow-hidden border divide-x rounded divide-zinc-700 border-zinc-700">
              <div className={`flex items-center justify-center flex-1 p-2 ${!show ? 'blur-lg' : ''}`}>
                <p className="text-base sm:text-lg !text-white font-semibold">{show ? runningCount : 0}</p>
              </div>
              <div className={`flex items-center justify-center flex-1 p-2 ${!show ? 'blur-lg' : ''}`}>
                <p className="text-base sm:text-lg !text-white font-semibold">{show ? trueCount : 0}</p>
              </div>
              <button
                type="button"
                onClick={onToggleCount}
                className="absolute top-1/2 left-1/2 p-1 -translate-x-1/2 !border-0 -translate-y-1/2 bg-[#0b0f19] text-zinc-400 hover:text-white cursor-pointer"
              >
                {show ? (
                  <svg className="size-5 sm:size-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 13.7064C7.2 6.77236 16.8 6.77236 20 13.7064" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M12.0034 17.4366C10.7314 17.4366 9.69141 16.4016 9.69141 15.1236C9.69141 13.8466 10.7314 12.8105 12.0034 12.8105C13.2764 12.8105 14.3164 13.8466 14.3164 15.1236C14.3164 16.4016 13.2764 17.4366 12.0034 17.4366Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg className="size-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21.5 8.0109C19.539 12.139 16.056 14.6155 12.248 14.6155H12.252C8.444 14.6155 4.961 12.139 3 8.0109" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
                    <path d="M18.8398 11.8795L20.951 13.9906" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
                    <path d="M5.5813 11.8795L3.47019 13.9906" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
                    <path d="M15.4268 17.197L14.5823 14.2875" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
                    <path d="M8.99338 17.1973L9.83789 14.2877" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Deal/Skip button */}
          <button
            type="button"
            onClick={onNewGame}
            className={`z-20 flex flex-row items-center justify-center gap-2 px-4 py-3 text-base font-medium border rounded sm:text-lg sm:hidden ${
              gameOver
                ? 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500'
                : 'text-zinc-400 border-zinc-700'
            }`}
          >
            {gameOver ? (
              <>
                <svg className="size-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14.1241 4.79505L19.2096 5.44691C20.9871 5.67457 21.9328 7.07169 21.7051 8.84728L20.4919 18.309C20.2642 20.0855 18.9975 21.1985 17.219 20.9709L12.1335 20.318C10.356 20.0904 9.41128 18.6942 9.63894 16.9177L10.8512 7.456C11.0789 5.68041 12.3515 4.56738 14.1241 4.79505Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M11.1064 20.0104L9.03503 20.2838C7.13296 20.528 5.78644 19.342 5.54126 17.4487L4.25116 7.34485C4.00599 5.46127 5.01394 3.96394 6.916 3.71973L12.3401 3.03187C13.8559 2.83437 15.0234 3.56893 15.5507 4.84054" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M13.5456 11.8921C13.4367 10.9736 13.9523 10.0474 14.9165 9.93165C15.4234 9.8723 15.9283 10.061 16.2718 10.4395C16.731 10.2196 17.268 10.2333 17.7156 10.4755C18.5669 10.9435 18.7012 11.9952 18.2565 12.8066C17.5589 14.0928 15.4302 14.7749 15.4302 14.7749C15.4302 14.7749 13.7227 13.3641 13.5456 11.8921Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Deal</span>
              </>
            ) : (
              <>
                <svg className="size-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.9236 16.0242C15.6474 17.8738 13.5069 19.0854 11.0837 19.0854C7.17435 19.0854 4 15.9192 4 12.0017C4 8.09232 7.17435 4.91797 11.0837 4.91797C14.9366 4.91797 18.0705 7.98732 18.1755 11.8159" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20.0001 8.09766L18.3919 11.9012L14.6094 10.3019" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Skip Hand</span>
              </>
            )}
          </button>

          {/* Mobile Split + Double */}
          <div className="flex flex-row gap-1 lg:hidden">
            <button
              type="button"
              onClick={onSplit}
              disabled={gameOver || !canSplit}
              className="flex-1 px-4 py-3 text-base font-medium text-white bg-yellow-500 rounded disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-yellow-500 sm:text-lg hover:bg-yellow-600"
            >
              Split
            </button>
            <button
              type="button"
              onClick={onDouble}
              disabled={gameOver || !canDouble}
              className="flex-1 px-4 py-3 text-base font-medium text-white bg-indigo-500 rounded disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-indigo-500 sm:text-lg hover:bg-indigo-600"
            >
              Double
            </button>
          </div>

          {/* Hit + Stand */}
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={onHit}
              disabled={gameOver}
              className="px-4 py-3 text-base font-medium text-white bg-teal-500 rounded disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-teal-500 sm:text-lg hover:bg-teal-600"
            >
              Hit
            </button>
            <button
              type="button"
              onClick={onStand}
              disabled={gameOver}
              className="px-4 py-3 text-base font-medium text-white bg-red-500 rounded disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-red-500 sm:text-lg hover:bg-red-600"
            >
              Stand
            </button>
          </div>
        </div>

        {/* Desktop Double */}
        <button
          type="button"
          onClick={onDouble}
          disabled={gameOver || !canDouble}
          className="hidden px-4 py-3 text-base font-medium text-white bg-indigo-500 rounded disabled:opacity-40 lg:block disabled:cursor-not-allowed disabled:hover:bg-indigo-500 sm:text-lg hover:bg-indigo-600"
        >
          Double
        </button>

        {/* Desktop Skip/Deal icon */}
        <div className="relative items-end justify-end hidden sm:flex">
          <button type="button" onClick={onNewGame} className="relative z-10 text-zinc-400 hover:text-white">
            <svg className="size-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16.9236 16.0242C15.6474 17.8738 13.5069 19.0854 11.0837 19.0854C7.17435 19.0854 4 15.9192 4 12.0017C4 8.09232 7.17435 4.91797 11.0837 4.91797C14.9366 4.91797 18.0705 7.98732 18.1755 11.8159" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20.0001 8.09766L18.3919 11.9012L14.6094 10.3019" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={onNewGame}
            className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 px-4 py-3 text-base font-medium text-white bg-blue-500 rounded sm:text-lg ${
              gameOver ? 'bg-blue-500 hover:bg-blue-600' : 'opacity-0 pointer-events-none'
            }`}
          >
            <svg className="size-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.1241 4.79505L19.2096 5.44691C20.9871 5.67457 21.9328 7.07169 21.7051 8.84728L20.4919 18.309C20.2642 20.0855 18.9975 21.1985 17.219 20.9709L12.1335 20.318C10.356 20.0904 9.41128 18.6942 9.63894 16.9177L10.8512 7.456C11.0789 5.68041 12.3515 4.56738 14.1241 4.79505Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M11.1064 20.0104L9.03503 20.2838C7.13296 20.528 5.78644 19.342 5.54126 17.4487L4.25116 7.34485C4.00599 5.46127 5.01394 3.96394 6.916 3.71973L12.3401 3.03187C13.8559 2.83437 15.0234 3.56893 15.5507 4.84054" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M13.5456 11.8921C13.4367 10.9736 13.9523 10.0474 14.9165 9.93165C15.4234 9.8723 15.9283 10.061 16.2718 10.4395C16.731 10.2196 17.268 10.2333 17.7156 10.4755C18.5669 10.9435 18.7012 11.9952 18.2565 12.8066C17.5589 14.0928 15.4302 14.7749 15.4302 14.7749C15.4302 14.7749 13.7227 13.3641 13.5456 11.8921Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Deal</span>
          </button>
        </div>
      </div>

      {trainingMode && (
        <div className="absolute px-2 py-1 -translate-x-1/2 -bottom-4 left-1/2 w-fit">
          <p className="text-xs font-medium relative z-30 !text-zinc-50 text-center px-1.5 py-1 bg-cyan-700 rounded ring-4 ring-zinc-950">
            Training Mode
          </p>
        </div>
      )}
    </div>
  );
}
