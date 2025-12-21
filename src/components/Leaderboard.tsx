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
    <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20 shadow-2xl">
      <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
        <span>🏅</span> Leaderboard
        {isOnlineLeaderboard && (
          <span className="ml-auto text-xs font-bold px-3 py-1 rounded-full bg-green-500/30 text-green-300 border border-green-400/50">
            🌐 Global
          </span>
        )}
        {!isOnlineLeaderboard && (
          <span className="ml-auto text-xs font-bold px-3 py-1 rounded-full bg-slate-500/30 text-slate-300 border border-slate-400/50">
            📱 Local
          </span>
        )}
      </h2>

      {isLoadingScores ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2 animate-pulse">⏳</div>
          <p className="text-white/60">
            Loading scores...
          </p>
        </div>
      ) : topScores.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🎯</div>
          <p className="text-white/60">
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
                  flex items-center gap-3 p-3 rounded-xl transition-all transform hover:scale-102
                  ${isCurrentPlayer
                    ? 'bg-blue-500/30 border-2 border-blue-400/70 shadow-lg shadow-blue-500/20'
                    : 'bg-white/10 border border-white/20'
                  }
                `}
              >
                {/* Rank */}
                <div className="flex-shrink-0 w-8 text-center">
                  {medal ? (
                    <span className="text-xl">{medal}</span>
                  ) : (
                    <span className="text-sm font-bold text-white/50">
                      {rank}
                    </span>
                  )}
                </div>

                {/* Player Name */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-bold truncate ${
                      isCurrentPlayer
                        ? 'text-blue-200'
                        : 'text-white'
                    }`}
                  >
                    {score.playerName}
                    {isCurrentPlayer && ' (you)'}
                  </p>
                  <p className="text-xs text-white/40">
                    {formatDate(score.date)}
                  </p>
                </div>

                {/* Score */}
                <div className="flex-shrink-0 text-right">
                  <p
                    className={`font-black text-lg ${
                      isCurrentPlayer
                        ? 'text-blue-200'
                        : 'text-white'
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
