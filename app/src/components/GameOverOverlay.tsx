import { useGame } from '../context/GameContext';

export default function GameOverOverlay() {
  const { state, dispatch } = useGame();

  const isPlayerWinner = state.winner === 'player';

  return (
    <div className="game-screen flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="ui-panel max-w-md p-8 text-center">
        <h1
          className={`mb-4 text-4xl font-bold ${
            isPlayerWinner ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {isPlayerWinner ? 'Victory!' : 'Defeated!'}
        </h1>

        <p className="ink-soft mb-8 text-lg">
          {isPlayerWinner
            ? 'You have proven your office supremacy!'
            : 'Better luck next time, warrior!'}
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => dispatch({ type: 'RESTART_BATTLE' })}
            className="ui-cta"
          >
            Rematch
          </button>
          <button
            onClick={() => dispatch({ type: 'RETURN_TO_MENU' })}
            className="ui-button"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
