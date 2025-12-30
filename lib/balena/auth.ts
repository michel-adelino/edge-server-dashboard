/**
 * Balena API Authentication Service
 * 
 * Uses Next.js API routes which utilize balena-sdk server-side.
 * This follows the proper pattern: SDK on server, API routes for client.
 * 
 * Reference: https://docs.balena.io/reference/sdk/node-sdk/latest/
 */

import { BalenaAuthError, handleAPIError } from './errors';

const TOKEN_KEY = 'balena_auth_token';
const USER_KEY = 'balena_user';

export interface AuthToken {
  token: string;
  userId: number;
  email: string;
  username: string;
}

/**
 * Login with email and password using balena-sdk
 */
export async function login(email: string, password: string): Promise<AuthToken> {
  // Validate inputs
  if (!email || !password) {
    throw new BalenaAuthError('Email and password are required');
  }

  // For testing: Allow test auth if explicitly enabled
  const useTestAuth = process.env.NEXT_PUBLIC_USE_TEST_AUTH === 'true';
  
  if (useTestAuth) {
    // Generate a mock token for testing
    const mockToken = `test_token_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const mockUsername = email.split('@')[0] || 'user';

    const authToken: AuthToken = {
      token: mockToken,
      userId: 1,
      email: email,
      username: mockUsername,
    };

    // Store token and user info
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, authToken.token);
      localStorage.setItem(USER_KEY, JSON.stringify({
        id: authToken.userId,
        email: authToken.email,
        username: authToken.username,
      }));
    }

    return authToken;
  }

  try {
    // Call Next.js API route which uses balena-sdk server-side
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || response.statusText;
      
      if (response.status === 401) {
        throw new BalenaAuthError('Invalid email or password');
      }
      if (response.status === 403) {
        throw new BalenaAuthError('Access forbidden. Please check your credentials.');
      }
      throw new BalenaAuthError(errorMessage);
    }

    const data = await response.json();
    
    // Token is now stored in HTTP-only cookie, we just track user info client-side
    const authToken: AuthToken = {
      token: 'authenticated', // Just a flag - actual token is in HTTP-only cookie
      userId: data.user?.id || 0,
      email: data.user?.email || email,
      username: data.user?.username || email.split('@')[0] || 'user',
    };

    // Store user info (token is in HTTP-only cookie, not accessible from client)
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, 'authenticated'); // Just a flag
      localStorage.setItem(USER_KEY, JSON.stringify({
        id: authToken.userId,
        email: authToken.email,
        username: authToken.username,
      }));
    }

    return authToken;
  } catch (error: unknown) {
    // Clear any stored auth on error
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    
    // Handle specific error messages
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('Invalid')) {
        throw new BalenaAuthError('Invalid email or password');
      }
      if (error.message.includes('403') || error.message.includes('Forbidden')) {
        throw new BalenaAuthError('Access forbidden. Please check your credentials.');
      }
      if (error instanceof BalenaAuthError) {
        throw error;
      }
    }
    
    handleAPIError(error);
    throw error;
  }
}

/**
 * Logout and clear stored credentials
 */
export async function logout(): Promise<void> {
  try {
    // Call Next.js API route which uses balena-sdk server-side
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {
      // Ignore errors - we'll clear local storage anyway
    });
  } catch {
    // Ignore errors - we'll clear local storage anyway
  } finally {
    // Always clear local storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }
}

/**
 * Get stored authentication token
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Get stored user information
 */
export function getUser(): { id: number; email: string; username: string } | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) {
    return null;
  }
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  return isAuthenticatedSync();
}

/**
 * Synchronous check for authentication (uses token only)
 */
export function isAuthenticatedSync(): boolean {
  return getToken() !== null;
}

/**
 * Refresh authentication token (if needed)
 * Note: Balena API may not support token refresh, this is a placeholder
 */
export async function refreshToken(): Promise<void> {
  // Implementation depends on Balena API token refresh mechanism
  // For now, user needs to login again if token expires
  const token = getToken();
  if (!token) {
    throw new BalenaAuthError('No token available to refresh');
  }
  // Token validation could be done here
}

