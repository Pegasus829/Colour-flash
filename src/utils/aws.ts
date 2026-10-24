import { fetchAuthSession } from '@aws-amplify/auth';
import type { Score } from '../types';

// Leaderboard calls go through the HTTP API. The browser has no DynamoDB credentials.
const apiUrl = (import.meta.env.VITE_AWS_API_URL || '').replace(/\/$/, '');

const isAwsConfigured = Boolean(apiUrl);

/**
 * Check if the leaderboard API is configured
 */
export function isAwsEnabled(): boolean {
  return isAwsConfigured;
}

interface CloudScore {
  playerName: string;
  score: number;
  level: number;
  date: number;
}

async function authHeader(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    return token || null;
  } catch (error) {
    console.error('Error reading auth session:', error);
    return null;
  }
}

function asCloudScore(value: unknown): CloudScore | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  if (typeof item.playerName !== 'string') return null;
  if (typeof item.score !== 'number' || !Number.isFinite(item.score)) return null;
  if (typeof item.level !== 'number' || !Number.isFinite(item.level)) return null;
  if (typeof item.date !== 'number' || !Number.isFinite(item.date)) return null;
  return {
    playerName: item.playerName,
    score: item.score,
    level: item.level,
    date: item.date,
  };
}

/**
 * Save a score. The API keys the row by the Cognito user and only keeps a higher score.
 */
export async function saveScoreToDynamoDB(score: Omit<Score, 'date'>): Promise<boolean> {
  if (!isAwsConfigured) {
    console.warn('AWS not configured - score not saved to cloud');
    return false;
  }

  try {
    const token = await authHeader();
    if (!token) {
      console.warn('Not signed in - score not saved to cloud');
      return false;
    }

    const response = await fetch(`${apiUrl}/scores`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerName: score.playerName,
        score: score.score,
        level: score.level,
      }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error saving score:', error);
    return false;
  }
}

/**
 * Get top scores from the public leaderboard API
 */
export async function getTopScoresFromDynamoDB(limitCount: number = 10): Promise<Score[]> {
  if (!isAwsConfigured) {
    console.warn('AWS not configured - returning empty scores');
    return [];
  }

  try {
    const response = await fetch(`${apiUrl}/scores?limit=${encodeURIComponent(String(limitCount))}`);
    if (!response.ok) {
      return [];
    }
    const body = (await response.json()) as { scores?: unknown };
    if (!Array.isArray(body.scores)) {
      return [];
    }
    return body.scores.flatMap((item) => {
      const score = asCloudScore(item);
      return score ? [score] : [];
    });
  } catch (error) {
    console.error('Error fetching scores:', error);
    return [];
  }
}

/**
 * Display names are not unique. The account id comes from the Cognito token.
 */
export async function isNameUniqueInDynamoDB(name: string): Promise<boolean> {
  // Display names are labels. The row key is the Cognito sub, so this does not scan.
  void name;
  return true;
}

/**
 * Best score for the signed-in player. The API reads that player's row only.
 */
export async function getMyBestFromDynamoDB(): Promise<CloudScore | null> {
  if (!isAwsConfigured) {
    return null;
  }

  try {
    const token = await authHeader();
    if (!token) {
      return null;
    }
    const response = await fetch(`${apiUrl}/scores/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      return null;
    }
    return asCloudScore(await response.json());
  } catch (error) {
    console.error('Error fetching player best score:', error);
    return null;
  }
}

/**
 * Get a player's best score from the leaderboard API
 */
export async function getPlayerBestScoreFromDynamoDB(playerName: string): Promise<number> {
  // The API returns the signed-in player's row. The name is only the local label.
  void playerName;
  const record = await getMyBestFromDynamoDB();
  return record?.score ?? 0;
}
