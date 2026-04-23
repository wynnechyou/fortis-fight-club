/**
 * Generic CSV loader with header validation.
 *
 * Files in data/ are served at root by Vite (publicDir = "../data"),
 * so data/config.csv is fetched as /config.csv.
 */

export interface CsvRow {
  [column: string]: string;
}

export async function loadCsv(
  path: string,
  requiredColumns?: string[]
): Promise<CsvRow[]> {
  const res = await fetch(`/${path}`);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  const text = await res.text();
  const lines = text.trim().split("\n");
  if (lines.length === 0) throw new Error(`${path} is empty`);

  const header = lines[0].split(",").map((h) => h.trim());

  // Fail-fast: validate required columns
  if (requiredColumns) {
    for (const col of requiredColumns) {
      if (!header.includes(col)) {
        throw new Error(`${path}: missing required column "${col}"`);
      }
    }
  }

  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row: CsvRow = {};
    header.forEach((col, i) => {
      row[col] = values[i]?.trim() ?? "";
    });
    return row;
  });
}

export async function loadConfig(): Promise<Map<string, string>> {
  const rows = await loadCsv("config.csv", ["key", "value"]);
  return new Map(rows.map((r) => [r.key, r.value]));
}

// Game-specific loaders

import type { Character, CombatConfig, VisualConfig, GameData } from '../types/game';

export async function loadCharacters(): Promise<Character[]> {
  const rows = await loadCsv('characters.csv', [
    'id',
    'name',
    'health',
    'sprite',
    'special_name',
    'special_damage',
    'special_cooldown',
    'attack_damage',
  ]);

  return rows.map((r) => {
    const health = parseInt(r.health, 10);
    const specialDamage = parseInt(r.special_damage, 10);
    const specialCooldown = parseInt(r.special_cooldown, 10);
    const attackDamage = parseInt(r.attack_damage, 10);

    // Validation
    if (health <= 0) {
      throw new Error(`Character ${r.id}: health must be > 0, got ${health}`);
    }
    if (specialDamage <= attackDamage) {
      throw new Error(
        `Character ${r.id}: special_damage (${specialDamage}) must be > attack_damage (${attackDamage})`
      );
    }
    if (specialCooldown < 3000) {
      throw new Error(
        `Character ${r.id}: special_cooldown must be >= 3000ms, got ${specialCooldown}`
      );
    }

    return {
      id: r.id,
      name: r.name,
      health,
      sprite: r.sprite,
      specialName: r.special_name,
      specialDamage,
      specialCooldown,
      attackDamage,
    };
  });
}

export async function loadCombatConfig(): Promise<CombatConfig> {
  const rows = await loadCsv('combat.csv', ['key', 'value']);
  const config: any = {};

  for (const row of rows) {
    config[row.key] = parseFloat(row.value);
  }

  // Validate all required keys are present
  const requiredKeys = [
    'base_attack_damage',
    'block_damage_reduction',
    'attack_duration_ms',
    'block_duration_ms',
    'ai_reaction_min_ms',
    'ai_reaction_max_ms',
    'ai_attack_weight',
    'ai_block_weight',
    'ai_special_weight',
    'ai_idle_weight',
  ];

  for (const key of requiredKeys) {
    if (!(key in config)) {
      throw new Error(`combat.csv: missing required key "${key}"`);
    }
  }

  return config as CombatConfig;
}

export async function loadVisualConfig(): Promise<VisualConfig> {
  const rows = await loadCsv('visual_effects.csv', ['key', 'value']);
  const config: any = {};

  for (const row of rows) {
    // Special handling for color (string value)
    if (row.key === 'damage_flash_color') {
      config[row.key] = row.value;
    } else {
      config[row.key] = parseFloat(row.value);
    }
  }

  // Validate all required keys are present
  const requiredKeys = [
    'screen_shake_intensity',
    'screen_shake_duration_ms',
    'damage_flash_duration_ms',
    'damage_flash_color',
    'particle_count_hit',
    'particle_count_special',
    'health_bar_transition_ms',
    'idle_animation_speed_ms',
    'attack_animation_speed_ms',
  ];

  for (const key of requiredKeys) {
    if (!(key in config)) {
      throw new Error(`visual_effects.csv: missing required key "${key}"`);
    }
  }

  return config as VisualConfig;
}

export async function loadGameData(): Promise<GameData> {
  const [characters, combatConfig, visualConfig] = await Promise.all([
    loadCharacters(),
    loadCombatConfig(),
    loadVisualConfig(),
  ]);

  return {
    characters,
    combatConfig,
    visualConfig,
  };
}
