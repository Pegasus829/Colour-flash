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
} from '../types';
import {
  getPlayer,
  setPlayer as savePlayer,
  clearPlayer,
  getSettings,
  saveSettings as persistSettings,
  saveScore,
  getTopScores,
  isNameUnique,
  getPlayerBestScore,
} from '../utils/storage';
import {
  playCorrectSound,
  playWrongSound,
  playGameOverSound,
  playTickSound,
  resumeAudioContext,
} from '../utils/sound';

interface GameContextType {
  // Player
  player: Player | null;
  setPlayerName: (name: string) => boolean;
  logout: () => void;
  checkNameUnique: (name: string) => boolean;
  playerBestScore: number;

  // Game state
  screen: GameScreen;
  setScreen: (screen: GameScreen) => void;
  score: number;
  timeRemaining: number;
  currentColor: GameColor;
  speed: number;
  isPlaying: boolean;

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
  refreshScores: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  // Player state
  const [player, setPlayer] = useState<Player | null>(null);
  const [playerBestScore, setPlayerBestScore] = useState(0);

  // Game state
  const [screen, setScreen] = useState<GameScreen>('welcome');
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION);
  const [currentColor, setCurrentColor] = useState<GameColor>('red');
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [isPlaying, setIsPlaying] = useState(false);

  // Settings
  const [settings, setSettings] = useState<GameSettings>(getSettings);

  // Leaderboard
  const [topScores, setTopScores] = useState<Score[]>([]);

  // Timer ref
  const timerRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  // Initialize from storage
  useEffect(() => {
    const savedPlayer = getPlayer();
    if (savedPlayer) {
      setPlayer(savedPlayer);
      setPlayerBestScore(getPlayerBestScore(savedPlayer.name));
      setScreen('home');
    }
    setTopScores(getTopScores(10));
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

  const getRandomColor = useCallback((): GameColor => {
    const availableColors = GAME_COLORS.filter((c) => c !== currentColor);
    return availableColors[Math.floor(Math.random() * availableColors.length)];
  }, [currentColor]);

  const setPlayerName = useCallback((name: string): boolean => {
    const trimmedName = name.trim();
    if (!trimmedName) return false;

    // Check if name is unique (only for new players)
    const existingPlayer = getPlayer();
    if (!existingPlayer && !isNameUnique(trimmedName)) {
      return false;
    }

    const newPlayer: Player = {
      name: trimmedName,
      createdAt: Date.now(),
    };

    savePlayer(newPlayer);
    setPlayer(newPlayer);
    setPlayerBestScore(getPlayerBestScore(trimmedName));
    return true;
  }, []);

  const logout = useCallback(() => {
    clearPlayer();
    setPlayer(null);
    setPlayerBestScore(0);
    setScreen('welcome');
  }, []);

  const checkNameUnique = useCallback((name: string): boolean => {
    return isNameUnique(name.trim());
  }, []);

  const startGame = useCallback(() => {
    resumeAudioContext();
    setScore(0);
    setTimeRemaining(GAME_DURATION);
    setSpeed(INITIAL_SPEED);
    setCurrentColor(GAME_COLORS[Math.floor(Math.random() * GAME_COLORS.length)]);
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
        if (player && score > 0) {
          saveScore({
            playerName: player.name,
            score,
            date: Date.now(),
          });
          setTopScores(getTopScores(10));
          setPlayerBestScore(getPlayerBestScore(player.name));
        }
        setScreen('gameOver');
      }
    },
    [isPlaying, currentColor, getRandomColor, settings.soundEnabled, player, score, speed]
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
    if (player && score > 0) {
      saveScore({
        playerName: player.name,
        score,
        date: Date.now(),
      });
      setTopScores(getTopScores(10));
      setPlayerBestScore(getPlayerBestScore(player.name));
    }

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

  const refreshScores = useCallback(() => {
    setTopScores(getTopScores(10));
    if (player) {
      setPlayerBestScore(getPlayerBestScore(player.name));
    }
  }, [player]);

  return (
    <GameContext.Provider
      value={{
        player,
        setPlayerName,
        logout,
        checkNameUnique,
        playerBestScore,
        screen,
        setScreen,
        score,
        timeRemaining,
        currentColor,
        speed,
        isPlaying,
        startGame,
        handleColorClick,
        endGame,
        settings,
        toggleSound,
        toggleDarkMode,
        topScores,
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
