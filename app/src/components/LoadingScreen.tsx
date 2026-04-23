export default function LoadingScreen() {
  return (
    <div
      className="game-screen flex items-center justify-center"
      style={{
        backgroundImage: 'url(/background_fortis.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-60" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        <img
          src="/FortisLogo.avif"
          alt="Fortis Games"
          className="w-64 h-auto drop-shadow-2xl"
        />
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-3" style={{
            textShadow: '4px 4px 8px rgba(0,0,0,0.8)',
            background: 'linear-gradient(to bottom, #FFD700, #FF8C00)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            FORTIS FIGHT CLUB
          </h1>
          <p className="text-white text-lg font-semibold mb-4" style={{
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
          }}>
            Settle it outside of the meeting room...
          </p>
        </div>
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-600 border-t-orange-500"></div>
        <p className="text-white text-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
          Loading game data...
        </p>
      </div>
    </div>
  );
}
