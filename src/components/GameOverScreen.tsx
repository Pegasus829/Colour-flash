import { useGame } from '../contexts/GameContext';

export function GameOverScreen() {
  const { score, playerBestScore, player, startGame, setScreen, topScores } = useGame();

  const isNewBest = score >= playerBestScore && score > 0;
  const rank = topScores.findIndex(s =>
    s.playerName.toLowerCase() === player?.name.toLowerCase() && s.score === score
  ) + 1;
  const isOnLeaderboard = rank > 0 && rank <= 10;

  return (
    <div className="game-container items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card text-center animate-bounce-in">
          {/* Game Over Header */}
          <div className="mb-6">
            <div className="text-6xl mb-4">
              {isNewBest ? '🎉' : score > 0 ? '⏱️' : '😅'}
            </div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
              {isNewBest ? 'New Best!' : 'Game Over!'}
            </h1>
          </div>

          {/* Score Display */}
          <div className="mb-6">
            <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Your Score
            </p>
            <p className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
              {score.toLocaleString()}
            </p>

            {isNewBest && (
              <p className="mt-2 text-green-500 font-medium animate-pulse">
                🏆 Personal Best!
              </p>
            )}

            {isOnLeaderboard && (
              <p className="mt-2 text-purple-500 font-medium">
                #{rank} on the leaderboard!
              </p>
            )}
          </div>

          {/* Stats Comparison */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">Your Best</p>
              <p className="text-xl font-bold text-slate-800 dark:text-white">
                {playerBestScore.toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">Top Score</p>
              <p className="text-xl font-bold text-slate-800 dark:text-white">
                {topScores[0]?.score.toLocaleString() || '—'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button onClick={startGame} className="btn-primary w-full text-lg">
              🔄 Play Again
            </button>
            <button
              onClick={() => setScreen('home')}
              className="btn-secondary w-full"
            >
              View Leaderboard
            </button>
          </div>

          {/* Player Info */}
          <p className="mt-6 text-sm text-slate-400 dark:text-slate-500">
            Playing as <span className="font-medium">{player?.name}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
