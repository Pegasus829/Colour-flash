import { useState } from 'react';
import type { FormEvent } from 'react';
import { useGame } from '../contexts/GameContext';

type AuthMode = 'signin' | 'signup' | 'confirm';

export function WelcomeScreen() {
  const {
    isAuthLoading,
    signInWithEmail,
    signUpWithEmail,
    confirmSignUp,
  } = useGame();

  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signInWithEmail(email, password);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      setError(message.includes('Incorrect') ? 'Invalid email or password' : message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!displayName.trim()) {
      setError('Please enter a display name');
      return;
    }

    setIsLoading(true);

    try {
      const { needsConfirmation } = await signUpWithEmail(email, password, displayName.trim());
      if (needsConfirmation) {
        setAuthMode('confirm');
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed';
      if (message.includes('exists')) {
        setError('An account with this email already exists');
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await confirmSignUp(email, confirmCode);
      await signInWithEmail(email, password);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Confirmation failed';
      setError(message.includes('Invalid') ? 'Invalid verification code' : message);
    } finally {
      setIsLoading(false);
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
          <div className="mb-6">
            <div className="text-6xl mb-4">🎨</div>
            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
              Color Match Rush
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              How fast can you match?
            </p>
          </div>

          {authMode !== 'confirm' && (
            <>
              {/* Auth Mode Tabs */}
              <div className="flex mb-6 bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => { setAuthMode('signin'); setError(''); }}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    authMode === 'signin'
                      ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('signup'); setError(''); }}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    authMode === 'signup'
                      ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Sign In Form */}
              {authMode === 'signin' && (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="Email"
                    className="input-field"
                    autoComplete="email"
                    disabled={isLoading}
                    required
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="Password"
                    className="input-field"
                    autoComplete="current-password"
                    disabled={isLoading}
                    required
                  />
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full disabled:opacity-50"
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>
              )}

              {/* Sign Up Form */}
              {authMode === 'signup' && (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => { setDisplayName(e.target.value); setError(''); }}
                    placeholder="Display Name"
                    className="input-field"
                    autoComplete="name"
                    maxLength={20}
                    disabled={isLoading}
                    required
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="Email"
                    className="input-field"
                    autoComplete="email"
                    disabled={isLoading}
                    required
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="Password (8+ characters)"
                    className="input-field"
                    autoComplete="new-password"
                    minLength={8}
                    disabled={isLoading}
                    required
                  />
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full disabled:opacity-50"
                  >
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </button>
                </form>
              )}
            </>
          )}

          {/* Confirmation Code Form */}
          {authMode === 'confirm' && (
            <form onSubmit={handleConfirm} className="space-y-4">
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                We sent a verification code to <strong>{email}</strong>
              </p>
              <input
                type="text"
                value={confirmCode}
                onChange={(e) => { setConfirmCode(e.target.value); setError(''); }}
                placeholder="Verification code"
                className="input-field text-center text-2xl tracking-widest"
                autoComplete="one-time-code"
                maxLength={6}
                disabled={isLoading}
                autoFocus
                required
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={isLoading || confirmCode.length < 6}
                className="btn-primary w-full disabled:opacity-50"
              >
                {isLoading ? 'Verifying...' : 'Verify Email'}
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('signup'); setError(''); }}
                className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Back to sign up
              </button>
            </form>
          )}

          {/* Footer */}
          <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">
            Your scores sync across all devices
          </p>
        </div>
      </div>
    </div>
  );
}
