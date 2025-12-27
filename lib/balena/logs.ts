/**
 * Logs API Service
 * Fetches logs from Supervisor API or Balena API
 */

import { getSupervisorUrl } from './config';
import { BalenaNetworkError } from './errors';

export interface DeviceLog {
  id: string;
  timestamp: string;
  device: string;
  deviceId: string;
  application: string;
  service: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  details?: string;
}

/**
 * Get logs from Supervisor API
 * Note: Requires device IP address and VPN/local network access
 */
export async function getDeviceLogs(
  deviceIp: string,
  options?: {
    service?: string;
    since?: number; // Unix timestamp in seconds
    limit?: number;
  }
): Promise<DeviceLog[]> {
  try {
    // Supervisor API logs endpoint
    // Note: Actual endpoint may vary based on Supervisor version
    const params = new URLSearchParams();
    if (options?.service) {
      params.append('service', options.service);
    }
    if (options?.since) {
      params.append('since', options.since.toString());
    }
    if (options?.limit) {
      params.append('limit', options.limit.toString());
    }

    const url = getSupervisorUrl(deviceIp, `/v1/logs?${params.toString()}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Supervisor API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform Supervisor API response to DeviceLog format
    // Note: Actual response format may vary
    if (Array.isArray(data)) {
      return data.map((log, index) => ({
        id: `${deviceIp}-${index}-${Date.now()}`,
        timestamp: log.timestamp || new Date().toISOString(),
        device: log.device_name || deviceIp,
        deviceId: log.device_id || '',
        application: log.application || 'unknown',
        service: log.service || log.service_name || 'main',
        level: (log.level || 'info').toLowerCase() as DeviceLog['level'],
        message: log.message || '',
        details: log.details || log.stack || undefined,
      }));
    }

    // If response is not an array, try to parse it
    if (data.logs && Array.isArray(data.logs)) {
      return data.logs.map((log: any, index: number) => ({
        id: `${deviceIp}-${index}-${Date.now()}`,
        timestamp: log.timestamp || new Date().toISOString(),
        device: log.device_name || deviceIp,
        deviceId: log.device_id || '',
        application: log.application || 'unknown',
        service: log.service || log.service_name || 'main',
        level: (log.level || 'info').toLowerCase() as DeviceLog['level'],
        message: log.message || '',
        details: log.details || log.stack || undefined,
      }));
    }

    return [];
  } catch (error) {
    if (error instanceof TypeError) {
      throw new BalenaNetworkError(
        `Cannot connect to device at ${deviceIp}. Ensure VPN is connected or device is accessible.`
      );
    }
    throw error;
  }
}

/**
 * Get logs from Balena API (if available)
 * This is a fallback if Supervisor API is not accessible
 */
export async function getLogsFromBalena(
  deviceId: string,
  options?: {
    since?: number;
    limit?: number;
  }
): Promise<DeviceLog[]> {
  // Note: Balena API may not have a direct logs endpoint
  // This would need to be implemented based on actual Balena API capabilities
  // For now, return empty array as placeholder
  return [];
}

