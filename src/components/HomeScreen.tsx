import { useGame } from '../contexts/GameContext';
import { Leaderboard } from './Leaderboard';
import { Settings } from './Settings';

export function HomeScreen() {
  const { player, playerBestScore, startGame, logout } = useGame();

  return (
    <div className="game-container">
      {/* Header */}
      <header className="flex-shrink-0 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
              Color Match Rush
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Welcome back, <span className="font-medium text-slate-700 dark:text-slate-300">{player?.name}</span>
            </p>
          </div>
          <button
            onClick={logout}
            className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Switch Player
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4">
        <div className="max-w-lg mx-auto space-y-4">
          {/* Player Stats Card */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Your Best Score</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white">
                  {playerBestScore > 0 ? playerBestScore.toLocaleString() : '—'}
                </p>
              </div>
              <div className="text-5xl">🏆</div>
            </div>
          </div>

          {/* Start Game Button */}
          <button
            onClick={startGame}
            className="btn-primary w-full py-5 text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all"
          >
            🎮 Start Game
          </button>

          {/* Leaderboard */}
          <Leaderboard />

          {/* Settings */}
          <Settings />
        </div>
      </main>
    </div>
  );
}
