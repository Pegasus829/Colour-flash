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
export const COLOR_TIMER_DECREMENT = 0.08; // decrease per successful match
