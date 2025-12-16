import type { Player, Score, GameSettings } from '../types';
import {
  isAwsEnabled,
  saveScoreToDynamoDB,
  getTopScoresFromDynamoDB,
  isNameUniqueInDynamoDB,
  getPlayerBestScoreFromDynamoDB,
} from './aws';

const PLAYER_KEY = 'colorMatchRush_player';
const SCORES_KEY = 'colorMatchRush_scores';
const SETTINGS_KEY = 'colorMatchRush_settings';

// Re-export AWS check (aliased for compatibility with existing code)
export { isAwsEnabled as isFirebaseEnabled };

// Cookie utilities for session storage
export function setCookie(name: string, value: string, days: number = 30): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
}

export function getCookie(name: string): string | null {
  const nameEQ = `${name}=`;
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const c = cookie.trim();
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length));
    }
  }
  return null;
}

export function deleteCookie(name: string): void {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

// Player management
export function getPlayer(): Player | null {
  const playerJson = getCookie(PLAYER_KEY);
  if (!playerJson) return null;
  try {
    return JSON.parse(playerJson);
  } catch {
    return null;
  }
}

export function setPlayer(player: Player): void {
  setCookie(PLAYER_KEY, JSON.stringify(player));
}

export function clearPlayer(): void {
  deleteCookie(PLAYER_KEY);
}

// Scores management (localStorage for persistence across sessions)
export function getScores(): Score[] {
  try {
    const scores = localStorage.getItem(SCORES_KEY);
    return scores ? JSON.parse(scores) : [];
  } catch {
    return [];
  }
}

export function saveScore(score: Score): void {
  const scores = getScores();
  scores.push(score);
  // Sort by score descending and keep top 100
  scores.sort((a, b) => b.score - a.score);
  const topScores = scores.slice(0, 100);
  localStorage.setItem(SCORES_KEY, JSON.stringify(topScores));
}

export function getTopScores(limit: number = 10): Score[] {
  const scores = getScores();
  return scores.slice(0, limit);
}

export function isNameUnique(name: string): boolean {
  const scores = getScores();
  const normalizedName = name.toLowerCase().trim();
  return !scores.some(s => s.playerName.toLowerCase().trim() === normalizedName);
}

export function getPlayerBestScore(playerName: string): number {
  const scores = getScores();
  const playerScores = scores.filter(
    s => s.playerName.toLowerCase() === playerName.toLowerCase()
  );
  if (playerScores.length === 0) return 0;
  return Math.max(...playerScores.map(s => s.score));
}

// Settings management
export function getSettings(): GameSettings {
  try {
    const settings = localStorage.getItem(SETTINGS_KEY);
    if (settings) {
      return JSON.parse(settings);
    }
  } catch {
    // ignore
  }
  return {
    soundEnabled: true,
    darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
  };
}

export function saveSettings(settings: GameSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ============================================
// Async AWS-backed functions (for centralized leaderboard)
// These functions use AWS DynamoDB when configured, with local fallback
// ============================================

/**
 * Save a score - uses AWS if configured, otherwise local storage
 */
export async function saveScoreAsync(score: Score): Promise<void> {
  // Always save locally first for offline support
  saveScore(score);

  // Also save to AWS DynamoDB if configured
  if (isAwsEnabled()) {
    await saveScoreToDynamoDB({
      playerName: score.playerName,
      score: score.score,
    });
  }
}

/**
 * Get top scores - uses AWS if configured, otherwise local storage
 */
export async function getTopScoresAsync(limitCount: number = 10): Promise<Score[]> {
  if (isAwsEnabled()) {
    const awsScores = await getTopScoresFromDynamoDB(limitCount);
    if (awsScores.length > 0) {
      return awsScores;
    }
  }
  // Fallback to local storage
  return getTopScores(limitCount);
}

/**
 * Check if name is unique - uses AWS if configured, otherwise local storage
 */
export async function isNameUniqueAsync(name: string): Promise<boolean> {
  if (isAwsEnabled()) {
    return isNameUniqueInDynamoDB(name);
  }
  // Fallback to local storage
  return isNameUnique(name);
}

/**
 * Get player's best score - uses AWS if configured, otherwise local storage
 */
export async function getPlayerBestScoreAsync(playerName: string): Promise<number> {
  if (isAwsEnabled()) {
    const awsScore = await getPlayerBestScoreFromDynamoDB(playerName);
    const localScore = getPlayerBestScore(playerName);
    // Return the higher of the two (in case of offline play)
    return Math.max(awsScore, localScore);
  }
  return getPlayerBestScore(playerName);
}
