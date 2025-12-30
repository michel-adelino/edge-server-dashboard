/**
 * Device API Service
 * Now uses Next.js API route instead of direct API calls
 */

import { Device, DeviceFilters, UpdateDeviceInput } from './types';

/**
 * Get all devices with optional filters
 * Now uses Next.js API route instead of direct API calls
 */
export async function getDevices(filters?: DeviceFilters): Promise<Device[]> {
  // Build query parameters
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== 'all') {
    params.append('status', filters.status);
  }
  if (filters?.application && filters.application !== 'all') {
    params.append('application', filters.application);
  }
  if (filters?.deviceType && filters.deviceType !== 'all') {
    params.append('deviceType', filters.deviceType);
  }

  const queryString = params.toString();
  const url = `/api/devices${queryString ? `?${queryString}` : ''}`;

  // Call Next.js API route (authentication via HTTP-only cookie)
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for authentication
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch devices');
  }

  const devices = await response.json();
  return devices as Device[];
}

/**
 * Get a single device by ID
 * Now uses Next.js API route
 */
export async function getDevice(id: string): Promise<Device> {
  // Get all devices and filter by ID
  const devices = await getDevices();
  const device = devices.find((d) => d.id === id);
  
  if (!device) {
    throw new Error(`Device with ID ${id} not found`);
  }
  
  return device;
}

/**
 * Get a device by UUID
 * Now uses Next.js API route
 */
export async function getDeviceByUuid(uuid: string): Promise<Device> {
  // Get all devices and filter by UUID
  const devices = await getDevices();
  const device = devices.find((d) => d.uuid === uuid);
  
  if (!device) {
    throw new Error(`Device with UUID ${uuid} not found`);
  }
  
  return device;
}

/**
 * Update device
 * TODO: Create API route for device updates
 */
export async function updateDevice(id: string, data: UpdateDeviceInput): Promise<Device> {
  // For now, throw an error indicating this needs to be implemented
  throw new Error('Device update not yet implemented via API route');
}

/**
 * Delete device
 * TODO: Create API route for device deletion
 */
export async function deleteDevice(id: string): Promise<void> {
  // For now, throw an error indicating this needs to be implemented
  throw new Error('Device deletion not yet implemented via API route');
}

