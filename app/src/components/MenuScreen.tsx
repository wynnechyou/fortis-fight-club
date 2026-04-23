import { useGame } from '../context/GameContext';

export default function MenuScreen() {
  const { dispatch } = useGame();

  return (
    <div className="game-screen flex flex-col items-center justify-center gap-6">
      {/* Logo placeholder */}
      <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
        <span className="text-4xl font-bold text-white">OF</span>
      </div>

      <h1 className="ink-strong text-3xl font-bold">Office Fighter</h1>
      <p className="ink-soft text-sm">The Ultimate Workplace Showdown</p>

      <button
        className="ui-cta mt-4"
        onClick={() => dispatch({ type: 'START_GAME' })}
      >
        Start Game
      </button>

      <p className="ink-soft text-xs">v0.1.0</p>
    </div>
  );
}
