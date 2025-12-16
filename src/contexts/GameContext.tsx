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
  INITIAL_COLOR_TIMER,
  MIN_COLOR_TIMER,
  COLOR_TIMER_DECREMENT,
} from '../types';
import {
  getPlayer,
  setPlayer as savePlayer,
  clearPlayer,
  getSettings,
  saveSettings as persistSettings,
  saveScoreAsync,
  getTopScoresAsync,
  isNameUniqueAsync,
  getPlayerBestScoreAsync,
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
  isAuthEnabled,
  getAuthenticatedUser,
  signInWithGoogle as authSignInWithGoogle,
  signInWithApple as authSignInWithApple,
  signOutUser,
  onAuthStateChange,
  type AuthUser,
} from '../utils/auth';

interface GameContextType {
  // Player
  player: Player | null;
  setPlayerName: (name: string) => Promise<boolean>;
  logout: () => void;
  checkNameUnique: (name: string) => Promise<boolean>;
  playerBestScore: number;

  // Auth
  authUser: AuthUser | null;
  isAuthLoading: boolean;
  hasAuthSupport: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;

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

  // Game actions
  startGame: () => void;
  handleColorClick: (color: GameColor) => void;
  endGame: () => void;

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

  // Auth state
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const hasAuthSupport = isAuthEnabled();

  // Game state
  const [screen, setScreen] = useState<GameScreen>('welcome');
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION);
  const [currentColor, setCurrentColor] = useState<GameColor>('red');
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [isPlaying, setIsPlaying] = useState(false);
  const [colorTimer, setColorTimer] = useState(INITIAL_COLOR_TIMER);
  const [colorTimerMax, setColorTimerMax] = useState(INITIAL_COLOR_TIMER);

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

      // Check for authenticated user first
      if (hasAuthSupport) {
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
          const bestScore = await getPlayerBestScoreAsync(authenticatedUser.name);
          setPlayerBestScore(bestScore);
          setScreen('home');
          setIsAuthLoading(false);
          const scores = await getTopScoresAsync(10);
          setTopScores(scores);
          setIsLoadingScores(false);
          return;
        }
      }
      setIsAuthLoading(false);

      // Fall back to local player
      const savedPlayer = getPlayer();
      if (savedPlayer) {
        setPlayer(savedPlayer);
        const bestScore = await getPlayerBestScoreAsync(savedPlayer.name);
        setPlayerBestScore(bestScore);
        setScreen('home');
      }
      const scores = await getTopScoresAsync(10);
      setTopScores(scores);
      setIsLoadingScores(false);
    };
    initializeData();

    // Listen for auth state changes (OAuth redirects)
    if (hasAuthSupport) {
      const unsubscribe = onAuthStateChange(async (event, user) => {
        if (event === 'signIn' && user) {
          setAuthUser(user);
          const authPlayer: Player = {
            name: user.name,
            createdAt: Date.now(),
          };
          savePlayer(authPlayer);
          setPlayer(authPlayer);
          const bestScore = await getPlayerBestScoreAsync(user.name);
          setPlayerBestScore(bestScore);
          setScreen('home');
        } else if (event === 'signOut') {
          setAuthUser(null);
        }
      });
      return unsubscribe;
    }
  }, [hasAuthSupport]);

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
        setColorTimer((prev) => {
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
            date: Date.now(),
          });
          const scores = await getTopScoresAsync(10);
          setTopScores(scores);
          const bestScore = await getPlayerBestScoreAsync(player.name);
          setPlayerBestScore(bestScore);
        }
      };
      saveAndUpdate();
      setScreen('gameOver');
      colorTimerExpiredRef.current = false;
    }
  }, [isPlaying, colorTimer, settings.soundEnabled, player, score]);

  const getRandomColor = useCallback((): GameColor => {
    const availableColors = GAME_COLORS.filter((c) => c !== currentColor);
    return availableColors[Math.floor(Math.random() * availableColors.length)];
  }, [currentColor]);

  const setPlayerName = useCallback(async (name: string): Promise<boolean> => {
    const trimmedName = name.trim();
    if (!trimmedName) return false;

    // Check if name is unique (only for new players)
    const existingPlayer = getPlayer();
    if (!existingPlayer) {
      const isUnique = await isNameUniqueAsync(trimmedName);
      if (!isUnique) {
        return false;
      }
    }

    const newPlayer: Player = {
      name: trimmedName,
      createdAt: Date.now(),
    };

    savePlayer(newPlayer);
    setPlayer(newPlayer);
    const bestScore = await getPlayerBestScoreAsync(trimmedName);
    setPlayerBestScore(bestScore);
    return true;
  }, []);

  const logout = useCallback(async () => {
    // Sign out from Cognito if authenticated
    if (authUser) {
      await signOutUser();
      setAuthUser(null);
    }
    clearPlayer();
    setPlayer(null);
    setPlayerBestScore(0);
    setScreen('welcome');
  }, [authUser]);

  const signInWithGoogle = useCallback(async () => {
    await authSignInWithGoogle();
  }, []);

  const signInWithApple = useCallback(async () => {
    await authSignInWithApple();
  }, []);

  const checkNameUnique = useCallback(async (name: string): Promise<boolean> => {
    return isNameUniqueAsync(name.trim());
  }, []);

  const startGame = useCallback(() => {
    resumeAudioContext();
    setScore(0);
    setTimeRemaining(GAME_DURATION);
    setSpeed(INITIAL_SPEED);
    setCurrentColor(GAME_COLORS[Math.floor(Math.random() * GAME_COLORS.length)]);
    setColorTimer(INITIAL_COLOR_TIMER);
    setColorTimerMax(INITIAL_COLOR_TIMER);
    colorTimerExpiredRef.current = false;
    setIsPlaying(true);
    setScreen('playing');
    lastTickRef.current = GAME_DURATION;
  }, []);

  const handleColorClick = useCallback(
    (color: GameColor) => {
      if (!isPlaying) return;

      resumeAudioContext();

      if (color === currentColor) {
        // Correct match
        setScore((prev) => prev + Math.round(10 * speed));
        setCurrentColor(getRandomColor());

        // Reset and decrement color timer for next color
        const newTimerMax = Math.max(MIN_COLOR_TIMER, colorTimerMax - COLOR_TIMER_DECREMENT);
        setColorTimerMax(newTimerMax);
        setColorTimer(newTimerMax);

        if (settings.soundEnabled) {
          playCorrectSound();
        }
      } else {
        // Wrong match - end game
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
              date: Date.now(),
            });
            const scores = await getTopScoresAsync(10);
            setTopScores(scores);
            const bestScore = await getPlayerBestScoreAsync(player.name);
            setPlayerBestScore(bestScore);
          }
        };
        saveAndUpdate();
        setScreen('gameOver');
      }
    },
    [isPlaying, currentColor, getRandomColor, settings.soundEnabled, player, score, speed, colorTimerMax]
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
          date: Date.now(),
        });
        const scores = await getTopScoresAsync(10);
        setTopScores(scores);
        const bestScore = await getPlayerBestScoreAsync(player.name);
        setPlayerBestScore(bestScore);
      }
    };
    saveAndUpdate();

    setScreen('gameOver');
  }, [player, score, settings.soundEnabled]);

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
      const bestScore = await getPlayerBestScoreAsync(player.name);
      setPlayerBestScore(bestScore);
    }
    setIsLoadingScores(false);
  }, [player]);

  return (
    <GameContext.Provider
      value={{
        player,
        setPlayerName,
        logout,
        checkNameUnique,
        playerBestScore,
        authUser,
        isAuthLoading,
        hasAuthSupport,
        signInWithGoogle,
        signInWithApple,
        screen,
        setScreen,
        score,
        timeRemaining,
        currentColor,
        speed,
        isPlaying,
        colorTimer,
        colorTimerMax,
        startGame,
        handleColorClick,
        endGame,
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
