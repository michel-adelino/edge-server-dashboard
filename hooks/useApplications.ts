'use client';

import { useState, useEffect } from 'react';
import { getApplications, Application } from '../lib/balena';

export function useApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchApplications() {
      try {
        setLoading(true);
        setError(null);
        const data = await getApplications();
        if (!cancelled) {
          setApplications(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to fetch applications'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchApplications();

    return () => {
      cancelled = true;
    };
  }, []);

  return { applications, loading, error, refetch: () => {
    setLoading(true);
    getApplications()
      .then(setApplications)
      .catch((err) => setError(err instanceof Error ? err : new Error('Failed to fetch applications')))
      .finally(() => setLoading(false));
  } };
}

