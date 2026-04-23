import { useLayoutEffect } from "react";
import { GameProvider, useGame } from "./context/GameContext";
import { useGameData } from "./hooks/useGameData";
import LoadingScreen from "./components/LoadingScreen";
import ErrorScreen from "./components/ErrorScreen";
import MenuScreen from "./components/MenuScreen";
import CharacterSelectScreen from "./components/CharacterSelectScreen";
import BattleScreen from "./components/BattleScreen";
import GameOverOverlay from "./components/GameOverOverlay";
import LeaderboardScreen from "./components/LeaderboardScreen";
import type { BattleStats } from "./types/game";

function GameContent() {
  const { loading, error, data } = useGameData();
  const { state } = useGame();

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;
  if (!data) return <ErrorScreen error={new Error("No data loaded")} />;

  // Calculate battle stats for leaderboard
  const battleStats: BattleStats = {
    timeRemaining: Math.floor(state.battleTimer / 1000),
    damageTaken: state.damageTaken,
    score: 0, // Calculated in LeaderboardScreen
  };

  return (
    <>
      {state.phase === 'MENU' && <MenuScreen />}
      {state.phase === 'CHARACTER_SELECT' && (
        <CharacterSelectScreen characters={data.characters} />
      )}
      {state.phase === 'BATTLE' && <BattleScreen gameData={data} />}
      {state.phase === 'LEADERBOARD' && <LeaderboardScreen battleStats={battleStats} />}
      {state.phase === 'GAME_OVER' && <GameOverOverlay />}
    </>
  );
}

export default function App() {
  // ── Viewport management ──────────────────────────────────
  // Keeps --app-height, --game-height, --game-width in sync with the
  // real visible area. Handles mobile URL bar show/hide, keyboard popup,
  // orientation changes, and pinch zoom — all the things that make
  // mobile viewport sizing unreliable with pure CSS.
  useLayoutEffect(() => {
    const root = document.documentElement;
    let rafId = 0;
    const update = () => {
      const vv = window.visualViewport;
      const w = vv?.width ?? window.innerWidth;
      const h = vv?.height ?? window.innerHeight;
      const maxW = parseFloat(getComputedStyle(root).getPropertyValue("--app-max-width")) || 400;
      const maxH = parseFloat(getComputedStyle(root).getPropertyValue("--app-max-height")) || 800;
      root.style.setProperty("--app-height", `${Math.round(h)}px`);
      root.style.setProperty("--game-width", `${Math.round(Math.min(w, maxW))}px`);
      root.style.setProperty("--game-height", `${Math.min(Math.round(h), maxH)}px`);
    };
    const schedule = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => { rafId = 0; update(); });
    };
    update();
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("scroll", schedule);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("scroll", schedule);
    };
  }, []);

  return (
    <GameProvider>
      <div className="app-shell relative mx-auto flex w-full flex-col overflow-hidden">
        <GameContent />
      </div>
    </GameProvider>
  );
}
