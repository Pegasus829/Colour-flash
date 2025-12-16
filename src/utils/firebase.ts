import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import type { Score } from '../types';

// Firebase configuration - uses environment variables
// Set these in your .env file or deployment environment
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Check if Firebase is configured
const isFirebaseConfigured = Boolean(firebaseConfig.projectId);

// Initialize Firebase only if configured
const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
const db = app ? getFirestore(app) : null;

const SCORES_COLLECTION = 'scores';

export interface FirestoreScore {
  playerName: string;
  score: number;
  date: Timestamp;
}

/**
 * Check if Firebase is properly configured
 */
export function isFirebaseEnabled(): boolean {
  return isFirebaseConfigured && db !== null;
}

/**
 * Save a score to Firestore
 */
export async function saveScoreToFirestore(score: Omit<Score, 'date'>): Promise<boolean> {
  if (!db) {
    console.warn('Firebase not configured - score not saved to cloud');
    return false;
  }

  try {
    await addDoc(collection(db, SCORES_COLLECTION), {
      playerName: score.playerName,
      score: score.score,
      date: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error('Error saving score to Firestore:', error);
    return false;
  }
}

/**
 * Get top scores from Firestore
 */
export async function getTopScoresFromFirestore(limitCount: number = 10): Promise<Score[]> {
  if (!db) {
    console.warn('Firebase not configured - returning empty scores');
    return [];
  }

  try {
    const scoresRef = collection(db, SCORES_COLLECTION);
    const q = query(scoresRef, orderBy('score', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data() as FirestoreScore;
      return {
        playerName: data.playerName,
        score: data.score,
        date: data.date?.toMillis() || Date.now(),
      };
    });
  } catch (error) {
    console.error('Error fetching scores from Firestore:', error);
    return [];
  }
}

/**
 * Check if a player name already exists in the leaderboard
 */
export async function isNameUniqueInFirestore(name: string): Promise<boolean> {
  if (!db) {
    return true; // If Firebase not configured, allow any name
  }

  try {
    const scoresRef = collection(db, SCORES_COLLECTION);
    // Firestore doesn't support case-insensitive queries natively,
    // so we store a normalized name field or query all and filter
    const q = query(scoresRef, where('playerName', '==', name), limit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return false;
    }

    // Also check case-insensitive by querying recent scores
    // For better performance, consider storing a normalized name field
    const topScores = await getTopScoresFromFirestore(100);
    const normalizedName = name.toLowerCase().trim();
    return !topScores.some(
      (s) => s.playerName.toLowerCase().trim() === normalizedName
    );
  } catch (error) {
    console.error('Error checking name uniqueness:', error);
    return true; // Allow on error to not block the user
  }
}

/**
 * Get a player's best score from Firestore
 */
export async function getPlayerBestScoreFromFirestore(playerName: string): Promise<number> {
  if (!db) {
    return 0;
  }

  try {
    const scoresRef = collection(db, SCORES_COLLECTION);
    const q = query(
      scoresRef,
      where('playerName', '==', playerName),
      orderBy('score', 'desc'),
      limit(1)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return 0;
    }

    const data = snapshot.docs[0].data() as FirestoreScore;
    return data.score;
  } catch (error) {
    console.error('Error fetching player best score:', error);
    return 0;
  }
}
