/**
 * Data Transformers
 * Transform Balena API responses to dashboard format
 */

import {
  BalenaDevice,
  BalenaApplication,
  BalenaRelease,
  BalenaDeviceTag,
  SupervisorMetrics,
  Device,
  Application,
  Release,
  DeviceMetrics,
} from './types';

/**
 * Parse device type category from device type name
 */
export function parseDeviceTypeCategory(deviceType: string): 'Raspberry Pi' | 'Compute Module' {
  const lowerType = deviceType.toLowerCase();
  if (lowerType.includes('compute module') || lowerType.includes('cm')) {
    return 'Compute Module';
  }
  return 'Raspberry Pi';
}

/**
 * Format timestamp to relative time string
 */
export function formatRelativeTime(timestamp?: string): string {
  if (!timestamp) {
    return 'Never';
  }

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Just now';
  }
  if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  }
  if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Parse venue IDs from device tags
 */
export function parseVenueIdsFromTags(tags: BalenaDeviceTag[]): string[] {
  if (!tags || tags.length === 0) {
    return [];
  }

  // Look for tag with key 'venue_id' or 'venue_ids'
  const venueTag = tags.find(
    (tag) => tag.tag_key === 'venue_id' || tag.tag_key === 'venue_ids'
  );

  if (!venueTag) {
    return [];
  }

  // If comma-separated, split it
  if (venueTag.value.includes(',')) {
    return venueTag.value.split(',').map((id) => id.trim()).filter(Boolean);
  }

  return [venueTag.value];
}

/**
 * Transform Balena device to dashboard Device format
 */
export function transformDevice(balenaDevice: BalenaDevice): Device {
  const deviceType = balenaDevice.is_of__device_type?.name || 'Unknown';
  const deviceTypeCategory = parseDeviceTypeCategory(deviceType);
  
  // Determine status
  let status: 'online' | 'offline' | 'idle' = 'offline';
  if (balenaDevice.is_online) {
    status = 'online';
  } else if (balenaDevice.is_active && !balenaDevice.is_online) {
    status = 'idle';
  }

  // Get current version from release
  const currentVersion = balenaDevice.should_be_running__release?.release_version || 'unknown';

  // Get application name
  const application = balenaDevice.belongs_to__application?.app_name || 'Unassigned';
  const applicationId = balenaDevice.belongs_to__application?.id.toString();

  // Parse venue IDs from tags
  const venueIds = parseVenueIdsFromTags(balenaDevice.device_tag || []);

  // Get tags (excluding venue_id tags)
  const tags = (balenaDevice.device_tag || [])
    .filter((tag) => tag.tag_key !== 'venue_id' && tag.tag_key !== 'venue_ids')
    .map((tag) => tag.value);

  // Format last seen
  const lastSeen = formatRelativeTime(
    balenaDevice.last_connectivity_event || balenaDevice.last_vpn_event
  );

  return {
    id: balenaDevice.id.toString(),
    name: balenaDevice.device_name,
    uuid: balenaDevice.uuid,
    status,
    application,
    applicationId,
    deviceType,
    deviceTypeCategory,
    currentVersion,
    cpuUsage: 0, // Will be populated from Supervisor API
    memoryUsage: 0,
    memoryTotal: 0,
    memoryUsed: 0,
    storageUsage: 0,
    storageTotal: 0,
    storageUsed: 0,
    temperature: 0,
    lastSeen,
    tags,
    osVersion: balenaDevice.os_version,
    supervisorVersion: balenaDevice.supervisor_version,
    venueIds,
  };
}

/**
 * Transform Balena application to dashboard Application format
 */
export function transformApplication(
  balenaApp: BalenaApplication,
  devices: Device[] = []
): Application {
  const appDevices = devices.filter((d) => d.applicationId === balenaApp.id.toString());
  const onlineDevices = appDevices.filter((d) => d.status === 'online').length;
  const offlineDevices = appDevices.filter((d) => d.status === 'offline').length;

  // Calculate average metrics
  const onlineDevicesWithMetrics = appDevices.filter(
    (d) => d.status === 'online' && d.cpuUsage > 0
  );
  const avgCpuUsage = onlineDevicesWithMetrics.length > 0
    ? Math.round(
        onlineDevicesWithMetrics.reduce((sum, d) => sum + d.cpuUsage, 0) /
          onlineDevicesWithMetrics.length
      )
    : 0;
  const avgMemoryUsage = onlineDevicesWithMetrics.length > 0
    ? Math.round(
        onlineDevicesWithMetrics.reduce((sum, d) => sum + d.memoryUsage, 0) /
          onlineDevicesWithMetrics.length
      )
    : 0;

  // Get tags
  const tags = (balenaApp.application_tag || []).map((tag) => tag.value);

  // Determine status
  const status: 'running' | 'stopped' = onlineDevices > 0 ? 'running' : 'stopped';

  return {
    id: balenaApp.id.toString(),
    name: balenaApp.app_name,
    slug: balenaApp.slug,
    deviceType: balenaApp.is_for__device_type?.name || 'Unknown',
    deviceCount: appDevices.length,
    onlineDevices,
    offlineDevices,
    status,
    release: 'unknown', // Will be populated from release data
    commit: 'unknown',
    createdAt: new Date().toISOString(), // Will be populated from API
    updatedAt: new Date().toISOString(),
    tags,
    avgCpuUsage,
    avgMemoryUsage,
  };
}

/**
 * Transform Balena release to dashboard Release format
 */
export function transformRelease(
  balenaRelease: BalenaRelease,
  deviceCount: number = 0
): Release {
  // Calculate total image size
  const totalSize = (balenaRelease.release_image || []).reduce(
    (sum, img) => sum + (img.image_size || 0),
    0
  );
  const sizeMB = (totalSize / 1024 / 1024).toFixed(0);
  const size = `${sizeMB}MB`;

  // Get device type from application
  const deviceType = balenaRelease.belongs_to__application?.device_type || 'Unknown';

  // Get repository (would need to be extracted from release_image or application)
  const repository = balenaRelease.belongs_to__application?.slug
    ? `registry.example.com/${balenaRelease.belongs_to__application.slug}`
    : 'unknown';

  return {
    id: balenaRelease.id.toString(),
    name: balenaRelease.belongs_to__application?.app_name || 'unknown',
    tag: balenaRelease.release_version || `commit-${balenaRelease.commit.substring(0, 7)}`,
    repository,
    size,
    createdAt: new Date().toISOString(), // Will be populated from API if available
    updatedAt: new Date().toISOString(),
    deviceType,
    status: 'available',
    deployedDevices: deviceCount,
  };
}

/**
 * Transform Supervisor metrics to dashboard DeviceMetrics format
 */
export function transformDeviceMetrics(supervisorData: SupervisorMetrics): DeviceMetrics {
  const memoryUsage = supervisorData.memory_total && supervisorData.memory_used
    ? Math.round((supervisorData.memory_used / supervisorData.memory_total) * 100)
    : 0;

  const storageUsage = supervisorData.storage_total && supervisorData.storage_used
    ? Math.round((supervisorData.storage_used / supervisorData.storage_total) * 100)
    : 0;

  return {
    cpuUsage: supervisorData.cpu_usage || 0,
    memoryUsage,
    memoryTotal: supervisorData.memory_total || 0,
    memoryUsed: supervisorData.memory_used || 0,
    storageUsage,
    storageTotal: supervisorData.storage_total || 0,
    storageUsed: supervisorData.storage_used || 0,
    temperature: supervisorData.temperature || 0,
  };
}

