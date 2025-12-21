import { useGame } from '../contexts/GameContext';
import { COLORS_PER_LEVEL } from '../types';

export function LevelUpScreen() {
  const { level, score, continuePlaying } = useGame();

  const numColors = COLORS_PER_LEVEL[Math.min(level - 1, COLORS_PER_LEVEL.length - 1)];

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 p-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-8 max-w-lg">
        {/* Trophy/Star Icon */}
        <div className="relative">
          <div className="text-9xl animate-bounce">🎉</div>
          <div className="absolute -top-4 -right-4 text-6xl animate-spin-slow">✨</div>
          <div className="absolute -bottom-4 -left-4 text-6xl animate-spin-slow" style={{ animationDelay: '0.5s' }}>⭐</div>
        </div>

        {/* Level Up Message */}
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 animate-pulse">
            LEVEL UP!
          </h1>

          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border-2 border-white/30 shadow-2xl">
            <p className="text-white/80 text-lg font-semibold mb-2">You reached</p>
            <p className="text-8xl font-black text-white mb-4">{level}</p>
            <p className="text-white/60 text-sm font-medium">Current Score: {score.toLocaleString()}</p>
          </div>

          {/* Level Info */}
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <p className="text-white font-bold text-xl mb-2">New Challenge!</p>
            <p className="text-white/80 text-lg">
              Match {numColors} colors now
            </p>
            <p className="text-white/60 text-sm mt-2">
              The game gets faster! Stay focused! 🎯
            </p>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={continuePlaying}
          className="w-full max-w-sm bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-black text-2xl py-6 px-8 rounded-3xl shadow-2xl transform hover:scale-105 active:scale-95 transition-all border-4 border-white/30 flex items-center justify-center gap-3"
        >
          <span>CONTINUE</span>
          <span className="text-3xl">→</span>
        </button>
      </div>

      {/* Add spinning animation for stars */}
      <style>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
