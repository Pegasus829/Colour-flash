import { useGame } from '../contexts/GameContext';

export function Leaderboard() {
  const { topScores, player, isLoadingScores, isOnlineLeaderboard } = useGame();

  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="card">
      <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
        <span>🏅</span> Leaderboard
        {isOnlineLeaderboard && (
          <span className="ml-auto text-xs font-normal px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            🌐 Global
          </span>
        )}
        {!isOnlineLeaderboard && (
          <span className="ml-auto text-xs font-normal px-2 py-1 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
            📱 Local
          </span>
        )}
      </h2>

      {isLoadingScores ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2 animate-pulse">⏳</div>
          <p className="text-slate-500 dark:text-slate-400">
            Loading scores...
          </p>
        </div>
      ) : topScores.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🎯</div>
          <p className="text-slate-500 dark:text-slate-400">
            No scores yet. Be the first!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {topScores.map((score, index) => {
            const rank = index + 1;
            const isCurrentPlayer = player?.name.toLowerCase() === score.playerName.toLowerCase();
            const medal = getMedalEmoji(rank);

            return (
              <div
                key={`${score.playerName}-${score.date}`}
                className={`
                  flex items-center gap-3 p-3 rounded-xl transition-colors
                  ${isCurrentPlayer
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                    : 'bg-slate-50 dark:bg-slate-700/50'
                  }
                `}
              >
                {/* Rank */}
                <div className="flex-shrink-0 w-8 text-center">
                  {medal ? (
                    <span className="text-xl">{medal}</span>
                  ) : (
                    <span className="text-sm font-medium text-slate-400 dark:text-slate-500">
                      {rank}
                    </span>
                  )}
                </div>

                {/* Player Name */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium truncate ${
                      isCurrentPlayer
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {score.playerName}
                    {isCurrentPlayer && ' (you)'}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {formatDate(score.date)}
                  </p>
                </div>

                {/* Score */}
                <div className="flex-shrink-0 text-right">
                  <p
                    className={`font-bold ${
                      isCurrentPlayer
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-800 dark:text-white'
                    }`}
                  >
                    {score.score.toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
