import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type {
  GameState,
  GameAction,
  FighterState,
  Character,
  Particle,
} from '../types/game';

// Initial state
const initialState: GameState = {
  phase: 'MENU',
  selectedCharacterId: null,
  playerFighter: null,
  aiFighter: null,
  visualEffects: {
    screenShake: null,
    damageFlash: {
      player: false,
      ai: false,
    },
    particles: [],
  },
  winner: null,
};

// Helper to create fighter state from character
function createFighterState(character: Character, facingRight: boolean, x: number): FighterState {
  return {
    characterId: character.id,
    character,
    health: character.health,
    maxHealth: character.health,
    position: { x, y: 0 },
    velocity: { x: 0, y: 0 },
    currentAction: 'IDLE',
    actionTimer: 0,
    specialCooldown: 0,
    facingRight,
    animationFrame: 0,
  };
}

// Reducer
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...initialState,
        phase: 'CHARACTER_SELECT',
      };

    case 'SELECT_CHARACTER':
      return {
        ...state,
        selectedCharacterId: action.characterId,
      };

    case 'START_BATTLE': {
      // This will be called from useGameData hook with characters loaded
      // For now, just transition phase - actual fighter setup happens in BattleScreen
      return {
        ...state,
        phase: 'BATTLE',
      };
    }

    case 'INITIALIZE_FIGHTERS':
      return {
        ...state,
        playerFighter: action.playerFighter,
        aiFighter: action.aiFighter,
      };

    case 'UPDATE_FIGHTER_STATE': {
      const fighterKey = action.fighter === 'player' ? 'playerFighter' : 'aiFighter';
      const currentFighter = state[fighterKey];
      if (!currentFighter) return state;

      return {
        ...state,
        [fighterKey]: {
          ...currentFighter,
          ...action.state,
        },
      };
    }

    case 'APPLY_DAMAGE': {
      const fighterKey = action.fighter === 'player' ? 'playerFighter' : 'aiFighter';
      const fighter = state[fighterKey];
      if (!fighter) return state;

      const newHealth = Math.max(0, fighter.health - action.damage);

      // Check for knockout
      if (newHealth === 0) {
        return {
          ...state,
          [fighterKey]: {
            ...fighter,
            health: 0,
            currentAction: 'KNOCKED_DOWN' as const,
          },
          winner: action.fighter === 'player' ? 'ai' : 'player',
          phase: 'GAME_OVER',
        };
      }

      return {
        ...state,
        [fighterKey]: {
          ...fighter,
          health: newHealth,
          currentAction: 'HIT_STUN' as const,
          actionTimer: 100, // 100ms hit stun
        },
      };
    }

    case 'SET_FIGHTER_ACTION': {
      const fighterKey = action.fighter === 'player' ? 'playerFighter' : 'aiFighter';
      const fighter = state[fighterKey];
      if (!fighter) return state;

      return {
        ...state,
        [fighterKey]: {
          ...fighter,
          currentAction: action.action,
          actionTimer: action.duration || 0,
        },
      };
    }

    case 'UPDATE_TIMERS': {
      const { deltaTime } = action;
      const newState = { ...state };

      // Update player fighter timers
      if (newState.playerFighter) {
        newState.playerFighter = {
          ...newState.playerFighter,
          actionTimer: Math.max(0, newState.playerFighter.actionTimer - deltaTime),
          specialCooldown: Math.max(0, newState.playerFighter.specialCooldown - deltaTime),
        };

        // Return to IDLE when action timer expires
        if (newState.playerFighter.actionTimer === 0 && newState.playerFighter.currentAction !== 'IDLE' && newState.playerFighter.currentAction !== 'KNOCKED_DOWN') {
          newState.playerFighter.currentAction = 'IDLE';
        }
      }

      // Update AI fighter timers
      if (newState.aiFighter) {
        newState.aiFighter = {
          ...newState.aiFighter,
          actionTimer: Math.max(0, newState.aiFighter.actionTimer - deltaTime),
          specialCooldown: Math.max(0, newState.aiFighter.specialCooldown - deltaTime),
        };

        // Return to IDLE when action timer expires
        if (newState.aiFighter.actionTimer === 0 && newState.aiFighter.currentAction !== 'IDLE' && newState.aiFighter.currentAction !== 'KNOCKED_DOWN') {
          newState.aiFighter.currentAction = 'IDLE';
        }
      }

      return newState;
    }

    case 'SPAWN_PARTICLES': {
      const newParticles: Particle[] = [];
      for (let i = 0; i < action.count; i++) {
        const angle = (Math.random() * Math.PI * 2);
        const speed = 2 + Math.random() * 3;
        newParticles.push({
          id: `${Date.now()}-${i}`,
          x: action.x,
          y: action.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2, // upward bias
          life: 1,
          maxLife: 1000, // 1 second
          color: action.color,
          size: 6 + Math.random() * 4,
        });
      }

      return {
        ...state,
        visualEffects: {
          ...state.visualEffects,
          particles: [...state.visualEffects.particles, ...newParticles],
        },
      };
    }

    case 'TRIGGER_SCREEN_SHAKE':
      return {
        ...state,
        visualEffects: {
          ...state.visualEffects,
          screenShake: {
            intensity: 8,
            duration: 200,
            elapsed: 0,
          },
        },
      };

    case 'TRIGGER_DAMAGE_FLASH': {
      const flashKey = action.fighter;
      return {
        ...state,
        visualEffects: {
          ...state.visualEffects,
          damageFlash: {
            ...state.visualEffects.damageFlash,
            [flashKey]: true,
          },
        },
      };
    }

    case 'CLEAR_DAMAGE_FLASH': {
      const flashKey = action.fighter;
      return {
        ...state,
        visualEffects: {
          ...state.visualEffects,
          damageFlash: {
            ...state.visualEffects.damageFlash,
            [flashKey]: false,
          },
        },
      };
    }

    case 'UPDATE_PARTICLES': {
      const { deltaTime } = action;
      const dt = deltaTime / 1000; // convert to seconds

      const updatedParticles = state.visualEffects.particles
        .map((p) => ({
          ...p,
          x: p.x + p.vx * dt * 100,
          y: p.y + p.vy * dt * 100,
          vy: p.vy + 0.5 * dt * 100, // gravity
          life: p.life - dt / (p.maxLife / 1000),
        }))
        .filter((p) => p.life > 0);

      return {
        ...state,
        visualEffects: {
          ...state.visualEffects,
          particles: updatedParticles,
        },
      };
    }

    case 'UPDATE_SCREEN_SHAKE': {
      const { screenShake } = state.visualEffects;
      if (!screenShake) return state;

      const newElapsed = screenShake.elapsed + action.deltaTime;
      if (newElapsed >= screenShake.duration) {
        return {
          ...state,
          visualEffects: {
            ...state.visualEffects,
            screenShake: null,
          },
        };
      }

      return {
        ...state,
        visualEffects: {
          ...state.visualEffects,
          screenShake: {
            ...screenShake,
            elapsed: newElapsed,
          },
        },
      };
    }

    case 'GAME_OVER':
      return {
        ...state,
        phase: 'GAME_OVER',
        winner: action.winner,
      };

    case 'RESTART_BATTLE':
      // Reset to battle with same selected character
      return {
        ...state,
        phase: 'BATTLE',
        playerFighter: null,
        aiFighter: null,
        visualEffects: initialState.visualEffects,
        winner: null,
      };

    case 'RETURN_TO_MENU':
      return {
        ...initialState,
        phase: 'MENU',
      };

    default:
      return state;
  }
}

// Context
interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  initializeFighters: (playerCharacter: Character, aiCharacter: Character) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

// Provider
export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const initializeFighters = (playerCharacter: Character, aiCharacter: Character) => {
    const playerFighter = createFighterState(playerCharacter, true, 300);
    const aiFighter = createFighterState(aiCharacter, false, 1000);

    dispatch({
      type: 'INITIALIZE_FIGHTERS',
      playerFighter,
      aiFighter,
    });
  };

  return (
    <GameContext.Provider value={{ state, dispatch, initializeFighters }}>
      {children}
    </GameContext.Provider>
  );
}

// Hook to use game context
export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
}
