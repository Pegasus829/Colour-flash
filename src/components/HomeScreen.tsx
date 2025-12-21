import { useGame } from '../contexts/GameContext';
import { Leaderboard } from './Leaderboard';

export function HomeScreen() {
  const { player, playerBestScore, startGame, setScreen } = useGame();

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header with Profile Icon */}
      <header className="flex-shrink-0 p-4 bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="flex items-center justify-between">
          <div className="w-12"></div> {/* Spacer for centering */}
          <div className="text-center">
            <p className="text-white/80 text-sm">Welcome back</p>
            <p className="text-white font-bold text-lg">{player?.name}</p>
          </div>
          {/* Profile Icon */}
          <button
            onClick={() => setScreen('profile')}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95 transition-all border-2 border-white/30"
          >
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-lg mx-auto space-y-6 flex flex-col items-center">
          {/* Logo */}
          <div className="w-full max-w-md px-4 py-8 flex justify-center">
            <img src="/Colour-flash/logo.png" alt="Colour Match Rush" className="w-full h-auto drop-shadow-2xl" />
            {/*<div className="text-center">
              <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 mb-2 tracking-tight">
                COLOUR
              </h1>
              <h2 className="text-4xl font-black text-white tracking-wider mb-2">
                MATCH
              </h2>
              <h3 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500 tracking-tight">
                RUSH
              </h3>
            </div> */}
          </div>

          {/* Start Game Button */}
          <button
            onClick={startGame}
            className="w-full max-w-sm bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-black text-2xl py-6 px-8 rounded-3xl shadow-2xl transform hover:scale-105 active:scale-95 transition-all border-4 border-white/30 flex items-center justify-center gap-3"
          >
            <span className="text-3xl">▶</span>
            <span>PLAY NOW</span>
          </button>

          {/* Best Score Display */}
          <div className="w-full max-w-sm bg-gradient-to-br from-yellow-400/20 to-orange-500/20 backdrop-blur-sm rounded-3xl p-6 border-2 border-yellow-400/50 shadow-2xl transform hover:scale-105 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-200 text-sm font-semibold uppercase tracking-wide">{player?.name}'s Best Score</p>
                <p className="text-5xl font-black text-white mt-1">
                  {playerBestScore > 0 ? playerBestScore.toLocaleString() : '—'}
                </p>
              </div>
              <div className="text-6xl drop-shadow-lg">🏆</div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="w-full max-w-sm">
            <Leaderboard />
          </div>
        </div>
      </main>
    </div>
  );
}
