/**
 * Application API Service
 */

import { get, post, patch, del, expand, filter } from './client';
import { BalenaApplication, Application, CreateApplicationInput, Device, ApplicationFilters } from './types';
import { transformApplication } from './transformers';
import { getDevices } from './devices';
import { getToken } from './auth';

/**
 * Get all applications with optional filters
 * Now uses Next.js API route instead of direct API calls
 */
export async function getApplications(filters?: ApplicationFilters): Promise<Application[]> {
  // Build query parameters
  const params = new URLSearchParams();
  if (filters?.status) {
    params.append('status', filters.status);
  }
  if (filters?.search) {
    params.append('search', filters.search);
  }

  const queryString = params.toString();
  const url = `/api/applications${queryString ? `?${queryString}` : ''}`;

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
    throw new Error(errorData.error || 'Failed to fetch applications');
  }

  const applications = await response.json();
  return applications as Application[];
}

/**
 * Get a single application by ID
 */
export async function getApplication(id: string): Promise<Application> {
  const params = {
    $expand: expand('is_for__device_type', 'application_tag'),
  };

  const application = await get<BalenaApplication>(`/application(${id})`, { params });
  
  // Get devices for this application
  const devices = await getDevices({ application: application.app_name });
  
  return transformApplication(application, devices);
}

/**
 * Create a new application
 * Now uses Next.js API route instead of direct API calls
 */
export async function createApplication(data: CreateApplicationInput): Promise<Application> {
  // Call Next.js API route (authentication via HTTP-only cookie)
  const response = await fetch('/api/applications/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for authentication
    body: JSON.stringify({
      name: data.name,
      deviceType: data.deviceType,
      // applicationType: data.applicationType || 'microservices',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create application');
  }

  const application = await response.json();
  return application as Application;
}

/**
 * Update application
 */
export async function updateApplication(
  id: string,
  data: Partial<CreateApplicationInput>
): Promise<Application> {
  const payload: any = {};
  if (data.name) payload.app_name = data.name;
  if (data.deviceType) payload.device_type = data.deviceType;

  const params = {
    $expand: expand('is_for__device_type', 'application_tag'),
  };

  const application = await patch<BalenaApplication>(`/application(${id})`, payload, { params });
  
  // Get devices for this application
  const devices = await getDevices({ application: application.app_name });
  
  return transformApplication(application, devices);
}

/**
 * Delete application
 */
export async function deleteApplication(id: string): Promise<void> {
  await del(`/application(${id})`);
}

/**
 * Get devices for an application
 */
export async function getApplicationDevices(appId: string): Promise<Device[]> {
  const application = await getApplication(appId);
  return getDevices({ application: application.name });
}

