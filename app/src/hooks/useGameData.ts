import { useState, useEffect } from 'react';
import { loadGameData } from '../data/loadData';
import type { GameData } from '../types/game';

interface UseGameDataResult {
  loading: boolean;
  error: Error | null;
  data: GameData | null;
}

export function useGameData(): UseGameDataResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<GameData | null>(null);

  useEffect(() => {
    loadGameData()
      .then((gameData) => {
        setData(gameData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      });
  }, []);

  return { loading, error, data };
}
