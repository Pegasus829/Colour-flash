export type GameColor =
  | 'red'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'purple'
  | 'orange'
  | 'pink'
  | 'cyan';

export interface Player {
  name: string;
  createdAt: number;
}

export interface Score {
  playerName: string;
  score: number;
  level: number;
  date: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  darkMode: boolean;
}

export type GameScreen =
  | 'welcome'
  | 'instructions'
  | 'home'
  | 'playing'
  | 'levelUp'
  | 'gameOver'
  | 'profile';

export interface GameState {
  screen: GameScreen;
  score: number;
  timeRemaining: number;
  currentColor: GameColor;
  speed: number;
  isPlaying: boolean;
}

export const GAME_COLORS: GameColor[] = [
  'red',
  'blue',
  'green',
  'yellow',
  'purple',
  'orange',
  'pink',
  'cyan'
];

export const COLOR_VALUES: Record<GameColor, string> = {
  red: '#EF4444',
  blue: '#3B82F6',
  green: '#22C55E',
  yellow: '#EAB308',
  purple: '#A855F7',
  orange: '#F97316',
  pink: '#EC4899',
  cyan: '#06B6D4',
};

export const COLOR_NAMES: Record<GameColor, string> = {
  red: 'Red',
  blue: 'Blue',
  green: 'Green',
  yellow: 'Yellow',
  purple: 'Purple',
  orange: 'Orange',
  pink: 'Pink',
  cyan: 'Cyan',
};

export const GAME_DURATION = 60; // seconds
export const INITIAL_SPEED = 1;
export const MAX_SPEED = 3;
export const SPEED_INCREMENT = 0.05;

// Color selection timer settings
export const INITIAL_COLOR_TIMER = 4; // seconds to select each color
export const MIN_COLOR_TIMER = 1.2; // minimum seconds (floor)
export const COLOR_TIMER_DECREMENT = 0.02; // small decrease per successful match within level

// Level system settings
export const MATCHES_PER_LEVEL = 20; // number of matches needed to level up
export const INITIAL_LEVEL = 1;
export const COLORS_PER_LEVEL = [
  3, // Level 1: 3 colors
  4, // Level 2: 4 colors
  5, // Level 3: 5 colors
  6, // Level 4: 6 colors
  7, // Level 5: 7 colors
  8, // Level 6+: all 8 colors
];

/**
 * Calculate timer duration for a given level
 * - Levels 1-10: Faster progression from 4.5s to 2s
 * - Levels 11+: Continues to speed up to minimum of 1.2s
 */
export function getTimerForLevel(level: number): number {
  if (level <= 10) {
    // Faster curve for first 10 levels: 4.5s -> 2s
    // Formula: 4.5 - (level - 1) * 0.28
    return Math.max(2, 4.5 - (level - 1) * 0.28);
  } else {
    // Continue speeding up after level 10: 2s -> 1.2s
    // Formula: 2 - (level - 10) * 0.08
    return Math.max(1.2, 2 - (level - 10) * 0.08);
  }
}
