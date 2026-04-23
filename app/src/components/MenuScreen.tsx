import { useGame } from '../context/GameContext';

export default function MenuScreen() {
  const { dispatch } = useGame();

  return (
    <div
      className="game-screen flex flex-col items-center justify-center gap-8"
      style={{
        backgroundImage: 'url(/background_fortis.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-black bg-opacity-60" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <img
            src="/FortisLogo.avif"
            alt="Fortis Games"
            className="w-80 h-auto drop-shadow-2xl"
            onError={(e) => {
              // Fallback to placeholder if logo not found
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          {/* Fallback placeholder */}
          <div className="hidden h-32 w-32 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-2xl">
            <span className="text-6xl font-bold text-white">F</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-2" style={{
            textShadow: '4px 4px 8px rgba(0,0,0,0.8)',
            background: 'linear-gradient(to bottom, #FFD700, #FF8C00)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            FORTIS FIGHT CLUB
          </h1>
          <p className="text-white text-xl font-semibold" style={{
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
          }}>
            Settle it outside of the meeting room...
          </p>
        </div>

        {/* Start button */}
        <button
          className="ui-cta mt-6 text-2xl px-12 py-4"
          onClick={() => dispatch({ type: 'START_GAME' })}
        >
          START GAME
        </button>

        <p className="text-gray-400 text-sm mt-4">v1.0.0</p>
      </div>
    </div>
  );
}
