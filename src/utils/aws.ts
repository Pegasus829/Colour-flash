import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';
import type { Score } from '../types';

// AWS Configuration - uses environment variables
const region = import.meta.env.VITE_AWS_REGION || '';
const identityPoolId = import.meta.env.VITE_AWS_IDENTITY_POOL_ID || '';
const tableName = import.meta.env.VITE_AWS_DYNAMODB_TABLE || '';

// Check if AWS is configured
const isAwsConfigured = Boolean(region && identityPoolId && tableName);

// Initialize DynamoDB client with Cognito Identity Pool credentials (unauthenticated)
let docClient: DynamoDBDocumentClient | null = null;

if (isAwsConfigured) {
  const dynamoClient = new DynamoDBClient({
    region,
    credentials: fromCognitoIdentityPool({
      clientConfig: { region },
      identityPoolId,
    }),
  });

  docClient = DynamoDBDocumentClient.from(dynamoClient, {
    marshallOptions: {
      removeUndefinedValues: true,
    },
  });
}

/**
 * Check if AWS is properly configured
 */
export function isAwsEnabled(): boolean {
  return isAwsConfigured && docClient !== null;
}

/**
 * Save a score to DynamoDB
 */
export async function saveScoreToDynamoDB(score: Omit<Score, 'date'>): Promise<boolean> {
  if (!docClient) {
    console.warn('AWS not configured - score not saved to cloud');
    return false;
  }

  try {
    const timestamp = Date.now();
    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          pk: 'SCORE',
          sk: `${timestamp}#${score.playerName}`,
          playerName: score.playerName,
          score: score.score,
          date: timestamp,
          // GSI for querying by score (for leaderboard)
          gsi1pk: 'LEADERBOARD',
          gsi1sk: score.score,
        },
      })
    );
    return true;
  } catch (error) {
    console.error('Error saving score to DynamoDB:', error);
    return false;
  }
}

/**
 * Get top scores from DynamoDB
 */
export async function getTopScoresFromDynamoDB(limitCount: number = 10): Promise<Score[]> {
  if (!docClient) {
    console.warn('AWS not configured - returning empty scores');
    return [];
  }

  try {
    // Scan and sort client-side (for simplicity without GSI)
    // For production, use a GSI with score as sort key
    const result = await docClient.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: 'pk = :pk',
        ExpressionAttributeValues: {
          ':pk': 'SCORE',
        },
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return [];
    }

    // Sort by score descending and take top N
    const scores = result.Items.map((item) => ({
      playerName: item.playerName as string,
      score: item.score as number,
      date: item.date as number,
    }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limitCount);

    return scores;
  } catch (error) {
    console.error('Error fetching scores from DynamoDB:', error);
    return [];
  }
}

/**
 * Check if a player name already exists in the leaderboard
 */
export async function isNameUniqueInDynamoDB(name: string): Promise<boolean> {
  if (!docClient) {
    return true; // If AWS not configured, allow any name
  }

  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: 'pk = :pk',
        ExpressionAttributeValues: {
          ':pk': 'SCORE',
        },
        ProjectionExpression: 'playerName',
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return true;
    }

    const normalizedName = name.toLowerCase().trim();
    return !result.Items.some(
      (item) => (item.playerName as string).toLowerCase().trim() === normalizedName
    );
  } catch (error) {
    console.error('Error checking name uniqueness:', error);
    return true; // Allow on error to not block the user
  }
}

/**
 * Get a player's best score from DynamoDB
 */
export async function getPlayerBestScoreFromDynamoDB(playerName: string): Promise<number> {
  if (!docClient) {
    return 0;
  }

  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: 'pk = :pk AND playerName = :name',
        ExpressionAttributeValues: {
          ':pk': 'SCORE',
          ':name': playerName,
        },
        ProjectionExpression: 'score',
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return 0;
    }

    return Math.max(...result.Items.map((item) => item.score as number));
  } catch (error) {
    console.error('Error fetching player best score:', error);
    return 0;
  }
}
