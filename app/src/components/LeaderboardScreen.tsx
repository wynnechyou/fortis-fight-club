import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import type { BattleStats } from '../types/game';

interface LeaderboardEntry {
  name: string;
  score: number;
  timeRemaining: number;
  damageTaken: number;
  date: string;
}

interface LeaderboardScreenProps {
  battleStats: BattleStats;
}

// Calculate score based on time and damage
function calculateScore(timeRemaining: number, damageTaken: number): number {
  // Base score from time remaining (max 1000 points for full 120 seconds)
  const timeScore = Math.floor((timeRemaining / 120) * 1000);

  // Penalty for damage taken (lose 10 points per damage point)
  const damagePenalty = damageTaken * 10;

  // Final score (minimum 0)
  return Math.max(0, timeScore - damagePenalty);
}

export default function LeaderboardScreen({ battleStats }: LeaderboardScreenProps) {
  const { dispatch } = useGame();
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const score = calculateScore(battleStats.timeRemaining, battleStats.damageTaken);

  // Load leaderboard from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('fortis_leaderboard');
    if (stored) {
      try {
        const entries = JSON.parse(stored) as LeaderboardEntry[];
        setLeaderboard(entries.sort((a, b) => b.score - a.score).slice(0, 10));
      } catch {
        setLeaderboard([]);
      }
    }
  }, []);

  const handleSubmit = () => {
    if (!name.trim()) return;

    const newEntry: LeaderboardEntry = {
      name: name.trim(),
      score,
      timeRemaining: battleStats.timeRemaining,
      damageTaken: battleStats.damageTaken,
      date: new Date().toISOString(),
    };

    const updatedLeaderboard = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Keep top 10

    setLeaderboard(updatedLeaderboard);
    localStorage.setItem('fortis_leaderboard', JSON.stringify(updatedLeaderboard));
    setSubmitted(true);
  };

  return (
    <div className="game-screen flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="ink-strong text-3xl font-bold">Victory!</h1>

      {/* Battle stats */}
      <div className="ui-panel max-w-md w-full p-6">
        <h2 className="ink-strong text-xl font-bold mb-4 text-center">Battle Results</h2>
        <div className="space-y-2 ink-strong">
          <div className="flex justify-between">
            <span>Time Remaining:</span>
            <span className="font-bold">{battleStats.timeRemaining}s</span>
          </div>
          <div className="flex justify-between">
            <span>Damage Taken:</span>
            <span className="font-bold">{Math.floor(battleStats.damageTaken)}</span>
          </div>
          <div className="flex justify-between text-xl pt-2 border-t-2 border-current">
            <span>Final Score:</span>
            <span className="font-bold text-yellow-400">{score}</span>
          </div>
        </div>
      </div>

      {/* Name entry */}
      {!submitted ? (
        <div className="ui-panel max-w-md w-full p-6">
          <h3 className="ink-strong text-lg font-bold mb-3">Enter Your Name</h3>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Your name"
            maxLength={20}
            className="w-full px-4 py-2 rounded bg-gray-800 text-white border-2 border-gray-600 focus:border-blue-500 outline-none mb-3"
            autoFocus
          />
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="ui-cta w-full disabled:opacity-50"
          >
            Submit Score
          </button>
        </div>
      ) : null}

      {/* Leaderboard */}
      <div className="ui-panel max-w-2xl w-full p-6">
        <h2 className="ink-strong text-xl font-bold mb-4 text-center">Top Fighters</h2>
        {leaderboard.length === 0 ? (
          <p className="ink-soft text-center">No entries yet. Be the first!</p>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry, index) => (
              <div
                key={`${entry.date}-${index}`}
                className={`flex items-center gap-3 p-3 rounded ${
                  entry.name === name.trim() && submitted
                    ? 'bg-yellow-500 bg-opacity-20 border-2 border-yellow-500'
                    : 'bg-black bg-opacity-30'
                }`}
              >
                <div className="ink-strong text-2xl font-bold w-8">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                </div>
                <div className="flex-1 ink-strong font-bold">{entry.name}</div>
                <div className="ink-soft text-sm">
                  {entry.timeRemaining}s / {Math.floor(entry.damageTaken)} dmg
                </div>
                <div className="ink-strong font-bold text-lg text-yellow-400">
                  {entry.score}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={() => dispatch({ type: 'RESTART_BATTLE' })}
          className="ui-button"
        >
          Play Again
        </button>
        <button
          onClick={() => dispatch({ type: 'RETURN_TO_MENU' })}
          className="ui-button"
        >
          Main Menu
        </button>
      </div>
    </div>
  );
}
