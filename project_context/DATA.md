# Data Reference

All CSVs live in `data/` and are loaded at runtime. Values are read as strings and parsed to numbers where expected.

## data/config.csv

- Schema: `key,value`
- Meaning: global tunables.
- Example rows:
  - `app_name,Fortis Fighter`

## data/characters.csv

- Schema: `id,name,health,sprite,special_name,special_damage,special_cooldown,attack_damage`
- Meaning: character definitions with stats and special moves
- Columns:
  - `id` (string): Unique character identifier
  - `name` (string): Display name
  - `health` (number): Starting HP
  - `sprite` (string): Filename in assets/ (e.g., "sprites_calvin.png")
  - `special_name` (string): Special attack display name
  - `special_damage` (number): Special attack damage
  - `special_cooldown` (number): Cooldown in milliseconds
  - `attack_damage` (number): Normal attack damage
- Validation:
  - `health` must be > 0
  - `special_damage` must be > `attack_damage`
  - `special_cooldown` must be >= 3000 (minimum 3 seconds)
- Example rows:
  - `calvin,Calvin,100,sprites_calvin.png,Deploy Bug,25,5000,10`
  - `steven,Steven,100,sprites_steve.png,Sync Call,20,4000,10`
  - `shawn,Shawn,100,sprites_shawn.png,Schedule Meeting,30,6000,10`
  - `jing,Jing,100,sprites_jing.png,Slack @channel,28,4500,10`

## data/combat.csv

- Schema: `key,value`
- Meaning: global combat parameters for balancing gameplay
- All values are numeric.
- Keys:
  - `base_attack_damage`: Default attack damage (number)
  - `block_damage_reduction`: Multiplier for blocked damage (0.5 = 50% reduction)
  - `attack_duration_ms`: How long attack state lasts (milliseconds)
  - `block_duration_ms`: How long block state lasts (milliseconds)
  - `ai_reaction_min_ms`: Minimum AI decision delay (milliseconds)
  - `ai_reaction_max_ms`: Maximum AI decision delay (milliseconds)
  - `ai_attack_weight`: Weight for AI attack action (higher = more likely)
  - `ai_block_weight`: Weight for AI block action
  - `ai_special_weight`: Weight for AI special action
  - `ai_idle_weight`: Weight for AI idle/move action
- Example configuration:
  ```csv
  key,value
  base_attack_damage,10
  block_damage_reduction,0.5
  attack_duration_ms,300
  block_duration_ms,500
  ai_reaction_min_ms,800
  ai_reaction_max_ms,2000
  ai_attack_weight,40
  ai_block_weight,30
  ai_special_weight,20
  ai_idle_weight,10
  ```

## data/visual_effects.csv

- Schema: `key,value`
- Meaning: visual polish parameters for screen shake, particles, animations
- Values are numeric except where noted.
- Keys:
  - `screen_shake_intensity`: Shake offset in pixels (number)
  - `screen_shake_duration_ms`: Shake duration (milliseconds)
  - `damage_flash_duration_ms`: Flash overlay duration (milliseconds)
  - `damage_flash_color`: Hex color (string, e.g., "#ff0000")
  - `particle_count_hit`: Particles spawned on normal hit (number)
  - `particle_count_special`: Particles spawned on special hit (number)
  - `health_bar_transition_ms`: CSS transition duration for health bar width (milliseconds)
  - `idle_animation_speed_ms`: Time per frame for idle animation (milliseconds)
  - `attack_animation_speed_ms`: Time per frame for attack animation (milliseconds)
- Example configuration:
  ```csv
  key,value
  screen_shake_intensity,8
  screen_shake_duration_ms,200
  damage_flash_duration_ms,150
  damage_flash_color,#ff0000
  particle_count_hit,8
  particle_count_special,15
  health_bar_transition_ms,300
  idle_animation_speed_ms,500
  attack_animation_speed_ms,100
  ```

## Asset References

### Sprites (served from data/)
- `sprites_calvin2.png` - Calvin character sprite sheet (5 rows × 3 frames)
- `sprites_steve2.png` - Steven character sprite sheet (5 rows × 3 frames)
- `sprites_shawn2.png` - Shawn character sprite sheet (5 rows × 3 frames)
- `sprites_jing2.png` - Jing character sprite sheet (5 rows × 3 frames)
- `background_fortis.png` - Fighting stage background

Note: Original files are in `assets/` folder, copied to `data/` for Vite to serve (publicDir).

#### Sprite Sheet Structure
All character sprite sheets follow the same layout:
- 5 rows × 3 frames per row
- Row 0: Idle animation
- Row 1: Walking animation
- Row 2: Basic attack animation
- Row 3: Special attack animation
- Row 4: Hit reaction animation

## Validation rules

- When adding a new CSV, document its schema and constraints in this file.
- Use fail-fast validation in `loadData.ts` — missing required columns should throw on load, not fail silently at runtime.
- Numeric values must parse correctly or throw descriptive errors.
- Character stats must respect validation rules (health > 0, special_damage > attack_damage, etc.)
