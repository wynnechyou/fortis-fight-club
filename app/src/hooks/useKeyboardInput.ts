import { useEffect, useRef } from 'react';

export interface InputState {
  // Movement
  ArrowLeft: boolean;
  ArrowRight: boolean;
  ArrowUp: boolean;
  ArrowDown: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
  w: boolean;
  // Actions
  space: boolean; // Jump
  shift: boolean; // Block
  leftClick: boolean; // Basic attack
  rightClick: boolean; // Special attack
}

export function useKeyboardInput(onInput: (inputs: InputState) => void) {
  const inputsRef = useRef<InputState>({
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Map keys to input state
      if (key === 'arrowleft' || key === 'a') {
        inputsRef.current.ArrowLeft = true;
        inputsRef.current.a = true;
      } else if (key === 'arrowright' || key === 'd') {
        inputsRef.current.ArrowRight = true;
        inputsRef.current.d = true;
      } else if (key === 'arrowup' || key === 'w') {
        inputsRef.current.ArrowUp = true;
        inputsRef.current.w = true;
      } else if (key === 'arrowdown' || key === 's') {
        inputsRef.current.ArrowDown = true;
        inputsRef.current.s = true;
      } else if (key === ' ') {
        e.preventDefault();
        inputsRef.current.space = true;
      } else if (key === 'shift') {
        inputsRef.current.shift = true;
      }

      onInput(inputsRef.current);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (key === 'arrowleft' || key === 'a') {
        inputsRef.current.ArrowLeft = false;
        inputsRef.current.a = false;
      } else if (key === 'arrowright' || key === 'd') {
        inputsRef.current.ArrowRight = false;
        inputsRef.current.d = false;
      } else if (key === 'arrowup' || key === 'w') {
        inputsRef.current.ArrowUp = false;
        inputsRef.current.w = false;
      } else if (key === 'arrowdown' || key === 's') {
        inputsRef.current.ArrowDown = false;
        inputsRef.current.s = false;
      } else if (key === ' ') {
        inputsRef.current.space = false;
      } else if (key === 'shift') {
        inputsRef.current.shift = false;
      }

      onInput(inputsRef.current);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        // Left click
        inputsRef.current.leftClick = true;
        onInput(inputsRef.current);
      } else if (e.button === 2) {
        // Right click
        e.preventDefault();
        inputsRef.current.rightClick = true;
        onInput(inputsRef.current);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        inputsRef.current.leftClick = false;
        onInput(inputsRef.current);
      } else if (e.button === 2) {
        inputsRef.current.rightClick = false;
        onInput(inputsRef.current);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [onInput]);

  return inputsRef;
}
