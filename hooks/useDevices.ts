'use client';

import { useState, useEffect } from 'react';
import { getDevices, Device, DeviceFilters } from '../lib/balena';

export function useDevices(filters?: DeviceFilters) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchDevices() {
      try {
        setLoading(true);
        setError(null);
        const data = await getDevices(filters);
        if (!cancelled) {
          setDevices(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to fetch devices'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchDevices();

    return () => {
      cancelled = true;
    };
  }, [JSON.stringify(filters)]);

  return { devices, loading, error, refetch: () => {
    setLoading(true);
    getDevices(filters)
      .then(setDevices)
      .catch((err) => setError(err instanceof Error ? err : new Error('Failed to fetch devices')))
      .finally(() => setLoading(false));
  } };
}

