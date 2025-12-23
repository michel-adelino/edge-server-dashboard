'use client';

import { useState, useEffect } from 'react';
import { getReleases, Release } from '../lib/balena';

export function useReleases(appId?: string) {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchReleases() {
      try {
        setLoading(true);
        setError(null);
        const data = await getReleases(appId);
        if (!cancelled) {
          setReleases(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to fetch releases'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchReleases();

    return () => {
      cancelled = true;
    };
  }, [appId]);

  return { releases, loading, error, refetch: () => {
    setLoading(true);
    getReleases(appId)
      .then(setReleases)
      .catch((err) => setError(err instanceof Error ? err : new Error('Failed to fetch releases')))
      .finally(() => setLoading(false));
  } };
}

