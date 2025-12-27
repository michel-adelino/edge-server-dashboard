/**
 * Balena API Authentication Service
 * Handles session-based authentication
 */

import { getApiUrl } from './config';
import { BalenaAuthResponse } from './types';
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
 * Login with email and password
 * For now, accepts any email/password for testing (no database)
 * TODO: Replace with actual API call when backend is ready
 */
export async function login(email: string, password: string): Promise<AuthToken> {
  // For testing: Accept any email/password combination
  // In production, this should call the actual API
  // Default to test auth unless explicitly disabled with NEXT_PUBLIC_USE_TEST_AUTH=false
  const testAuthDisabled = process.env.NEXT_PUBLIC_USE_TEST_AUTH === 'false';
  const useTestAuth = !testAuthDisabled;

  if (useTestAuth) {
    // Validate inputs
    if (!email || !password) {
      throw new BalenaAuthError('Email and password are required');
    }

    // Generate a mock token for testing - accept ANY email/password
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

    // Real API call (when backend is available)
    const response = await fetch(getApiUrl('/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new BalenaAuthError('Invalid email or password');
      }
      throw new Error(`Login failed: ${response.statusText}`);
    }

    const data: BalenaAuthResponse = await response.json();

    const authToken: AuthToken = {
      token: data.token,
      userId: data.id,
      email: data.email,
      username: data.username,
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
  } catch (error) {
    handleAPIError(error);
    throw error;
  }
}

/**
 * Logout and clear stored credentials
 */
export async function logout(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
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
export function isAuthenticated(): boolean {
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

