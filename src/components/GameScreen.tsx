import { useMemo } from 'react';
import { useGame } from '../contexts/GameContext';
import type { GameColor } from '../types';
import { GAME_COLORS, COLOR_VALUES, COLOR_NAMES, GAME_DURATION } from '../types';

export function GameScreen() {
  const {
    score,
    timeRemaining,
    currentColor,
    speed,
    handleColorClick,
    settings,
  } = useGame();

  // Shuffle colors for display (but keep consistent during game)
  const displayColors = useMemo(() => {
    // Create a shuffled copy
    const shuffled = [...GAME_COLORS];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  const timePercent = (timeRemaining / GAME_DURATION) * 100;
  const isLowTime = timeRemaining <= 10;

  return (
    <div className="game-container">
      {/* Header with stats */}
      <header className="flex-shrink-0 p-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
        <div className="max-w-lg mx-auto">
          {/* Score and Timer Row */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Score</p>
              <p className="text-3xl font-bold text-slate-800 dark:text-white">
                {score.toLocaleString()}
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
            className="aspect-[3/1] rounded-2xl shadow-2xl flex items-center justify-center animate-flash"
            style={{ backgroundColor: COLOR_VALUES[currentColor] }}
          >
            <span className="text-white text-2xl font-bold drop-shadow-lg">
              {COLOR_NAMES[currentColor]}
            </span>
          </div>
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
