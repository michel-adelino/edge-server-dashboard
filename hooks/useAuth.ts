'use client';

import { useState, useEffect } from 'react';
import { login, logout, isAuthenticatedSync, getUser, AuthToken } from '../lib/balena';

export function useAuth() {
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<{ id: number; email: string; username: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const isAuth = isAuthenticatedSync();
      const userData = getUser();
      setAuthenticated(isAuth);
      setUser(userData);
    } catch (error) {
      setAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(email: string, password: string): Promise<AuthToken> {
    try {
      const authToken = await login(email, password);
      setAuthenticated(true);
      setUser({
        id: authToken.userId,
        email: authToken.email,
        username: authToken.username,
      });
      return authToken;
    } catch (error) {
      setAuthenticated(false);
      setUser(null);
      throw error;
    }
  }

  async function handleLogout() {
    await logout();
    setAuthenticated(false);
    setUser(null);
  }

  return {
    authenticated,
    user,
    loading,
    login: handleLogin,
    logout: handleLogout,
    refetch: checkAuth,
  };
}

