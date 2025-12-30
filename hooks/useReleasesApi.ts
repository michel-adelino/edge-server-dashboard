'use client';

import { useState, useEffect, useCallback } from 'react';
import { getToken } from '../lib/balena/auth';

export interface Release {
  id: string;
  commit: string;
  createdAt: string;
  status: string;
  version: string;
  isFinal: boolean;
  applicationId: string;
  applicationName: string;
}

export function useReleasesApi(appId?: string) {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReleases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required. Please login first.');
      }

      // Build query parameters
      const params = new URLSearchParams();
      if (appId) {
        params.append('appId', appId);
      }

      // Authentication via HTTP-only cookie
      const response = await fetch(`/api/releases?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch releases: ${response.statusText}`);
      }

      const data = await response.json();
      setReleases(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch releases'));
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      await fetchReleases();
      if (cancelled) return;
    }

    fetch();

    return () => {
      cancelled = true;
    };
  }, [fetchReleases]);

  return {
    releases,
    loading,
    error,
    refetch: fetchReleases,
  };
}

