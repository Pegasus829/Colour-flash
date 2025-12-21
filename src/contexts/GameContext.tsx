import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type {
  GameScreen,
  GameColor,
  GameSettings,
  Player,
  Score,
} from '../types';
import {
  GAME_COLORS,
  GAME_DURATION,
  INITIAL_SPEED,
  MAX_SPEED,
  SPEED_INCREMENT,
  MIN_COLOR_TIMER,
  COLOR_TIMER_DECREMENT,
  MATCHES_PER_LEVEL,
  INITIAL_LEVEL,
  COLORS_PER_LEVEL,
  getTimerForLevel,
} from '../types';
import {
  setPlayer as savePlayer,
  clearPlayer,
  getSettings,
  saveSettings as persistSettings,
  saveScoreAsync,
  getTopScoresAsync,
  getPlayerBestRecordAsync,
  isFirebaseEnabled,
} from '../utils/storage';
import {
  playCorrectSound,
  playWrongSound,
  playGameOverSound,
  playTickSound,
  resumeAudioContext,
} from '../utils/sound';
import {
  getAuthenticatedUser,
  signInWithEmail as authSignInWithEmail,
  signUpWithEmail as authSignUpWithEmail,
  confirmSignUpWithCode as authConfirmSignUp,
  signOutUser,
  onAuthStateChange,
  updateDisplayName,
  changePassword as authChangePassword,
  type AuthUser,
} from '../utils/auth';

interface GameContextType {
  // Player
  player: Player | null;
  logout: () => void;
  playerBestScore: number;
  playerBestLevel: number;
  updatePlayerName: (name: string) => Promise<void>;

  // Auth
  authUser: AuthUser | null;
  isAuthLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<{ needsConfirmation: boolean }>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;

  // Game state
  screen: GameScreen;
  setScreen: (screen: GameScreen) => void;
  score: number;
  timeRemaining: number;
  currentColor: GameColor;
  speed: number;
  isPlaying: boolean;
  colorTimer: number;
  colorTimerMax: number;
  level: number;
  matchesInCurrentLevel: number;
  comboCount: number;

  // Game actions
  startGame: () => void;
  handleColorClick: (color: GameColor) => void;
  endGame: () => void;
  continuePlaying: () => void;

  // Settings
  settings: GameSettings;
  toggleSound: () => void;
  toggleDarkMode: () => void;

  // Leaderboard
  topScores: Score[];
  isLoadingScores: boolean;
  isOnlineLeaderboard: boolean;
  refreshScores: () => Promise<void>;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  // Player state
  const [player, setPlayer] = useState<Player | null>(null);
  const [playerBestScore, setPlayerBestScore] = useState(0);
  const [playerBestLevel, setPlayerBestLevel] = useState(0);

  // Auth state
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Game state
  const [screen, setScreen] = useState<GameScreen>('welcome');
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION);
  const [currentColor, setCurrentColor] = useState<GameColor>('red');
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [isPlaying, setIsPlaying] = useState(false);
  const [colorTimer, setColorTimer] = useState(getTimerForLevel(INITIAL_LEVEL));
  const [colorTimerMax, setColorTimerMax] = useState(getTimerForLevel(INITIAL_LEVEL));
  const [level, setLevel] = useState(INITIAL_LEVEL);
  const [matchesInCurrentLevel, setMatchesInCurrentLevel] = useState(0);
  const [comboCount, setComboCount] = useState(0);

  // Settings
  const [settings, setSettings] = useState<GameSettings>(getSettings);

  // Leaderboard
  const [topScores, setTopScores] = useState<Score[]>([]);
  const [isLoadingScores, setIsLoadingScores] = useState(true);
  const isOnlineLeaderboard = isFirebaseEnabled();

  // Timer refs
  const timerRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const colorTimerExpiredRef = useRef<boolean>(false);

  // Initialize from storage and check auth
  useEffect(() => {
    const initializeData = async () => {
      setIsLoadingScores(true);
      setIsAuthLoading(true);

      // Check for authenticated user
      const authenticatedUser = await getAuthenticatedUser();
      if (authenticatedUser) {
        setAuthUser(authenticatedUser);
        // Use auth user's name as player
        const authPlayer: Player = {
          name: authenticatedUser.name,
          createdAt: Date.now(),
        };
        savePlayer(authPlayer);
        setPlayer(authPlayer);
        const bestRecord = await getPlayerBestRecordAsync(authenticatedUser.name);
        setPlayerBestScore(bestRecord.score);
        setPlayerBestLevel(bestRecord.level);
        setScreen('home');
      }
      setIsAuthLoading(false);

      const scores = await getTopScoresAsync(10);
      setTopScores(scores);
      setIsLoadingScores(false);
    };
    initializeData();

    // Listen for auth state changes
    const unsubscribe = onAuthStateChange(async (event, user) => {
      if (event === 'signIn' && user) {
        setAuthUser(user);
        const authPlayer: Player = {
          name: user.name,
          createdAt: Date.now(),
        };
        savePlayer(authPlayer);
        setPlayer(authPlayer);
        const bestRecord = await getPlayerBestRecordAsync(user.name);
        setPlayerBestScore(bestRecord.score);
        setPlayerBestLevel(bestRecord.level);
        setScreen('home');
      } else if (event === 'signOut') {
        setAuthUser(null);
      }
    });
    return unsubscribe;
  }, []);

  // Apply dark mode
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // Game timer
  useEffect(() => {
    if (isPlaying && timeRemaining > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 0.1;

          // Play tick sound every second
          if (settings.soundEnabled) {
            const currentSecond = Math.ceil(newTime);
            if (currentSecond !== lastTickRef.current && currentSecond <= 10 && currentSecond > 0) {
              lastTickRef.current = currentSecond;
              playTickSound();
            }
          }

          if (newTime <= 0) {
            return 0;
          }
          return newTime;
        });

        // Decrease color timer
        setColorTimer((prev: number) => {
          const newColorTime = prev - 0.1;
          if (newColorTime <= 0 && !colorTimerExpiredRef.current) {
            colorTimerExpiredRef.current = true;
            return 0;
          }
          return Math.max(0, newColorTime);
        });

        // Increase speed over time
        setSpeed((prev) => Math.min(prev + SPEED_INCREMENT / 10, MAX_SPEED));
      }, 100);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    } else if (isPlaying && timeRemaining <= 0) {
      endGame();
    }
  }, [isPlaying, timeRemaining, settings.soundEnabled]);

  // Handle color timer expiration
  useEffect(() => {
    if (isPlaying && colorTimer <= 0 && colorTimerExpiredRef.current) {
      // Time ran out for this color - end game
      setIsPlaying(false);
      if (settings.soundEnabled) {
        playWrongSound();
        setTimeout(() => {
          playGameOverSound();
        }, 400);
      }
      // Save score and transition to game over
      const saveAndUpdate = async () => {
        if (player && score > 0) {
          await saveScoreAsync({
            playerName: player.name,
            score,
            level,
            date: Date.now(),
          });
          const scores = await getTopScoresAsync(10);
          setTopScores(scores);
          const bestRecord = await getPlayerBestRecordAsync(player.name);
          setPlayerBestScore(bestRecord.score);
          setPlayerBestLevel(bestRecord.level);
        }
      };
      saveAndUpdate();
      setScreen('gameOver');
      colorTimerExpiredRef.current = false;
    }
  }, [isPlaying, colorTimer, settings.soundEnabled, player, score, level]);

  const getColorsForLevel = useCallback((currentLevel: number): GameColor[] => {
    const numColors = COLORS_PER_LEVEL[Math.min(currentLevel - 1, COLORS_PER_LEVEL.length - 1)];
    return GAME_COLORS.slice(0, numColors);
  }, []);

  const getRandomColor = useCallback((currentLevel: number): GameColor => {
    const levelColors = getColorsForLevel(currentLevel);
    const availableColors = levelColors.filter((c) => c !== currentColor);
    return availableColors[Math.floor(Math.random() * availableColors.length)];
  }, [currentColor, getColorsForLevel]);

  const logout = useCallback(async () => {
    // Sign out from Cognito if authenticated
    if (authUser) {
      await signOutUser();
      setAuthUser(null);
    }
    clearPlayer();
    setPlayer(null);
    setPlayerBestScore(0);
    setPlayerBestLevel(0);
    setScreen('welcome');
  }, [authUser]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const user = await authSignInWithEmail(email, password);
    setAuthUser(user);
    const authPlayer: Player = {
      name: user.name,
      createdAt: Date.now(),
    };
    savePlayer(authPlayer);
    setPlayer(authPlayer);
    const bestRecord = await getPlayerBestRecordAsync(user.name);
    setPlayerBestScore(bestRecord.score);
    setPlayerBestLevel(bestRecord.level);
    setScreen('home');
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string, name: string) => {
    return authSignUpWithEmail(email, password, name);
  }, []);

  const confirmSignUp = useCallback(async (email: string, code: string) => {
    await authConfirmSignUp(email, code);
  }, []);

  const updatePlayerName = useCallback(async (name: string) => {
    if (authUser) {
      // Update name in Cognito
      await updateDisplayName(name);
      // Update local auth user state
      setAuthUser({ ...authUser, name });
    }
    // Update player state
    const updatedPlayer: Player = {
      name,
      createdAt: player?.createdAt || Date.now(),
    };
    savePlayer(updatedPlayer);
    setPlayer(updatedPlayer);
  }, [authUser, player]);

  const changePassword = useCallback(async (oldPassword: string, newPassword: string) => {
    await authChangePassword(oldPassword, newPassword);
  }, []);

  const startGame = useCallback(() => {
    resumeAudioContext();
    setScore(0);
    setTimeRemaining(GAME_DURATION);
    setSpeed(INITIAL_SPEED);
    setLevel(INITIAL_LEVEL);
    setMatchesInCurrentLevel(0);
    setComboCount(0);
    const levelColors = getColorsForLevel(INITIAL_LEVEL);
    setCurrentColor(levelColors[Math.floor(Math.random() * levelColors.length)]);
    const initialTimer = getTimerForLevel(INITIAL_LEVEL);
    setColorTimer(initialTimer);
    setColorTimerMax(initialTimer);
    colorTimerExpiredRef.current = false;
    setIsPlaying(true);
    setScreen('playing');
    lastTickRef.current = GAME_DURATION;
  }, [getColorsForLevel]);

  const handleColorClick = useCallback(
    (color: GameColor) => {
      if (!isPlaying) return;

      resumeAudioContext();

      if (color === currentColor) {
        // Correct match
        // Check if selection was made within 1 second for combo bonus
        const isFastClick = colorTimer > (colorTimerMax - 1);

        // Update combo count
        if (isFastClick) {
          setComboCount((prev) => prev + 1);
        } else {
          setComboCount(0);
        }

        // Calculate score with combo multiplier
        // Base: 1x, Each combo level adds 0.5x (1.5x, 2x, 2.5x, etc.)
        const comboMultiplier = isFastClick ? 1 + (comboCount + 1) * 0.5 : 1;
        const points = Math.round(10 * speed * comboMultiplier);
        setScore((prev) => prev + points);

        setMatchesInCurrentLevel((prev) => {
          const newMatches = prev + 1;

          // Check if player should level up
          if (newMatches >= MATCHES_PER_LEVEL) {
            setLevel((currentLevel) => {
              const newLevel = currentLevel + 1;
              setCurrentColor(getRandomColor(newLevel));
              // Reset timer to new level's base time
              const newLevelTimer = getTimerForLevel(newLevel);
              setColorTimer(newLevelTimer);
              setColorTimerMax(newLevelTimer);
              return newLevel;
            });
            setIsPlaying(false);
            setScreen('levelUp');
            return 0; // Reset matches for new level
          } else {
            setCurrentColor(getRandomColor(level));
            // Reset and slightly decrement color timer for next color
            const newTimerMax = Math.max(MIN_COLOR_TIMER, colorTimerMax - COLOR_TIMER_DECREMENT);
            setColorTimerMax(newTimerMax);
            setColorTimer(newTimerMax);
            return newMatches;
          }
        });

        if (settings.soundEnabled) {
          playCorrectSound();
        }
      } else {
        // Wrong match - end game, reset combo
        setComboCount(0);
        setIsPlaying(false);
        if (settings.soundEnabled) {
          playWrongSound();
          setTimeout(() => {
            playGameOverSound();
          }, 400);
        }
        // Save score and transition to game over
        const saveAndUpdate = async () => {
          if (player && score > 0) {
            await saveScoreAsync({
              playerName: player.name,
              score,
              level,
              date: Date.now(),
            });
            const scores = await getTopScoresAsync(10);
            setTopScores(scores);
            const bestRecord = await getPlayerBestRecordAsync(player.name);
            setPlayerBestScore(bestRecord.score);
            setPlayerBestLevel(bestRecord.level);
          }
        };
        saveAndUpdate();
        setScreen('gameOver');
      }
    },
    [isPlaying, currentColor, getRandomColor, settings.soundEnabled, player, score, speed, colorTimerMax, colorTimer, level, comboCount]
  );

  const endGame = useCallback(() => {
    setIsPlaying(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (settings.soundEnabled) {
      playGameOverSound();
    }

    // Save score
    const saveAndUpdate = async () => {
      if (player && score > 0) {
        await saveScoreAsync({
          playerName: player.name,
          score,
          level,
          date: Date.now(),
        });
        const scores = await getTopScoresAsync(10);
        setTopScores(scores);
        const bestRecord = await getPlayerBestRecordAsync(player.name);
        setPlayerBestScore(bestRecord.score);
        setPlayerBestLevel(bestRecord.level);
      }
    };
    saveAndUpdate();

    setScreen('gameOver');
  }, [player, score, level, settings.soundEnabled]);

  const continuePlaying = useCallback(() => {
    // Resume playing after level up
    setIsPlaying(true);
    setScreen('playing');
  }, []);

  const toggleSound = useCallback(() => {
    setSettings((prev) => {
      const newSettings = { ...prev, soundEnabled: !prev.soundEnabled };
      persistSettings(newSettings);
      return newSettings;
    });
  }, []);

  const toggleDarkMode = useCallback(() => {
    setSettings((prev) => {
      const newSettings = { ...prev, darkMode: !prev.darkMode };
      persistSettings(newSettings);
      return newSettings;
    });
  }, []);

  const refreshScores = useCallback(async () => {
    setIsLoadingScores(true);
    const scores = await getTopScoresAsync(10);
    setTopScores(scores);
    if (player) {
      const bestRecord = await getPlayerBestRecordAsync(player.name);
      setPlayerBestScore(bestRecord.score);
      setPlayerBestLevel(bestRecord.level);
    }
    setIsLoadingScores(false);
  }, [player]);

  return (
    <GameContext.Provider
      value={{
        player,
        logout,
        playerBestScore,
        playerBestLevel,
        updatePlayerName,
        authUser,
        isAuthLoading,
        signInWithEmail,
        signUpWithEmail,
        confirmSignUp,
        changePassword,
        screen,
        setScreen,
        score,
        timeRemaining,
        currentColor,
        speed,
        isPlaying,
        colorTimer,
        colorTimerMax,
        level,
        matchesInCurrentLevel,
        comboCount,
        startGame,
        handleColorClick,
        endGame,
        continuePlaying,
        settings,
        toggleSound,
        toggleDarkMode,
        topScores,
        isLoadingScores,
        isOnlineLeaderboard,
        refreshScores,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
