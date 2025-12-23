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
 */
export async function login(email: string, password: string): Promise<AuthToken> {
  try {
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

