/**
 * Application API Service
 */

import { get, post, patch, del, expand } from './client';
import { BalenaApplication, Application, CreateApplicationInput, Device } from './types';
import { transformApplication } from './transformers';
import { getDevices } from './devices';

/**
 * Get all applications
 */
export async function getApplications(): Promise<Application[]> {
  const params = {
    $expand: expand('is_for__device_type', 'application_tag'),
    $orderby: 'app_name asc',
  };

  const applications = await get<BalenaApplication[]>('/application', { params });
  
  // Get all devices to calculate metrics
  const devices = await getDevices();
  
  return applications.map((app) => transformApplication(app, devices));
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

