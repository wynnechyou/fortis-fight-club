// Core game types for Office Fighter

// Game phases
export type GamePhase = 'MENU' | 'CHARACTER_SELECT' | 'BATTLE' | 'GAME_OVER';

// Fighter action states
export type FighterAction = 'IDLE' | 'ATTACKING' | 'BLOCKING' | 'SPECIAL' | 'JUMPING' | 'HIT_STUN' | 'KNOCKED_DOWN';

// Character definition from CSV
export interface Character {
  id: string;
  name: string;
  health: number;
  sprite: string;
  specialName: string;
  specialDamage: number;
  specialCooldown: number; // ms
  attackDamage: number;
}

// Runtime fighter state during battle
export interface FighterState {
  characterId: string;
  character: Character;
  health: number;
  maxHealth: number;
  position: { x: number; y: number };
  currentAction: FighterAction;
  actionTimer: number; // ms remaining in current action
  specialCooldown: number; // ms until special available
  facingRight: boolean;
  animationFrame: number;
}

// Combat configuration from combat.csv
export interface CombatConfig {
  base_attack_damage: number;
  block_damage_reduction: number;
  attack_duration_ms: number;
  block_duration_ms: number;
  ai_reaction_min_ms: number;
  ai_reaction_max_ms: number;
  ai_attack_weight: number;
  ai_block_weight: number;
  ai_special_weight: number;
  ai_idle_weight: number;
}

// Visual effects configuration from visual_effects.csv
export interface VisualConfig {
  screen_shake_intensity: number;
  screen_shake_duration_ms: number;
  damage_flash_duration_ms: number;
  damage_flash_color: string;
  particle_count_hit: number;
  particle_count_special: number;
  health_bar_transition_ms: number;
  idle_animation_speed_ms: number;
  attack_animation_speed_ms: number;
}

// Screen shake effect
export interface ScreenShake {
  intensity: number;
  duration: number;
  elapsed: number;
}

// Particle effect
export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number; // velocity X
  vy: number; // velocity Y
  life: number; // 0 to 1
  maxLife: number;
  color: string;
  size: number;
}

// Visual effects state
export interface VisualEffects {
  screenShake: ScreenShake | null;
  damageFlash: {
    player: boolean;
    ai: boolean;
  };
  particles: Particle[];
}

// Complete game state
export interface GameState {
  phase: GamePhase;
  selectedCharacterId: string | null;
  playerFighter: FighterState | null;
  aiFighter: FighterState | null;
  visualEffects: VisualEffects;
  winner: 'player' | 'ai' | null;
}

// Game actions for reducer
export type GameAction =
  | { type: 'START_GAME' }
  | { type: 'SELECT_CHARACTER'; characterId: string }
  | { type: 'START_BATTLE'; aiCharacterId: string }
  | { type: 'INITIALIZE_FIGHTERS'; playerFighter: FighterState; aiFighter: FighterState }
  | { type: 'UPDATE_FIGHTER_STATE'; fighter: 'player' | 'ai'; state: Partial<FighterState> }
  | { type: 'APPLY_DAMAGE'; fighter: 'player' | 'ai'; damage: number }
  | { type: 'SET_FIGHTER_ACTION'; fighter: 'player' | 'ai'; action: FighterAction; duration?: number }
  | { type: 'UPDATE_TIMERS'; deltaTime: number }
  | { type: 'SPAWN_PARTICLES'; x: number; y: number; count: number; color: string }
  | { type: 'TRIGGER_SCREEN_SHAKE' }
  | { type: 'TRIGGER_DAMAGE_FLASH'; fighter: 'player' | 'ai' }
  | { type: 'CLEAR_DAMAGE_FLASH'; fighter: 'player' | 'ai' }
  | { type: 'UPDATE_PARTICLES'; deltaTime: number }
  | { type: 'UPDATE_SCREEN_SHAKE'; deltaTime: number }
  | { type: 'GAME_OVER'; winner: 'player' | 'ai' }
  | { type: 'RESTART_BATTLE' }
  | { type: 'RETURN_TO_MENU' };

// Input actions
export type PlayerInput = 'attack' | 'block' | 'special' | 'move_left' | 'move_right';

// AI decision weights
export interface AiWeights {
  attack: number;
  block: number;
  special: number;
  idle: number;
}

// Game data loaded from CSVs
export interface GameData {
  characters: Character[];
  combatConfig: CombatConfig;
  visualConfig: VisualConfig;
}
