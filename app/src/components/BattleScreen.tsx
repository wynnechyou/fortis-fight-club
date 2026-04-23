import { useEffect, useCallback, useRef } from 'react';
import { useGame } from '../context/GameContext';
import type { GameData } from '../types/game';
import { useKeyboardInput, type InputState } from '../hooks/useKeyboardInput';
import { processCombat, getAttackParticleColor } from '../engine/combat';
import { getAiAction, getAiMovement, getAiReactionDelay } from '../engine/ai';
import Fighter from './Fighter';

interface BattleScreenProps {
  gameData: GameData;
}

export default function BattleScreen({ gameData }: BattleScreenProps) {
  const { state, dispatch, initializeFighters } = useGame();
  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const aiDecisionTimerRef = useRef<number>(0);
  const aiReactionDelayRef = useRef<number>(800);

  // Initialize fighters on mount
  useEffect(() => {
    if (!state.playerFighter && state.selectedCharacterId) {
      const playerChar = gameData.characters.find(
        (c) => c.id === state.selectedCharacterId
      );
      // Pick random AI character (not the same as player)
      const aiChars = gameData.characters.filter(
        (c) => c.id !== state.selectedCharacterId
      );
      const aiChar = aiChars[Math.floor(Math.random() * aiChars.length)];

      if (playerChar && aiChar) {
        initializeFighters(playerChar, aiChar);
      }
    }
  }, [state.selectedCharacterId, state.playerFighter, gameData.characters, initializeFighters]);

  // Handle input (keyboard + mouse)
  const handleInput = useCallback(
    (inputs: InputState) => {
      if (!state.playerFighter) return;

      const { currentAction, specialCooldown } = state.playerFighter;

      // Can't take action during certain states
      if (
        currentAction === 'ATTACKING' ||
        currentAction === 'SPECIAL' ||
        currentAction === 'HIT_STUN' ||
        currentAction === 'KNOCKED_DOWN'
      ) {
        return;
      }

      // Handle basic attack (Left Click)
      if (inputs.leftClick && currentAction !== 'ATTACKING') {
        dispatch({
          type: 'SET_FIGHTER_ACTION',
          fighter: 'player',
          action: 'ATTACKING',
          duration: gameData.combatConfig.attack_duration_ms,
        });
        return;
      }

      // Handle special attack (Right Click)
      if (inputs.rightClick && currentAction !== 'SPECIAL' && specialCooldown === 0) {
        dispatch({
          type: 'SET_FIGHTER_ACTION',
          fighter: 'player',
          action: 'SPECIAL',
          duration: gameData.combatConfig.attack_duration_ms * 1.5,
        });
        dispatch({
          type: 'UPDATE_FIGHTER_STATE',
          fighter: 'player',
          state: { specialCooldown: state.playerFighter.character.specialCooldown },
        });
        return;
      }

      // Handle block (Shift)
      if (inputs.shift) {
        if (currentAction !== 'BLOCKING') {
          dispatch({
            type: 'SET_FIGHTER_ACTION',
            fighter: 'player',
            action: 'BLOCKING',
            duration: gameData.combatConfig.block_duration_ms,
          });
        }
        return;
      }

      // Handle jump (Space)
      if (inputs.space && currentAction !== 'JUMPING') {
        // TODO: Implement jump mechanics
        // For now, just a placeholder
      }

      // Handle movement (WASD or Arrow keys)
      const MOVE_SPEED = 3;
      let moved = false;

      if (inputs.ArrowLeft || inputs.a) {
        const newX = Math.max(100, state.playerFighter.position.x - MOVE_SPEED);
        dispatch({
          type: 'UPDATE_FIGHTER_STATE',
          fighter: 'player',
          state: {
            position: { ...state.playerFighter.position, x: newX },
            facingRight: false,
          },
        });
        moved = true;
      } else if (inputs.ArrowRight || inputs.d) {
        const newX = Math.min(1200, state.playerFighter.position.x + MOVE_SPEED);
        dispatch({
          type: 'UPDATE_FIGHTER_STATE',
          fighter: 'player',
          state: {
            position: { ...state.playerFighter.position, x: newX },
            facingRight: true,
          },
        });
        moved = true;
      }

      // Vertical movement (for future implementation)
      if (inputs.ArrowUp || inputs.w) {
        // TODO: Implement upward movement or jump
      }
      if (inputs.ArrowDown || inputs.s) {
        // TODO: Implement downward movement or crouch
      }

      // Return to idle if no movement and not in an action
      if (!moved && currentAction === 'IDLE' && !inputs.shift && !inputs.leftClick && !inputs.rightClick) {
        // Already idle, do nothing
      }
    },
    [state.playerFighter, gameData.combatConfig, dispatch]
  );

  useKeyboardInput(handleInput);

  // Game loop
  useEffect(() => {
    const gameLoop = (timestamp: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }

      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // AI Decision Making
      if (state.playerFighter && state.aiFighter) {
        aiDecisionTimerRef.current += deltaTime;

        if (aiDecisionTimerRef.current >= aiReactionDelayRef.current) {
          // AI makes a decision
          const aiDecision = getAiAction(
            state.aiFighter,
            state.playerFighter,
            gameData.combatConfig
          );

          if (aiDecision.shouldExecute) {
            // Execute the action
            if (aiDecision.action === 'ATTACKING') {
              dispatch({
                type: 'SET_FIGHTER_ACTION',
                fighter: 'ai',
                action: 'ATTACKING',
                duration: gameData.combatConfig.attack_duration_ms,
              });
            } else if (aiDecision.action === 'BLOCKING') {
              dispatch({
                type: 'SET_FIGHTER_ACTION',
                fighter: 'ai',
                action: 'BLOCKING',
                duration: gameData.combatConfig.block_duration_ms,
              });
            } else if (aiDecision.action === 'SPECIAL') {
              dispatch({
                type: 'SET_FIGHTER_ACTION',
                fighter: 'ai',
                action: 'SPECIAL',
                duration: gameData.combatConfig.attack_duration_ms * 1.5,
              });
              dispatch({
                type: 'UPDATE_FIGHTER_STATE',
                fighter: 'ai',
                state: { specialCooldown: state.aiFighter.character.specialCooldown },
              });
            }
          } else if (aiDecision.action === 'IDLE') {
            // Move toward/away from player
            const movement = getAiMovement(state.aiFighter, state.playerFighter);
            if (movement.direction !== 'none') {
              const newX =
                movement.direction === 'left'
                  ? Math.max(100, state.aiFighter.position.x - movement.speed)
                  : Math.min(1200, state.aiFighter.position.x + movement.speed);

              dispatch({
                type: 'UPDATE_FIGHTER_STATE',
                fighter: 'ai',
                state: {
                  position: { ...state.aiFighter.position, x: newX },
                  facingRight: newX < state.playerFighter.position.x,
                },
              });
            }
          }

          // Reset decision timer with new random delay
          aiDecisionTimerRef.current = 0;
          aiReactionDelayRef.current = getAiReactionDelay(gameData.combatConfig);
        }
      }

      // Process combat - check for hits
      if (state.playerFighter && state.aiFighter) {
        const combatResult = processCombat(
          state.playerFighter,
          state.aiFighter,
          gameData.combatConfig
        );

        if (combatResult) {
          // Apply damage
          dispatch({
            type: 'APPLY_DAMAGE',
            fighter: combatResult.defender,
            damage: combatResult.damage,
          });

          // Trigger screen shake
          dispatch({ type: 'TRIGGER_SCREEN_SHAKE' });

          // Trigger damage flash on defender
          dispatch({
            type: 'TRIGGER_DAMAGE_FLASH',
            fighter: combatResult.defender,
          });

          // Clear damage flash after duration
          setTimeout(() => {
            dispatch({
              type: 'CLEAR_DAMAGE_FLASH',
              fighter: combatResult.defender,
            });
          }, gameData.visualConfig.damage_flash_duration_ms);

          // Spawn particles at hit location
          const hitX = combatResult.defender === 'player'
            ? state.playerFighter.position.x
            : state.aiFighter.position.x;
          const hitY = combatResult.defender === 'player'
            ? state.playerFighter.position.y + 50
            : state.aiFighter.position.y + 50;

          const particleCount = combatResult.attackType === 'special'
            ? gameData.visualConfig.particle_count_special
            : gameData.visualConfig.particle_count_hit;

          const particleColor = getAttackParticleColor(
            combatResult.attackType,
            combatResult.wasBlocked
          );

          dispatch({
            type: 'SPAWN_PARTICLES',
            x: hitX,
            y: hitY,
            count: particleCount,
            color: particleColor,
          });
        }
      }

      // Update timers
      dispatch({ type: 'UPDATE_TIMERS', deltaTime });
      dispatch({ type: 'UPDATE_PARTICLES', deltaTime });
      dispatch({ type: 'UPDATE_SCREEN_SHAKE', deltaTime });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [dispatch, state.playerFighter, state.aiFighter, gameData.combatConfig, gameData.visualConfig]);

  if (!state.playerFighter || !state.aiFighter) {
    return (
      <div className="game-screen flex items-center justify-center">
        <p className="text-white">Loading fighters...</p>
      </div>
    );
  }

  // Calculate screen shake offset
  let shakeX = 0;
  let shakeY = 0;
  if (state.visualEffects.screenShake) {
    const shake = state.visualEffects.screenShake;
    const progress = shake.elapsed / shake.duration;
    const currentIntensity = shake.intensity * (1 - progress);
    shakeX = (Math.random() - 0.5) * currentIntensity;
    shakeY = (Math.random() - 0.5) * currentIntensity;
  }

  return (
    <div
      className="game-screen relative"
      style={{
        transform: `translate(${shakeX}px, ${shakeY}px)`,
      }}
    >
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/background_fortis.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Health bars */}
      <div className="absolute top-4 left-4 right-4 flex gap-4 z-10">
        <div className="flex-1">
          <div className="text-white text-sm mb-1">{state.playerFighter.character.name}</div>
          <div className="h-6 bg-black bg-opacity-50 rounded-full overflow-hidden border-2 border-white">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{
                width: `${(state.playerFighter.health / state.playerFighter.maxHealth) * 100}%`,
              }}
            />
          </div>
        </div>
        <div className="flex-1">
          <div className="text-white text-sm mb-1 text-right">{state.aiFighter.character.name}</div>
          <div className="h-6 bg-black bg-opacity-50 rounded-full overflow-hidden border-2 border-white">
            <div
              className="h-full bg-green-500 transition-all duration-300 ml-auto"
              style={{
                width: `${(state.aiFighter.health / state.aiFighter.maxHealth) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Special cooldown indicator */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="text-white text-xs mb-1">Special (Right Click)</div>
        <div className="w-24 h-2 bg-black bg-opacity-50 rounded-full overflow-hidden border border-white">
          <div
            className="h-full bg-yellow-400 transition-all duration-100"
            style={{
              width: `${100 - (state.playerFighter.specialCooldown / state.playerFighter.character.specialCooldown) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-4 right-4 z-10 bg-black bg-opacity-70 text-white text-xs p-2 rounded">
        <div className="font-bold mb-1">Controls</div>
        <div>WASD/Arrows - Move</div>
        <div>Space - Jump</div>
        <div>Shift - Block</div>
        <div>Left Click - Attack</div>
        <div>Right Click - Special</div>
      </div>

      {/* Fighters */}
      <div className="absolute inset-0">
        <Fighter
          fighter={state.playerFighter}
          scale={1.5}
          damageFlash={state.visualEffects.damageFlash.player}
        />
        <Fighter
          fighter={state.aiFighter}
          scale={1.5}
          damageFlash={state.visualEffects.damageFlash.ai}
        />
      </div>

      {/* Particles */}
      {state.visualEffects.particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${particle.x}px`,
            bottom: `${particle.y}px`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            opacity: particle.life,
          }}
        />
      ))}
    </div>
  );
}
