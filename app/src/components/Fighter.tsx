import { useEffect, useState, useRef } from 'react';
import type { FighterState } from '../types/game';
import { ANIMATION_FRAMES, type AnimationState } from '../constants/spriteConfig';
import { getAssetPath } from '../utils/assetPath';

interface FighterProps {
  fighter: FighterState;
  scale?: number;
  damageFlash?: boolean;
}

// Map game action to animation state
function getAnimationState(action: FighterState['currentAction']): AnimationState {
  switch (action) {
    case 'IDLE':
      return 'IDLE';
    case 'ATTACKING':
      return 'ATTACK';
    case 'BLOCKING':
      return 'IDLE'; // Use idle for blocking
    case 'SPECIAL':
      return 'SPECIAL';
    case 'HIT_STUN':
      return 'HIT';
    case 'KNOCKED_DOWN':
      return 'KO';
    default:
      return 'IDLE';
  }
}

export default function Fighter({ fighter, scale = 1.5, damageFlash = false }: FighterProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const lastFrameTime = useRef(0);

  const animationState = getAnimationState(fighter.currentAction);
  const animConfig = ANIMATION_FRAMES[animationState];

  // Load sprite image and calculate frame dimensions
  useEffect(() => {
    const spritePath = getAssetPath(fighter.character.sprite);
    console.log(`[Fighter] Loading sprite for ${fighter.character.name}: ${spritePath}`);
    const img = new Image();

    img.onload = () => {
      console.log(`[Fighter] ✓ Sprite loaded successfully: ${img.width}x${img.height}`);

      // Calculate frame size based on sprite sheet layout
      // 5 rows × 3 frames per row
      const framesPerRow = 3;
      const totalRows = 5;

      // Handle sprite sheets with uneven dimensions
      // Use exact pixel division (floating point for precise extraction)
      const frameWidth = img.width / framesPerRow;
      const frameHeight = img.height / totalRows;

      console.log(`[Fighter] Image size: ${img.width}x${img.height}`);
      console.log(`[Fighter] Frame size: ${frameWidth.toFixed(2)}x${frameHeight.toFixed(2)}`);
      console.log(`[Fighter] Character: ${fighter.character.name}`);

      setFrameSize({ width: frameWidth, height: frameHeight });
      imageRef.current = img;
      setImageLoaded(true);
    };

    img.onerror = (e) => {
      const errorMsg = `Failed to load sprite: ${spritePath}`;
      console.error(`[Fighter] ✗ ${errorMsg}`, e);
      console.error(`[Fighter] Character data:`, fighter.character);
      setError(errorMsg);
    };

    // Set src AFTER attaching handlers
    img.src = spritePath;
  }, [fighter.character.sprite, fighter.character.name, fighter.character]);

  // Animate frames
  useEffect(() => {
    if (!imageLoaded) return;

    let animationFrameId: number;
    const frameDuration = 150; // ms per frame

    const animate = (timestamp: number) => {
      if (lastFrameTime.current === 0) {
        lastFrameTime.current = timestamp;
      }

      const elapsed = timestamp - lastFrameTime.current;

      if (elapsed >= frameDuration) {
        setCurrentFrame((prev) => {
          const nextFrame = prev + 1;
          if (nextFrame >= animConfig.frameCount) {
            return 0;
          }
          return nextFrame;
        });
        lastFrameTime.current = timestamp;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [imageLoaded, animConfig.frameCount]);

  // Draw sprite to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageLoaded || frameSize.width === 0) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Clear canvas with full transparency
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ensure global composite operation preserves transparency
    ctx.globalCompositeOperation = 'source-over';

    // Calculate source position in sprite sheet
    const col = animConfig.startCol + currentFrame;
    const row = animConfig.row;
    const sx = col * frameSize.width;
    const sy = row * frameSize.height;

    // Debug: log frame extraction details (only on frame 0 to avoid spam)
    if (currentFrame === 0) {
      console.log(`[Fighter] Extracting frame - Row: ${row}, Col: ${col}, sx: ${sx}, sy: ${sy}, frameSize: ${frameSize.width}x${frameSize.height}`);
    }

    // Flip sprite if facing left
    if (!fighter.facingRight) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(
        img,
        sx,
        sy,
        frameSize.width,
        frameSize.height,
        -frameSize.width * scale,
        0,
        frameSize.width * scale,
        frameSize.height * scale
      );
      ctx.restore();
    } else {
      ctx.drawImage(
        img,
        sx,
        sy,
        frameSize.width,
        frameSize.height,
        0,
        0,
        frameSize.width * scale,
        frameSize.height * scale
      );
    }
  }, [currentFrame, imageLoaded, fighter.facingRight, scale, animConfig, frameSize]);

  // Show error state
  if (error) {
    return (
      <div
        className="absolute"
        style={{
          left: `${fighter.position.x}px`,
          bottom: `${fighter.position.y}px`,
          transform: 'translateX(-50%)',
        }}
      >
        <div className="text-red-500 text-xs bg-black bg-opacity-75 p-2 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  // Show loading state
  if (!imageLoaded) {
    return (
      <div
        className="absolute"
        style={{
          left: `${fighter.position.x}px`,
          bottom: `${fighter.position.y}px`,
          transform: 'translateX(-50%)',
        }}
      >
        <div className="text-white text-xs bg-black bg-opacity-75 p-2 rounded">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute"
      style={{
        left: `${fighter.position.x}px`,
        bottom: `${fighter.position.y + 50}px`,
        transform: 'translateX(-50%)',
      }}
    >
      <div className="relative" style={{ background: 'transparent' }}>
        <canvas
          ref={canvasRef}
          width={frameSize.width * scale}
          height={frameSize.height * scale}
          className={`fighter-canvas ${fighter.currentAction === 'BLOCKING' ? 'opacity-70' : ''}`}
          style={{
            imageRendering: 'pixelated',
            background: 'transparent',
            display: 'block'
          }}
        />
        {/* Damage flash overlay */}
        {damageFlash && (
          <div
            className="absolute inset-0 bg-red-500 opacity-50 pointer-events-none"
            style={{
              mixBlendMode: 'screen',
            }}
          />
        )}
      </div>
      {/* Debug info */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs text-white bg-black bg-opacity-75 px-2 py-1 rounded whitespace-nowrap">
        {fighter.currentAction} | Frame: {currentFrame}/{animConfig.frameCount - 1}
      </div>
    </div>
  );
}
