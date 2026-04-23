# Architecture Map

## Key files

- `app/index.html`: Vite entry HTML.
- `app/src/main.tsx`: React entry point.
- `app/src/App.tsx`: Main app shell, game state orchestration, UI layout.
- `app/src/styles.css`: Tailwind base, theme variables, viewport management (app-shell/game-screen/app-screen).
- `app/src/data/loadData.ts`: CSV loading + validation.
- `data/config.csv`: Global tunables (HP, AI delay, damage reduction).
- `data/characters.csv`: Character stats and special moves.

## Game Engine Structure

Planned files in `app/src/engine/`:

- `gameState.ts`: Core game state (HP, positions, cooldowns, current actions)
- `combat.ts`: Combat logic (damage calculation, blocking, specials)
- `ai.ts`: AI decision-making (random actions with delays)
- `input.ts`: Keyboard input handling (A/S/D + arrows)
- `effects.ts`: Visual effects (screen shake, particles, flashes)

## React Component Structure

Planned files in `app/src/components/`:

- `Game.tsx`: Main game canvas/container, renders fighters and background
- `Fighter.tsx`: Character display (sprite, animations, effects)
- `HealthBar.tsx`: HP display with smooth transitions
- `CharacterSelect.tsx`: Pre-game character selection screen
- `GameOver.tsx`: End screen with winner/loser display

## Data flow

1. **Initialization:**
   - Load CSVs (`config.csv`, `characters.csv`) via `loadData.ts`
   - Player selects character
   - Initialize game state with loaded character data

2. **Game Loop:**
   - Input handler captures player actions → updates game state
   - AI logic runs on timer → updates opponent state
   - Combat system resolves actions → calculates damage
   - React state updates trigger re-renders
   - Effects system applies visual feedback

3. **State Management:**
   - Game state in React state (or useReducer for complex state)
   - Character data from CSV (immutable reference)
   - Cooldowns and timers tracked in state

## Where to change things

- **Game balance:** `data/config.csv`, `data/characters.csv`
- **Combat rules:** `app/src/engine/combat.ts`
- **AI behavior:** `app/src/engine/ai.ts`
- **Visual effects:** `app/src/engine/effects.ts`
- **UI/Layout:** `app/src/components/*`, `app/src/styles.css`
- **Controls:** `app/src/engine/input.ts`

## Asset Loading

- Game assets (sprites, backgrounds) are in `data/` folder
- Vite's `publicDir` is set to `../data`, so files are served at root URL
- Sprites referenced as `/sprites_calvin.png` in code
- Original high-res assets can be kept in `assets/` for reference
- Loaded via standard image tags or canvas drawImage
