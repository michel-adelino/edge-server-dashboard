/**
 * Release/Image API Service
 */

import { get, post, expand } from './client';
import { BalenaRelease, Release } from './types';
import { transformRelease } from './transformers';
import { getDevices } from './devices';

/**
 * Get all releases, optionally filtered by application
 */
export async function getReleases(appId?: string): Promise<Release[]> {
  const params: Record<string, string> = {
    $expand: expand('belongs_to__application', 'release_image'),
    $orderby: 'created_at desc',
  };

  if (appId) {
    params.$filter = `belongs_to__application/id eq ${appId}`;
  }

  const releases = await get<BalenaRelease[]>('/release', { params });
  
  // Get device counts for each release
  const devices = await getDevices();
  
  return releases.map((release) => {
    const releaseDevices = devices.filter(
      (d) => d.currentVersion === (release.release_version || `commit-${release.commit.substring(0, 7)}`)
    );
    return transformRelease(release, releaseDevices.length);
  });
}

/**
 * Get a single release by ID
 */
export async function getRelease(id: string): Promise<Release> {
  const params = {
    $expand: expand('belongs_to__application', 'release_image'),
  };

  const release = await get<BalenaRelease>(`/release(${id})`, { params });
  
  // Get device count
  const devices = await getDevices();
  const releaseDevices = devices.filter(
    (d) => d.currentVersion === (release.release_version || `commit-${release.commit.substring(0, 7)}`)
  );
  
  return transformRelease(release, releaseDevices.length);
}

/**
 * Create a new release (deploy image)
 */
export async function createRelease(
  appId: string,
  imageUrl: string
): Promise<Release> {
  // Note: Creating releases via API may require specific Balena API endpoints
  // This is a placeholder - actual implementation depends on Balena API capabilities
  const payload = {
    belongs_to__application: appId,
    // Additional fields may be required
  };

  const params = {
    $expand: expand('belongs_to__application', 'release_image'),
  };

  const release = await post<BalenaRelease>('/release', payload, { params });
  return transformRelease(release, 0);
}

/**
 * Deploy a release to a device
 */
export async function deployReleaseToDevice(deviceId: string, releaseId: string): Promise<void> {
  // Update device to point to the new release
  await patch(`/device(${deviceId})`, {
    should_be_running__release: parseInt(releaseId),
  });
}

