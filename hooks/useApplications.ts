'use client';

import { useState, useEffect, useCallback } from 'react';
import { getApplications, Application, ApplicationFilters } from '../lib/balena';

export function useApplications(filters?: ApplicationFilters) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getApplications(filters);
      setApplications(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch applications'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      await fetchApplications();
      if (cancelled) return;
    }

    fetch();

    return () => {
      cancelled = true;
    };
  }, [fetchApplications]);

  return {
    applications,
    loading,
    error,
    refetch: fetchApplications,
  };
}

