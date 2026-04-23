import type { FighterState, CombatConfig, FighterAction } from '../types/game';

/**
 * AI System - Weighted random decision making for opponent behavior
 */

export interface AiDecision {
  action: FighterAction;
  shouldExecute: boolean;
}

/**
 * Calculate AI weights based on context (player state, AI state, distance)
 */
function calculateContextualWeights(
  aiState: FighterState,
  playerState: FighterState,
  combatConfig: CombatConfig
): Record<string, number> {
  const distance = Math.abs(aiState.position.x - playerState.position.x);
  const inRange = distance <= 80; // Same as ATTACK_RANGE in combat.ts

  let weights = {
    attack: combatConfig.ai_attack_weight,
    block: combatConfig.ai_block_weight,
    special: combatConfig.ai_special_weight,
    idle: combatConfig.ai_idle_weight,
  };

  // Contextual adjustments

  // If player is attacking, heavily prefer blocking
  if (playerState.currentAction === 'ATTACKING' || playerState.currentAction === 'SPECIAL') {
    weights.block = 60;
    weights.attack = 10;
    weights.special = 5;
    weights.idle = 25;
  }

  // If not in range, reduce attack weights
  if (!inRange) {
    weights.attack = 5;
    weights.special = 5;
    weights.idle = 40; // Move toward player
  }

  // If AI health is low, be more defensive
  const healthPercent = (aiState.health / aiState.maxHealth) * 100;
  if (healthPercent < 30) {
    weights.block = 50;
    weights.attack = 20;
  }

  // If special is on cooldown, redistribute its weight
  if (aiState.specialCooldown > 0) {
    const specialWeight = weights.special;
    weights.special = 0;
    weights.attack += specialWeight / 2;
    weights.idle += specialWeight / 2;
  }

  // If already in an action, can't change
  if (
    aiState.currentAction === 'ATTACKING' ||
    aiState.currentAction === 'SPECIAL' ||
    aiState.currentAction === 'HIT_STUN' ||
    aiState.currentAction === 'KNOCKED_DOWN'
  ) {
    return { current_action: 100 }; // Stay in current action
  }

  return weights;
}

/**
 * Weighted random choice from options
 */
function weightedRandomChoice(weights: Record<string, number>): string {
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (const [action, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0) {
      return action;
    }
  }

  // Fallback to first option
  return Object.keys(weights)[0];
}

/**
 * Get next AI action based on context and weighted random decision
 */
export function getAiAction(
  aiState: FighterState,
  playerState: FighterState,
  combatConfig: CombatConfig
): AiDecision {
  const weights = calculateContextualWeights(aiState, playerState, combatConfig);

  // If stuck in an action, don't change
  if ('current_action' in weights) {
    return {
      action: aiState.currentAction,
      shouldExecute: false,
    };
  }

  const choice = weightedRandomChoice(weights);

  // Map choice to fighter action
  switch (choice) {
    case 'attack':
      return {
        action: 'ATTACKING',
        shouldExecute: true,
      };

    case 'block':
      return {
        action: 'BLOCKING',
        shouldExecute: aiState.currentAction !== 'BLOCKING', // Only execute if not already blocking
      };

    case 'special':
      return {
        action: 'SPECIAL',
        shouldExecute: aiState.specialCooldown === 0,
      };

    case 'idle':
    default:
      return {
        action: 'IDLE',
        shouldExecute: false, // Idle means move toward player
      };
  }
}

/**
 * Get movement direction for AI when idle
 */
export function getAiMovement(
  aiState: FighterState,
  playerState: FighterState
): { direction: 'left' | 'right' | 'none'; speed: number; shouldJump: boolean } {
  const distance = Math.abs(aiState.position.x - playerState.position.x);
  const DESIRED_RANGE = 80; // Attack range
  const MOVE_SPEED = 3.5; // Match player speed, slightly faster

  // Random jump chance when moving (10%)
  const shouldJump = Math.random() < 0.1 && aiState.position.y === 0;

  // If too far, move toward player aggressively
  if (distance > DESIRED_RANGE) {
    if (aiState.position.x < playerState.position.x) {
      return { direction: 'right', speed: MOVE_SPEED, shouldJump };
    } else {
      return { direction: 'left', speed: MOVE_SPEED, shouldJump };
    }
  }

  // If too close, back away
  if (distance < 50) {
    if (aiState.position.x < playerState.position.x) {
      return { direction: 'left', speed: MOVE_SPEED * 0.7, shouldJump: false };
    } else {
      return { direction: 'right', speed: MOVE_SPEED * 0.7, shouldJump: false };
    }
  }

  // In good range, randomly strafe or stay (50% chance to move)
  if (Math.random() < 0.5) {
    const direction = Math.random() < 0.5 ? 'left' : 'right';
    return { direction, speed: MOVE_SPEED * 0.5, shouldJump };
  }

  return { direction: 'none', speed: 0, shouldJump: false };
}

/**
 * Get random AI reaction delay (ms) based on combat config
 */
export function getAiReactionDelay(combatConfig: CombatConfig): number {
  const min = combatConfig.ai_reaction_min_ms;
  const max = combatConfig.ai_reaction_max_ms;
  return min + Math.random() * (max - min);
}
