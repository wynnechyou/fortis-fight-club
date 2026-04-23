import { useState } from 'react';
import { useGame } from '../context/GameContext';
import type { Character } from '../types/game';

interface CharacterSelectScreenProps {
  characters: Character[];
}

export default function CharacterSelectScreen({ characters }: CharacterSelectScreenProps) {
  const { dispatch } = useGame();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!selectedId) return;

    // Pick a random AI character (different from player)
    const availableAi = characters.filter((c) => c.id !== selectedId);
    const aiCharacter = availableAi[Math.floor(Math.random() * availableAi.length)];

    dispatch({ type: 'SELECT_CHARACTER', characterId: selectedId });
    dispatch({ type: 'START_BATTLE', aiCharacterId: aiCharacter.id });
  };

  return (
    <div className="game-screen flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="ink-strong text-2xl font-bold">Select Your Fighter</h1>

      <div className="grid w-full max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
        {characters.map((char) => (
          <button
            key={char.id}
            onClick={() => setSelectedId(char.id)}
            className={`ui-panel flex flex-col items-center gap-3 p-4 transition-all ${
              selectedId === char.id
                ? 'ring-4 ring-blue-500'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            {/* Placeholder character portrait */}
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
              <span className="text-3xl font-bold text-white">
                {char.name.charAt(0)}
              </span>
            </div>

            <div className="text-center">
              <h3 className="ink-strong font-bold">{char.name}</h3>
              <p className="ink-soft text-xs">{char.specialName}</p>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={handleConfirm}
        disabled={!selectedId}
        className="ui-cta mt-4 disabled:opacity-50"
      >
        {selectedId ? 'Confirm Selection' : 'Choose a Fighter'}
      </button>

      <button
        onClick={() => dispatch({ type: 'RETURN_TO_MENU' })}
        className="ui-button mt-2"
      >
        Back to Menu
      </button>
    </div>
  );
}
