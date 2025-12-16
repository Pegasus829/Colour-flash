import { useState } from 'react';
import type { FormEvent } from 'react';
import { useGame } from '../contexts/GameContext';

export function WelcomeScreen() {
  const { setPlayerName, checkNameUnique, setScreen } = useGame();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Please enter your name');
      return;
    }

    if (trimmedName.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    if (trimmedName.length > 20) {
      setError('Name must be 20 characters or less');
      return;
    }

    setIsChecking(true);

    try {
      // Check if name is unique
      const isUnique = await checkNameUnique(trimmedName);
      if (!isUnique) {
        setError('This name is already taken. Please choose another.');
        setIsChecking(false);
        return;
      }

      const success = await setPlayerName(trimmedName);
      setIsChecking(false);

      if (success) {
        setScreen('instructions');
      } else {
        setError('Could not save your name. Please try again.');
      }
    } catch {
      setError('An error occurred. Please try again.');
      setIsChecking(false);
    }
  };

  return (
    <div className="game-container items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card text-center animate-bounce-in">
          {/* Logo/Title */}
          <div className="mb-8">
            <div className="text-6xl mb-4">🎨</div>
            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
              Color Match Rush
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              How fast can you match?
            </p>
          </div>

          {/* Name Entry Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="playerName"
                className="block text-left text-sm font-medium text-slate-600 dark:text-slate-300 mb-2"
              >
                Enter your name to begin
              </label>
              <input
                id="playerName"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="Your name"
                className="input-field"
                maxLength={20}
                autoFocus
                autoComplete="off"
                disabled={isChecking}
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm animate-shake">{error}</p>
            )}

            <button
              type="submit"
              disabled={isChecking || !name.trim()}
              className="btn-primary w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChecking ? 'Checking...' : "Let's Play!"}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-xs text-slate-400 dark:text-slate-500">
            Your name will be saved for the leaderboard
          </p>
        </div>
      </div>
    </div>
  );
}
