interface ErrorScreenProps {
  error: Error;
}

export default function ErrorScreen({ error }: ErrorScreenProps) {
  return (
    <div className="game-screen flex items-center justify-center bg-gradient-to-b from-red-900 to-slate-900">
      <div className="ui-panel max-w-md p-6">
        <h2 className="ink-strong mb-4 text-2xl font-bold">Error Loading Game</h2>
        <p className="ink-soft mb-4">Failed to load game data. Please check the console for details.</p>
        <div className="rounded bg-slate-800 p-4">
          <code className="text-sm text-red-400">{error.message}</code>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="ui-button mt-6 w-full"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}
