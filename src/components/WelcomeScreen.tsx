import { useState } from 'react';
import type { FormEvent } from 'react';
import { useGame } from '../contexts/GameContext';

export function WelcomeScreen() {
  const {
    setPlayerName,
    checkNameUnique,
    setScreen,
    hasAuthSupport,
    isAuthLoading,
    signInWithGoogle,
    signInWithApple,
  } = useGame();
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

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      setError('Failed to sign in with Google. Please try again.');
      console.error('Google sign in error:', err);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      await signInWithApple();
    } catch (err) {
      setError('Failed to sign in with Apple. Please try again.');
      console.error('Apple sign in error:', err);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="game-container items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="card text-center">
            <div className="text-4xl mb-4 animate-pulse">🎨</div>
            <p className="text-slate-500 dark:text-slate-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

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

          {/* OAuth Sign In Buttons */}
          {hasAuthSupport && (
            <div className="space-y-3 mb-6">
              <button
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>

              <button
                onClick={handleAppleSignIn}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-black dark:bg-white border border-black dark:border-white rounded-xl font-medium text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Continue with Apple
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    or play as guest
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Name Entry Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="playerName"
                className="block text-left text-sm font-medium text-slate-600 dark:text-slate-300 mb-2"
              >
                {hasAuthSupport ? 'Enter a guest name' : 'Enter your name to begin'}
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
                autoFocus={!hasAuthSupport}
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
            {hasAuthSupport
              ? 'Sign in to save your scores across devices'
              : 'Your name will be saved for the leaderboard'}
          </p>
        </div>
      </div>
    </div>
  );
}
