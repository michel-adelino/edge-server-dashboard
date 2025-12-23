/**
 * Supervisor API Client
 * For device metrics and direct device actions
 * Note: Requires VPN access or direct network access to devices
 */

import { getSupervisorUrl } from './config';
import { SupervisorDeviceState, SupervisorMetrics, DeviceMetrics } from './types';
import { transformDeviceMetrics } from './transformers';
import { BalenaNetworkError } from './errors';

/**
 * Get device state from Supervisor API
 */
export async function getDeviceState(deviceIp: string): Promise<SupervisorDeviceState> {
  try {
    const response = await fetch(getSupervisorUrl(deviceIp, '/v1/state'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Supervisor API error: ${response.statusText}`);
    }

    return await response.json();
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
 * Get device metrics from Supervisor API
 */
export async function getDeviceMetrics(deviceIp: string): Promise<DeviceMetrics> {
  try {
    // Supervisor API may not have a dedicated metrics endpoint
    // This might need to be constructed from state and other endpoints
    const state = await getDeviceState(deviceIp);
    
    // Try to get metrics from /v1/device endpoint if available
    const response = await fetch(getSupervisorUrl(deviceIp, '/v1/device'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const deviceData: SupervisorMetrics = await response.json();
      return transformDeviceMetrics(deviceData);
    }

    // Fallback: return empty metrics if endpoint not available
    return {
      cpuUsage: 0,
      memoryUsage: 0,
      memoryTotal: 0,
      memoryUsed: 0,
      storageUsage: 0,
      storageTotal: 0,
      storageUsed: 0,
      temperature: 0,
    };
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
 * Reboot device via Supervisor API
 */
export async function rebootDevice(deviceIp: string): Promise<void> {
  try {
    const response = await fetch(getSupervisorUrl(deviceIp, '/v1/reboot'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to reboot device: ${response.statusText}`);
    }
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
 * Shutdown device via Supervisor API
 */
export async function shutdownDevice(deviceIp: string): Promise<void> {
  try {
    const response = await fetch(getSupervisorUrl(deviceIp, '/v1/shutdown'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to shutdown device: ${response.statusText}`);
    }
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
 * Trigger device update via Supervisor API
 */
export async function triggerUpdate(deviceIp: string): Promise<void> {
  try {
    const response = await fetch(getSupervisorUrl(deviceIp, '/v1/update'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to trigger update: ${response.statusText}`);
    }
  } catch (error) {
    if (error instanceof TypeError) {
      throw new BalenaNetworkError(
        `Cannot connect to device at ${deviceIp}. Ensure VPN is connected or device is accessible.`
      );
    }
    throw error;
  }
}

