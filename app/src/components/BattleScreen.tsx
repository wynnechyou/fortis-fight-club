import { useEffect, useCallback, useRef } from 'react';
import { useGame } from '../context/GameContext';
import type { GameData } from '../types/game';
import { useKeyboardInput, type InputState } from '../hooks/useKeyboardInput';
import { processCombat, getAttackParticleColor } from '../engine/combat';
import { getAiAction, getAiMovement, getAiReactionDelay } from '../engine/ai';
import Fighter from './Fighter';
import { getAssetPath } from '../utils/assetPath';

interface BattleScreenProps {
  gameData: GameData;
}

export default function BattleScreen({ gameData }: BattleScreenProps) {
  const { state, dispatch, initializeFighters } = useGame();
  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const aiDecisionTimerRef = useRef<number>(0);
  const aiReactionDelayRef = useRef<number>(150);
  const aiMovementTimerRef = useRef<number>(0);
  const aiMovementDirectionRef = useRef<'left' | 'right'>(Math.random() < 0.5 ? 'left' : 'right');
  const inputStateRef = useRef<InputState>({
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
    a: false,
    s: false,
    d: false,
    w: false,
    space: false,
    shift: false,
    leftClick: false,
    rightClick: false,
  });

  // Initialize fighters on mount
  useEffect(() => {
    if (!state.playerFighter && state.selectedCharacterId) {
      const playerChar = gameData.characters.find(
        (c) => c.id === state.selectedCharacterId
      );

      // Pick random AI character (different from player if possible)
      let aiChars = gameData.characters.filter(
        (c) => c.id !== state.selectedCharacterId
      );

      // If only one character exists, use same character for AI
      if (aiChars.length === 0) {
        aiChars = gameData.characters;
      }

      const aiChar = aiChars[Math.floor(Math.random() * aiChars.length)];

      if (playerChar && aiChar) {
        console.log('[BattleScreen] Initializing fighters:', playerChar.name, 'vs', aiChar.name);
        initializeFighters(playerChar, aiChar);
      } else {
        console.error('[BattleScreen] Failed to initialize fighters - playerChar:', playerChar, 'aiChar:', aiChar);
      }
    }
  }, [state.selectedCharacterId, state.playerFighter, gameData.characters, initializeFighters]);

  // Update input state ref
  const handleInput = useCallback((inputs: InputState) => {
    inputStateRef.current = inputs;
  }, []);

  useKeyboardInput(handleInput);

  // Game loop
  useEffect(() => {
    const gameLoop = (timestamp: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }

      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Process player input and physics
      if (state.playerFighter) {
        const inputs = inputStateRef.current;
        const { currentAction, specialCooldown, position, velocity } = state.playerFighter;

        // Can take action unless in specific locked states
        const canAct = !(
          currentAction === 'ATTACKING' ||
          currentAction === 'SPECIAL' ||
          currentAction === 'HIT_STUN' ||
          currentAction === 'KNOCKED_DOWN'
        );

        // Physics constants
        const GRAVITY = -0.8; // Negative pulls toward ground (y=0)
        const JUMP_VELOCITY = 18; // Positive jumps upward
        const GROUND_Y = 0;

        // Apply gravity
        let newVelocityY = velocity.y + GRAVITY;
        let newY = position.y + newVelocityY;

        // Ground collision
        if (newY <= GROUND_Y) {
          newY = GROUND_Y;
          newVelocityY = 0;
        }

        // Update position with physics
        dispatch({
          type: 'UPDATE_FIGHTER_STATE',
          fighter: 'player',
          state: {
            position: { ...position, y: newY },
            velocity: { ...velocity, y: newVelocityY },
          },
        });

        if (canAct) {
          // Handle basic attack (Left Click)
          if (inputs.leftClick && currentAction !== 'ATTACKING') {
            dispatch({
              type: 'SET_FIGHTER_ACTION',
              fighter: 'player',
              action: 'ATTACKING',
              duration: gameData.combatConfig.attack_duration_ms,
            });
          }
          // Handle special attack (Right Click)
          else if (inputs.rightClick && currentAction !== 'SPECIAL' && specialCooldown === 0) {
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
          }
          // Handle block (Shift)
          else if (inputs.shift && currentAction !== 'BLOCKING') {
            dispatch({
              type: 'SET_FIGHTER_ACTION',
              fighter: 'player',
              action: 'BLOCKING',
              duration: gameData.combatConfig.block_duration_ms,
            });
          }
          // Handle jump (Space)
          else if (inputs.space && position.y === GROUND_Y) {
            dispatch({
              type: 'UPDATE_FIGHTER_STATE',
              fighter: 'player',
              state: {
                velocity: { ...velocity, y: JUMP_VELOCITY },
              },
            });
          }
          // Handle movement (WASD or Arrow keys)
          else if (inputs.ArrowLeft || inputs.a) {
            const newX = Math.max(100, state.playerFighter.position.x - 3);
            dispatch({
              type: 'UPDATE_FIGHTER_STATE',
              fighter: 'player',
              state: {
                position: { ...state.playerFighter.position, x: newX },
                facingRight: false,
              },
            });
          } else if (inputs.ArrowRight || inputs.d) {
            const newX = Math.min(1200, state.playerFighter.position.x + 3);
            dispatch({
              type: 'UPDATE_FIGHTER_STATE',
              fighter: 'player',
              state: {
                position: { ...state.playerFighter.position, x: newX },
                facingRight: true,
              },
            });
          }
        }
      }

      // AI Decision Making and Movement
      if (state.playerFighter && state.aiFighter) {
        // AI combat decision timer
        aiDecisionTimerRef.current += deltaTime;

        // AI movement direction change timer (every 2 seconds)
        aiMovementTimerRef.current += deltaTime;
        const MOVEMENT_CHANGE_INTERVAL = 2000; // 2 seconds

        if (aiMovementTimerRef.current >= MOVEMENT_CHANGE_INTERVAL) {
          // 50% chance to change direction
          if (Math.random() < 0.5) {
            aiMovementDirectionRef.current = aiMovementDirectionRef.current === 'left' ? 'right' : 'left';
          }
          aiMovementTimerRef.current = 0;
        }

        // Continuous AI movement (not tied to decision timer)
        const AI_MOVE_SPEED = 3.5;
        const newAiX =
          aiMovementDirectionRef.current === 'left'
            ? Math.max(100, state.aiFighter.position.x - AI_MOVE_SPEED)
            : Math.min(1200, state.aiFighter.position.x + AI_MOVE_SPEED);

        // Random jump while moving (5% chance per frame)
        if (Math.random() < 0.05 && state.aiFighter.position.y === 0) {
          dispatch({
            type: 'UPDATE_FIGHTER_STATE',
            fighter: 'ai',
            state: {
              velocity: { ...state.aiFighter.velocity, y: 18 },
            },
          });
        }

        // Update AI position
        dispatch({
          type: 'UPDATE_FIGHTER_STATE',
          fighter: 'ai',
          state: {
            position: { ...state.aiFighter.position, x: newAiX },
            facingRight: newAiX < state.playerFighter.position.x,
          },
        });

        // AI combat decisions
        if (aiDecisionTimerRef.current >= aiReactionDelayRef.current) {
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
          }

          // Reset decision timer with new random delay
          aiDecisionTimerRef.current = 0;
          aiReactionDelayRef.current = getAiReactionDelay(gameData.combatConfig);
        }

        // Apply physics to AI fighter
        const GRAVITY = -0.8; // Negative pulls toward ground (y=0)
        const GROUND_Y = 0;

        let aiVelocityY = state.aiFighter.velocity.y + GRAVITY;
        let aiY = state.aiFighter.position.y + aiVelocityY;

        if (aiY <= GROUND_Y) {
          aiY = GROUND_Y;
          aiVelocityY = 0;
        }

        dispatch({
          type: 'UPDATE_FIGHTER_STATE',
          fighter: 'ai',
          state: {
            position: { ...state.aiFighter.position, y: aiY },
            velocity: { ...state.aiFighter.velocity, y: aiVelocityY },
          },
        });
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
      dispatch({ type: 'UPDATE_BATTLE_TIMER', deltaTime });
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
          backgroundImage: `url(${getAssetPath('background_fortis.png')})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Health bars and timer/score */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="flex gap-4 mb-2">
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

        {/* Timer and Score */}
        <div className="flex justify-center gap-6">
          <div className="bg-black bg-opacity-70 text-white px-4 py-2 rounded">
            <div className="text-xs text-gray-400">Time</div>
            <div className="text-xl font-bold">
              {Math.ceil(state.battleTimer / 1000)}s
            </div>
          </div>
          <div className="bg-black bg-opacity-70 text-white px-4 py-2 rounded">
            <div className="text-xs text-gray-400">Damage</div>
            <div className="text-xl font-bold text-red-400">
              {Math.floor(state.damageTaken)}
            </div>
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
