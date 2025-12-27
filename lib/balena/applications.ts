/**
 * Application API Service
 */

import { get, post, patch, del, expand, filter } from './client';
import { BalenaApplication, Application, CreateApplicationInput, Device, ApplicationFilters } from './types';
import { transformApplication } from './transformers';
import { getDevices } from './devices';

/**
 * Get all applications with optional filters
 */
export async function getApplications(filters?: ApplicationFilters): Promise<Application[]> {
  const params: Record<string, string> = {
    $expand: expand('is_for__device_type', 'application_tag'),
    $orderby: 'app_name asc',
  };

  // Apply filters
  if (filters) {
    const filterConditions: string[] = [];

    // Note: Status filtering for applications is complex as it's derived from device status.
    // We'll filter after fetching based on device status.
    // Search filter can be applied via OData if needed, but for now we'll do client-side filtering.

    if (filterConditions.length > 0) {
      params.$filter = filterConditions.join(' and ');
    }
  }

  const applications = await get<BalenaApplication[]>('/application', { params });
  
  // Get all devices to calculate metrics
  const devices = await getDevices();
  
  let transformedApps = applications.map((app) => transformApplication(app, devices));

  // Apply client-side filters
  if (filters) {
    if (filters.status) {
      transformedApps = transformedApps.filter((app) => app.status === filters.status);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      transformedApps = transformedApps.filter(
        (app) =>
          app.name.toLowerCase().includes(searchLower) ||
          app.slug.toLowerCase().includes(searchLower)
      );
    }
  }
  
  return transformedApps;
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
 */
export async function createApplication(data: CreateApplicationInput): Promise<Application> {
  const payload = {
    app_name: data.name,
    device_type: data.deviceType,
    application_type: data.applicationType || 'microservices',
  };

  const params = {
    $expand: expand('is_for__device_type', 'application_tag'),
  };

  const application = await post<BalenaApplication>('/application', payload, { params });
  return transformApplication(application);
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

