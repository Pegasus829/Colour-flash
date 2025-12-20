import { Amplify } from 'aws-amplify';
import {
  signOut,
  signIn,
  signUp,
  confirmSignUp,
  getCurrentUser,
  fetchAuthSession,
  fetchUserAttributes,
  updateUserAttributes,
} from '@aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import type { HubCallback } from '@aws-amplify/core';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

// Check if auth is configured
const userPoolId = import.meta.env.VITE_AWS_USER_POOL_ID || '';
const userPoolClientId = import.meta.env.VITE_AWS_USER_POOL_CLIENT_ID || '';
const identityPoolId = import.meta.env.VITE_AWS_IDENTITY_POOL_ID || '';
const region = import.meta.env.VITE_AWS_REGION || '';

const isAuthConfigured = Boolean(userPoolId && userPoolClientId && region);

// Configure Amplify
if (isAuthConfigured) {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
        identityPoolId,
      },
    },
  });
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  name: string
): Promise<{ needsConfirmation: boolean }> {
  if (!isAuthConfigured) {
    throw new Error('Auth not configured');
  }

  const { isSignUpComplete, nextStep } = await signUp({
    username: email,
    password,
    options: {
      userAttributes: {
        email,
        name,
      },
    },
  });

  return {
    needsConfirmation: !isSignUpComplete && nextStep.signUpStep === 'CONFIRM_SIGN_UP',
  };
}

/**
 * Confirm sign up with verification code
 */
export async function confirmSignUpWithCode(
  email: string,
  code: string
): Promise<void> {
  if (!isAuthConfigured) {
    throw new Error('Auth not configured');
  }

  await confirmSignUp({
    username: email,
    confirmationCode: code,
  });
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthUser> {
  if (!isAuthConfigured) {
    throw new Error('Auth not configured');
  }

  const { isSignedIn } = await signIn({
    username: email,
    password,
  });

  if (!isSignedIn) {
    throw new Error('Sign in failed');
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error('Failed to get user after sign in');
  }

  return user;
}

/**
 * Update user's display name
 */
export async function updateDisplayName(name: string): Promise<void> {
  if (!isAuthConfigured) return;

  await updateUserAttributes({
    userAttributes: {
      name,
    },
  });
}

/**
 * Sign out the current user
 */
export async function signOutUser(): Promise<void> {
  if (!isAuthConfigured) return;
  await signOut();
}

/**
 * Get the current authenticated user
 */
export async function getAuthenticatedUser(): Promise<AuthUser | null> {
  if (!isAuthConfigured) return null;

  try {
    const user = await getCurrentUser();
    const attributes = await fetchUserAttributes();

    return {
      id: user.userId,
      email: attributes.email || '',
      name: attributes.name || attributes.email?.split('@')[0] || 'Player',
    };
  } catch {
    return null;
  }
}

/**
 * Get the current auth session (for AWS credentials)
 */
export async function getAuthSession() {
  if (!isAuthConfigured) return null;

  try {
    const session = await fetchAuthSession();
    return session;
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getAuthenticatedUser();
  return user !== null;
}

/**
 * Listen for auth events
 */
export function onAuthStateChange(
  callback: (event: 'signIn' | 'signOut', user: AuthUser | null) => void
): () => void {
  if (!isAuthConfigured) {
    return () => {};
  }

  const hubCallback: HubCallback = async (data) => {
    const { payload } = data;
    switch (payload.event) {
      case 'signedIn': {
        const user = await getAuthenticatedUser();
        callback('signIn', user);
        break;
      }
      case 'signedOut':
        callback('signOut', null);
        break;
    }
  };

  const unsubscribe = Hub.listen('auth', hubCallback);

  return unsubscribe;
}
