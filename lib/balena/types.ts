/**
 * TypeScript type definitions for Balena API
 */

// Balena API Response Types
export interface BalenaDevice {
  id: number;
  uuid: string;
  device_name: string;
  is_online: boolean;
  is_active: boolean;
  last_connectivity_event?: string;
  last_vpn_event?: string;
  os_version?: string;
  supervisor_version?: string;
  belongs_to__application?: BalenaApplication;
  is_of__device_type?: BalenaDeviceType;
  should_be_running__release?: BalenaRelease;
  device_tag?: BalenaDeviceTag[];
}

export interface BalenaApplication {
  id: number;
  app_name: string;
  slug: string;
  device_type?: string;
  is_for__device_type?: BalenaDeviceType;
  application_tag?: BalenaApplicationTag[];
}

export interface BalenaDeviceType {
  id: number;
  slug: string;
  name: string;
}

export interface BalenaRelease {
  id: number;
  commit: string;
  release_version?: string;
  status: string;
  belongs_to__application?: BalenaApplication;
  release_image?: BalenaReleaseImage[];
}

export interface BalenaReleaseImage {
  id: number;
  image_size?: number;
  dockerfile?: string;
  is_a_build_of__service?: {
    service_name: string;
  };
}

export interface BalenaDeviceTag {
  id: number;
  tag_key: string;
  value: string;
  device: number;
}

export interface BalenaApplicationTag {
  id: number;
  tag_key: string;
  value: string;
  application: number;
}

export interface BalenaAuthResponse {
  id: number;
  username: string;
  email: string;
  token: string;
}

// Supervisor API Types
export interface SupervisorDeviceState {
  status: string;
  download_progress?: number;
  api_port?: number;
  commit?: string;
  update_pending?: boolean;
  update_downloaded?: boolean;
}

export interface SupervisorMetrics {
  cpu_usage?: number;
  memory_usage?: number;
  memory_total?: number;
  memory_used?: number;
  storage_usage?: number;
  storage_total?: number;
  storage_used?: number;
  temperature?: number;
}

// Dashboard Model Types
export interface Device {
  id: string;
  name: string;
  uuid: string;
  status: 'online' | 'offline' | 'idle';
  application: string;
  applicationId?: string;
  deviceType: string;
  deviceTypeCategory: 'Raspberry Pi' | 'Compute Module';
  currentVersion: string;
  cpuUsage: number;
  memoryUsage: number;
  memoryTotal: number;
  memoryUsed: number;
  storageUsage: number;
  storageTotal: number;
  storageUsed: number;
  temperature: number;
  lastSeen: string;
  tags: string[];
  osVersion?: string;
  supervisorVersion?: string;
  venueIds: string[];
}

export interface Application {
  id: string;
  name: string;
  slug: string;
  deviceType: string;
  deviceCount: number;
  onlineDevices: number;
  offlineDevices: number;
  status: 'running' | 'stopped';
  release: string;
  commit: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  avgCpuUsage: number;
  avgMemoryUsage: number;
}

export interface Release {
  id: string;
  name: string;
  tag: string;
  repository: string;
  size: string;
  createdAt: string;
  updatedAt: string;
  deviceType: string;
  status: 'available' | 'deploying' | 'failed';
  deployedDevices: number;
}

export interface DeviceTag {
  id: string;
  key: string;
  value: string;
  deviceId: string;
}

export interface DeviceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  memoryTotal: number;
  memoryUsed: number;
  storageUsage: number;
  storageTotal: number;
  storageUsed: number;
  temperature: number;
}

// Request Types
export interface CreateApplicationInput {
  name: string;
  deviceType: string;
  applicationType?: string;
}

export interface UpdateDeviceInput {
  device_name?: string;
  should_be_running__release?: number;
}

export interface DeviceFilters {
  status?: 'online' | 'offline' | 'idle' | 'all';
  application?: string;
  deviceType?: string;
}

