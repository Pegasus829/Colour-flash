import { useGame } from '../contexts/GameContext';
import { COLOR_VALUES, GAME_DURATION } from '../types';

export function InstructionsScreen() {
  const { player, setScreen } = useGame();

  return (
    <div className="game-container items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card animate-bounce-in">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              Welcome, {player?.name}! 👋
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Here's how to play
            </p>
          </div>

          {/* Instructions */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-xl">🎯</span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white">
                  Match the Color
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  A target color will appear at the top. Tap the matching color button below as fast as you can!
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <span className="text-xl">⏱️</span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white">
                  Beat the Clock
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  You have {GAME_DURATION} seconds. Score as many matches as possible before time runs out!
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <span className="text-xl">🚀</span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white">
                  Speed Increases
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  As time passes, the game speeds up and points per match increase. Stay focused!
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <span className="text-xl">❌</span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white">
                  Don't Miss!
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Wrong tap ends the game immediately. Accuracy is key!
                </p>
              </div>
            </div>
          </div>

          {/* Color Preview */}
          <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-700/50 rounded-xl">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 text-center">
              Colors you'll see:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {Object.entries(COLOR_VALUES).map(([name, color]) => (
                <div
                  key={name}
                  className="w-8 h-8 rounded-lg shadow-md"
                  style={{ backgroundColor: color }}
                  title={name}
                />
              ))}
            </div>
          </div>

          {/* Continue Button */}
          <button
            onClick={() => setScreen('home')}
            className="btn-primary w-full mt-6 text-lg"
          >
            Got it! Show me the leaderboard
          </button>
        </div>
      </div>
    </div>
  );
}
