/**
 * Device API Service
 */

import { get, post, patch, del, expand, filter, select, orderBy } from './client';
import { BalenaDevice, Device, DeviceFilters, UpdateDeviceInput } from './types';
import { transformDevice } from './transformers';

/**
 * Get all devices with optional filters
 */
export async function getDevices(filters?: DeviceFilters): Promise<Device[]> {
  const params: Record<string, string> = {
    $expand: expand('belongs_to__application', 'is_of__device_type', 'should_be_running__release', 'device_tag'),
    $orderby: orderBy('device_name', 'asc'),
  };

  // Apply filters
  if (filters) {
    const filterConditions: string[] = [];

    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'online') {
        filterConditions.push('is_online eq true');
      } else if (filters.status === 'offline') {
        filterConditions.push('is_online eq false');
      }
      // 'idle' status would need additional logic
    }

    if (filters.application) {
      filterConditions.push(`belongs_to__application/app_name eq '${filters.application}'`);
    }

    if (filters.deviceType) {
      filterConditions.push(`is_of__device_type/name eq '${filters.deviceType}'`);
    }

    if (filterConditions.length > 0) {
      params.$filter = filterConditions.join(' and ');
    }
  }

  const devices = await get<BalenaDevice[]>('/device', { params });
  return devices.map(transformDevice);
}

/**
 * Get a single device by ID
 */
export async function getDevice(id: string): Promise<Device> {
  const params = {
    $expand: expand('belongs_to__application', 'is_of__device_type', 'should_be_running__release', 'device_tag'),
  };

  const device = await get<BalenaDevice>(`/device(${id})`, { params });
  return transformDevice(device);
}

/**
 * Get a device by UUID
 */
export async function getDeviceByUuid(uuid: string): Promise<Device> {
  const params = {
    $filter: filter(`uuid eq '${uuid}'`),
    $expand: expand('belongs_to__application', 'is_of__device_type', 'should_be_running__release', 'device_tag'),
  };

  const devices = await get<BalenaDevice[]>('/device', { params });
  if (devices.length === 0) {
    throw new Error(`Device with UUID ${uuid} not found`);
  }
  return transformDevice(devices[0]);
}

/**
 * Update device
 */
export async function updateDevice(id: string, data: UpdateDeviceInput): Promise<Device> {
  const params = {
    $expand: expand('belongs_to__application', 'is_of__device_type', 'should_be_running__release', 'device_tag'),
  };

  const device = await patch<BalenaDevice>(`/device(${id})`, data, { params });
  return transformDevice(device);
}

/**
 * Delete device
 */
export async function deleteDevice(id: string): Promise<void> {
  await del(`/device(${id})`);
}

