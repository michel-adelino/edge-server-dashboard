/**
 * Device Tags Service
 * Used for managing venue IDs and other device metadata
 */

import { get, post, patch, del } from './client';
import { BalenaDeviceTag, DeviceTag } from './types';
import { parseVenueIdsFromTags } from './transformers';

const VENUE_ID_TAG_KEY = 'venue_ids';
const DEVICE_IP_TAG_KEY = 'device_ip'; // Alternative: 'local_ip', 'ip_address'

/**
 * Get all tags for a device
 */
export async function getDeviceTags(deviceId: string): Promise<DeviceTag[]> {
  const params = {
    $filter: `device eq ${deviceId}`,
  };

  const tags = await get<BalenaDeviceTag[]>('/device_tag', { params });
  
  return tags.map((tag) => ({
    id: tag.id.toString(),
    key: tag.tag_key,
    value: tag.value,
    deviceId: deviceId,
  }));
}

/**
 * Create a device tag
 */
export async function createDeviceTag(
  deviceId: string,
  tagKey: string,
  value: string
): Promise<DeviceTag> {
  const payload = {
    device: parseInt(deviceId),
    tag_key: tagKey,
    value: value,
  };

  const tag = await post<BalenaDeviceTag>('/device_tag', payload);
  
  return {
    id: tag.id.toString(),
    key: tag.tag_key,
    value: tag.value,
    deviceId: deviceId,
  };
}

/**
 * Update a device tag
 */
export async function updateDeviceTag(tagId: string, value: string): Promise<DeviceTag> {
  const tag = await patch<BalenaDeviceTag>(`/device_tag(${tagId})`, { value });
  
  return {
    id: tag.id.toString(),
    key: tag.tag_key,
    value: tag.value,
    deviceId: tag.device.toString(),
  };
}

/**
 * Delete a device tag
 */
export async function deleteDeviceTag(tagId: string): Promise<void> {
  await del(`/device_tag(${tagId})`);
}

/**
 * Get venue IDs for a device
 */
export async function getVenueIds(deviceId: string): Promise<string[]> {
  const tags = await getDeviceTags(deviceId);
  const venueTag = tags.find((tag) => tag.key === VENUE_ID_TAG_KEY);
  
  if (!venueTag) {
    return [];
  }

  // Parse comma-separated venue IDs
  if (venueTag.value.includes(',')) {
    return venueTag.value.split(',').map((id) => id.trim()).filter(Boolean);
  }

  return [venueTag.value];
}

/**
 * Set venue IDs for a device
 */
export async function setVenueIds(deviceId: string, venueIds: string[]): Promise<void> {
  const tags = await getDeviceTags(deviceId);
  const venueTag = tags.find((tag) => tag.key === VENUE_ID_TAG_KEY);
  
  const value = venueIds.join(',');

  if (venueTag) {
    // Update existing tag
    await updateDeviceTag(venueTag.id, value);
  } else {
    // Create new tag
    await createDeviceTag(deviceId, VENUE_ID_TAG_KEY, value);
  }
}

/**
 * Get device IP address from tags
 * Falls back to constructing from UUID if not found in tags
 */
export async function getDeviceIp(deviceId: string, deviceUuid?: string): Promise<string | null> {
  const tags = await getDeviceTags(deviceId);
  
  // Try common IP tag keys
  const ipTag = tags.find(
    (tag) =>
      tag.key === DEVICE_IP_TAG_KEY ||
      tag.key === 'local_ip' ||
      tag.key === 'ip_address' ||
      tag.key === 'ip'
  );
  
  if (ipTag) {
    return ipTag.value;
  }
  
  // If no IP tag found, return null (caller should handle)
  // In production, you might want to construct from UUID or use Balena VPN
  return null;
}

