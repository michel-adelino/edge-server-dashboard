'use client';

import { useState, useEffect } from 'react';
import { getDeviceMetrics } from '../lib/balena/supervisor';
import { DeviceMetrics } from '../lib/balena/types';
import { BalenaNetworkError } from '../lib/balena/errors';

/**
 * Hook to fetch device metrics from Supervisor API
 * Note: Requires device IP address or UUID (will try to resolve via device tags)
 */
export function useDeviceMetrics(
  deviceId: string,
  deviceIp?: string,
  options?: {
    enabled?: boolean;
    refreshInterval?: number;
  }
) {
  const [metrics, setMetrics] = useState<DeviceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const enabled = options?.enabled !== false;
  const refreshInterval = options?.refreshInterval || 30000; // Default 30 seconds

  useEffect(() => {
    if (!enabled || !deviceIp) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let intervalId: NodeJS.Timeout | null = null;

    async function fetchMetrics() {
      if (!deviceIp) return;
      
      try {
        setError(null);
        const data = await getDeviceMetrics(deviceIp);
        if (!cancelled) {
          setMetrics(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          // Don't show network errors as critical - device might just be offline
          if (err instanceof BalenaNetworkError) {
            setError(err);
          } else {
            setError(err instanceof Error ? err : new Error('Failed to fetch metrics'));
          }
          setLoading(false);
        }
      }
    }

    // Initial fetch
    fetchMetrics();

    // Set up polling if refresh interval is set
    if (refreshInterval > 0) {
      intervalId = setInterval(fetchMetrics, refreshInterval);
    }

    return () => {
      cancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [deviceId, deviceIp, enabled, refreshInterval]);

  return { metrics, loading, error, refetch: () => {
    if (deviceIp) {
      setLoading(true);
      getDeviceMetrics(deviceIp)
        .then(setMetrics)
        .catch((err) => setError(err instanceof Error ? err : new Error('Failed to fetch metrics')))
        .finally(() => setLoading(false));
    }
  } };
}

