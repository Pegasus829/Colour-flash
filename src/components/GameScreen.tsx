import { useMemo } from 'react';
import { useGame } from '../contexts/GameContext';
import type { GameColor } from '../types';
import { GAME_COLORS, COLOR_VALUES, COLOR_NAMES, GAME_DURATION, COLORS_PER_LEVEL } from '../types';

export function GameScreen() {
  const {
    score,
    timeRemaining,
    currentColor,
    speed,
    handleColorClick,
    settings,
    colorTimer,
    colorTimerMax,
    level,
    comboCount,
  } = useGame();

  // Get colors available for current level and shuffle them for display
  const displayColors = useMemo(() => {
    // Get colors available for this level
    const numColors = COLORS_PER_LEVEL[Math.min(level - 1, COLORS_PER_LEVEL.length - 1)];
    const levelColors = GAME_COLORS.slice(0, numColors);

    // Create a shuffled copy
    const shuffled = [...levelColors];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [level]);

  const timePercent = (timeRemaining / GAME_DURATION) * 100;
  const isLowTime = timeRemaining <= 10;
  const colorTimerPercent = (colorTimer / colorTimerMax) * 100;
  const isColorTimerLow = colorTimer <= 1.5;

  return (
    <div className="game-container">
      {/* Header with stats */}
      <header className="flex-shrink-0 p-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
        <div className="max-w-lg mx-auto">
          {/* Score, Level, and Timer Row */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Score</p>
              <p className="text-3xl font-bold text-slate-800 dark:text-white">
                {score.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Level</p>
              <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
                {level}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Time</p>
              <p
                className={`text-3xl font-bold tabular-nums ${
                  isLowTime
                    ? 'text-red-500 animate-pulse'
                    : 'text-slate-800 dark:text-white'
                }`}
              >
                {Math.ceil(timeRemaining)}s
              </p>
            </div>
          </div>

          {/* Timer Bar */}
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-100 ease-linear rounded-full ${
                isLowTime
                  ? 'bg-red-500'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500'
              }`}
              style={{ width: `${timePercent}%` }}
            />
          </div>

          {/* Speed Indicator */}
          <div className="mt-2 flex items-center justify-center gap-1">
            <span className="text-xs text-slate-400 dark:text-slate-500">Speed:</span>
            <div className="flex gap-0.5">
              {[1, 2, 3].map((level) => (
                <div
                  key={level}
                  className={`w-2 h-3 rounded-sm ${
                    speed >= level
                      ? 'bg-purple-500'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Target Color Display */}
      <div className="flex-shrink-0 p-6">
        <div className="max-w-lg mx-auto">
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
            Tap this color
          </p>
          <div
            className="aspect-[3/1] rounded-2xl shadow-2xl flex items-center justify-center animate-flash relative overflow-hidden"
            style={{ backgroundColor: COLOR_VALUES[currentColor] }}
          >
            <span className="text-white text-2xl font-bold drop-shadow-lg">
              {COLOR_NAMES[currentColor]}
            </span>
            {/* Color Timer Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/20">
              <div
                className={`h-full transition-all duration-100 ease-linear ${
                  isColorTimerLow
                    ? 'bg-red-400 animate-pulse'
                    : 'bg-white/70'
                }`}
                style={{ width: `${colorTimerPercent}%` }}
              />
            </div>
          </div>
          <p className={`text-center text-sm mt-2 font-medium tabular-nums ${
            isColorTimerLow ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'
          }`}>
            {colorTimer.toFixed(1)}s
          </p>

          {/* Combo Counter */}
          {comboCount > 0 && (
            <div className="mt-4 flex items-center justify-center">
              <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white px-6 py-3 rounded-full shadow-2xl transform animate-pulse">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🔥</span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider opacity-90">Combo</p>
                    <p className="text-2xl font-black">{comboCount}x</p>
                  </div>
                  <span className="text-xl font-black">
                    +{Math.round(comboCount * 50)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Color Buttons Grid */}
      <main className="flex-1 p-4 pb-safe">
        <div className="max-w-lg mx-auto h-full">
          <div className="grid grid-cols-4 gap-3 h-full max-h-[50vh]">
            {displayColors.map((color) => (
              <ColorButton
                key={color}
                color={color}
                onClick={() => handleColorClick(color)}
                soundEnabled={settings.soundEnabled}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

interface ColorButtonProps {
  color: GameColor;
  onClick: () => void;
  soundEnabled: boolean;
}

function ColorButton({ color, onClick }: ColorButtonProps) {
  return (
    <button
      onClick={onClick}
      className="color-button focus:outline-none focus:ring-4 focus:ring-white/50"
      style={{ backgroundColor: COLOR_VALUES[color] }}
      aria-label={`Select ${color}`}
    >
      <span className="sr-only">{COLOR_NAMES[color]}</span>
    </button>
  );
}
