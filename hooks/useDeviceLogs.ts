'use client';

import { useState, useEffect } from 'react';
import { getDeviceLogs, DeviceLog } from '../lib/balena/logs';
import { BalenaNetworkError } from '../lib/balena/errors';

/**
 * Hook to fetch device logs from Supervisor API
 */
export function useDeviceLogs(
  deviceIp: string | null,
  options?: {
    enabled?: boolean;
    service?: string;
    since?: number;
    limit?: number;
    refreshInterval?: number;
  }
) {
  const [logs, setLogs] = useState<DeviceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const enabled = options?.enabled !== false && deviceIp !== null;
  const refreshInterval = options?.refreshInterval || 0; // Default: no auto-refresh

  useEffect(() => {
    if (!enabled || !deviceIp) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let intervalId: NodeJS.Timeout | null = null;

    async function fetchLogs() {
      if (!deviceIp) return;
      
      try {
        setError(null);
        const data = await getDeviceLogs(deviceIp, {
          service: options?.service,
          since: options?.since,
          limit: options?.limit,
        });
        if (!cancelled) {
          setLogs(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          // Don't show network errors as critical - device might just be offline
          if (err instanceof BalenaNetworkError) {
            setError(err);
          } else {
            setError(err instanceof Error ? err : new Error('Failed to fetch logs'));
          }
          setLoading(false);
        }
      }
    }

    // Initial fetch
    fetchLogs();

    // Set up polling if refresh interval is set
    if (refreshInterval > 0) {
      intervalId = setInterval(fetchLogs, refreshInterval);
    }

    return () => {
      cancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [deviceIp, enabled, options?.service, options?.since, options?.limit, refreshInterval]);

  return {
    logs,
    loading,
    error,
    refetch: () => {
      if (deviceIp) {
        setLoading(true);
        getDeviceLogs(deviceIp, {
          service: options?.service,
          since: options?.since,
          limit: options?.limit,
        })
          .then(setLogs)
          .catch((err) => setError(err instanceof Error ? err : new Error('Failed to fetch logs')))
          .finally(() => setLoading(false));
      }
    },
  };
}

