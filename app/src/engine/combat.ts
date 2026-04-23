import type { FighterState, CombatConfig, FighterAction } from '../types/game';

/**
 * Combat System - State-based hit detection and damage calculation
 * No physics or hitboxes - damage is determined by fighter states and proximity
 */

const ATTACK_RANGE = 80; // pixels - how close fighters need to be to hit

/**
 * Check if two fighters are in range to hit each other
 */
function isInRange(fighter1: FighterState, fighter2: FighterState): boolean {
  const distance = Math.abs(fighter1.position.x - fighter2.position.x);
  return distance <= ATTACK_RANGE;
}

/**
 * Check if a fighter can execute an action based on current state
 */
export function canExecuteAction(
  fighter: FighterState,
  action: FighterAction
): boolean {
  const { currentAction } = fighter;

  // Can't act while knocked down
  if (currentAction === 'KNOCKED_DOWN') return false;

  // Can't act during hit stun
  if (currentAction === 'HIT_STUN') return false;

  // Can't interrupt attack or special
  if (currentAction === 'ATTACKING' || currentAction === 'SPECIAL') {
    return false;
  }

  // Check special cooldown
  if (action === 'SPECIAL' && fighter.specialCooldown > 0) {
    return false;
  }

  return true;
}

/**
 * Calculate damage based on attack type and defender state
 */
export function calculateDamage(
  attacker: FighterState,
  defender: FighterState,
  attackType: 'normal' | 'special',
  combatConfig: CombatConfig
): number {
  let baseDamage = 0;

  // Determine base damage
  if (attackType === 'normal') {
    baseDamage = attacker.character.attackDamage;
  } else {
    baseDamage = attacker.character.specialDamage;
  }

  // Apply block reduction if defender is blocking
  if (defender.currentAction === 'BLOCKING') {
    baseDamage *= combatConfig.block_damage_reduction;
  }

  return Math.round(baseDamage);
}

/**
 * Check if an attack should connect and return damage info
 */
export interface CombatResult {
  hit: boolean;
  damage: number;
  attacker: 'player' | 'ai';
  defender: 'player' | 'ai';
  attackType: 'normal' | 'special';
  wasBlocked: boolean;
}

export function processCombat(
  playerFighter: FighterState,
  aiFighter: FighterState,
  combatConfig: CombatConfig
): CombatResult | null {
  // Check if player is attacking
  const playerAttacking =
    playerFighter.currentAction === 'ATTACKING' ||
    playerFighter.currentAction === 'SPECIAL';

  const aiAttacking =
    aiFighter.currentAction === 'ATTACKING' ||
    aiFighter.currentAction === 'SPECIAL';

  // Player attacking AI
  if (playerAttacking && isInRange(playerFighter, aiFighter)) {
    // Only deal damage on first frame of attack (when actionTimer is at max)
    const isFirstFrame =
      playerFighter.actionTimer >= combatConfig.attack_duration_ms - 50 || // Normal attack
      playerFighter.actionTimer >= (combatConfig.attack_duration_ms * 1.5) - 50; // Special

    if (isFirstFrame) {
      const attackType = playerFighter.currentAction === 'SPECIAL' ? 'special' : 'normal';
      const damage = calculateDamage(playerFighter, aiFighter, attackType, combatConfig);

      return {
        hit: true,
        damage,
        attacker: 'player',
        defender: 'ai',
        attackType,
        wasBlocked: aiFighter.currentAction === 'BLOCKING',
      };
    }
  }

  // AI attacking player
  if (aiAttacking && isInRange(aiFighter, playerFighter)) {
    const isFirstFrame =
      aiFighter.actionTimer >= combatConfig.attack_duration_ms - 50 ||
      aiFighter.actionTimer >= (combatConfig.attack_duration_ms * 1.5) - 50;

    if (isFirstFrame) {
      const attackType = aiFighter.currentAction === 'SPECIAL' ? 'special' : 'normal';
      const damage = calculateDamage(aiFighter, playerFighter, attackType, combatConfig);

      return {
        hit: true,
        damage,
        attacker: 'ai',
        defender: 'player',
        attackType,
        wasBlocked: playerFighter.currentAction === 'BLOCKING',
      };
    }
  }

  // No hit detected
  return null;
}

/**
 * Check if a fighter should face the opponent
 */
export function shouldFaceOpponent(
  fighter: FighterState,
  opponent: FighterState
): boolean {
  const fighterOnLeft = fighter.position.x < opponent.position.x;
  return fighterOnLeft !== fighter.facingRight;
}

/**
 * Get the appropriate particle color based on attack type
 */
export function getAttackParticleColor(attackType: 'normal' | 'special', wasBlocked: boolean): string {
  if (wasBlocked) {
    return '#fbbf24'; // Yellow for blocked
  }
  return attackType === 'special' ? '#a855f7' : '#ef4444'; // Purple for special, red for normal
}
