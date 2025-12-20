import { useState } from 'react';
import type { FormEvent } from 'react';
import { useGame } from '../contexts/GameContext';

type AuthMode = 'signin' | 'signup' | 'confirm' | 'guest';

export function WelcomeScreen() {
  const {
    setPlayerName,
    checkNameUnique,
    setScreen,
    hasAuthSupport,
    isAuthLoading,
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    signUpWithEmail,
    confirmSignUp,
  } = useGame();

  const [authMode, setAuthMode] = useState<AuthMode>(hasAuthSupport ? 'signin' : 'guest');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [guestName, setGuestName] = useState('');
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
        // Auto sign in after registration
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
      // Sign in after confirmation
      await signInWithEmail(email, password);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Confirmation failed';
      setError(message.includes('Invalid') ? 'Invalid verification code' : message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = guestName.trim();

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

    setIsLoading(true);

    try {
      const isUnique = await checkNameUnique(trimmedName);
      if (!isUnique) {
        setError('This name is already taken. Please choose another.');
        setIsLoading(false);
        return;
      }

      const success = await setPlayerName(trimmedName);
      if (success) {
        setScreen('instructions');
      } else {
        setError('Could not save your name. Please try again.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'apple') => {
    setError('');
    try {
      if (provider === 'google') {
        await signInWithGoogle();
      } else {
        await signInWithApple();
      }
    } catch (err) {
      setError(`Failed to sign in with ${provider === 'google' ? 'Google' : 'Apple'}`);
      console.error(`${provider} sign in error:`, err);
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

          {hasAuthSupport && authMode !== 'guest' && authMode !== 'confirm' && (
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

              {/* Social Sign In */}
              <div className="mt-6">
                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      or continue with
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleSocialSignIn('google')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialSignIn('apple')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-black dark:bg-white border border-black dark:border-white rounded-xl font-medium text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                    Apple
                  </button>
                </div>
              </div>

              {/* Guest Mode Link */}
              <button
                type="button"
                onClick={() => { setAuthMode('guest'); setError(''); }}
                className="mt-6 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                Play as guest instead
              </button>
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

          {/* Guest Mode Form */}
          {(!hasAuthSupport || authMode === 'guest') && (
            <form onSubmit={handleGuestSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="guestName"
                  className="block text-left text-sm font-medium text-slate-600 dark:text-slate-300 mb-2"
                >
                  Enter your name to begin
                </label>
                <input
                  id="guestName"
                  type="text"
                  value={guestName}
                  onChange={(e) => { setGuestName(e.target.value); setError(''); }}
                  placeholder="Your name"
                  className="input-field"
                  maxLength={20}
                  autoComplete="off"
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={isLoading || !guestName.trim()}
                className="btn-primary w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Loading...' : "Let's Play!"}
              </button>

              {hasAuthSupport && (
                <button
                  type="button"
                  onClick={() => { setAuthMode('signin'); setError(''); }}
                  className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  Sign in with account instead
                </button>
              )}
            </form>
          )}

          {/* Footer */}
          <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">
            {hasAuthSupport && authMode !== 'guest'
              ? 'Your scores sync across all devices'
              : 'Guest scores are saved locally only'}
          </p>
        </div>
      </div>
    </div>
  );
}
