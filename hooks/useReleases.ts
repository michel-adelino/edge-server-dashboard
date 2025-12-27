'use client';

import { useState, useEffect, useCallback } from 'react';
import { getReleases, Release, ReleaseFilters } from '../lib/balena';

export function useReleases(filters?: ReleaseFilters) {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReleases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getReleases(filters);
      setReleases(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch releases'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

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

