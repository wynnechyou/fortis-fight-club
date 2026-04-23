export default function LoadingScreen() {
  return (
    <div className="game-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="flex flex-col items-center gap-4">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-600 border-t-blue-500"></div>
        <p className="ink-soft text-lg">Loading game data...</p>
      </div>
    </div>
  );
}
