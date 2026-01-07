/**
 * API Route for Devices using Balena SDK
 * Server-side only - uses authenticated SDK instance
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSdk } from '../../../lib/balena/sdk-auth';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated SDK instance (uses token from HTTP-only cookie)
    const balena = await getAuthenticatedSdk();

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const applicationFilter = searchParams.get('application');
    const deviceTypeFilter = searchParams.get('deviceType');

    // Fetch devices using SDK model methods (same pattern as applications route)
    let devices: any[] = [];

    try {
      // Get all applications first (needed for both fetching devices and lookup)
      const applications = await balena.models.application.getAll({});
      console.log(`Found ${applications.length} applications`);

      // Create applications map for lookup
      const applicationsMap = new Map(applications.map((app: any) => [app.id, app]));

      // Get devices for each application
      const devicePromises = applications.map(async (app: any) => {
        try {
          return await balena.models.device.getAllByApplication(app.id);
        } catch (error) {
          console.warn(`Error fetching devices for application ${app.id}:`, error);
          return [];
        }
      });
      
      const deviceArrays = await Promise.all(devicePromises);
      devices = deviceArrays.flat();
      console.log(`SDK fetched ${devices.length} devices`);

      // Transform devices to match our Device interface format
      let transformedDevices = devices.map((d: any) => {
        // Get application info - SDK model methods return belongs_to__application as ID reference
        const applicationId = typeof d.belongs_to__application === 'object' 
          ? d.belongs_to__application?.id 
          : d.belongs_to__application;
        const application = applicationId ? applicationsMap.get(applicationId) : null;
        const applicationName = application?.app_name || 'Unknown';
        const applicationIdStr = applicationId?.toString() || '';

        // Get device type - SDK might return as ID reference or object
        let deviceType = 'Unknown';
        if (d.is_of__device_type) {
          if (typeof d.is_of__device_type === 'object') {
            deviceType = d.is_of__device_type?.name || d.is_of__device_type?.slug || 'Unknown';
          } else {
            deviceType = 'Unknown'; // If it's just an ID, we'd need to fetch it separately
          }
        }

        // Get release info
        const release = d.should_be_running__release;
        const currentVersion = release?.release_version || 
                              (release?.commit ? `commit-${release.commit.substring(0, 7)}` : 'unknown');

        // Get tags - SDK model methods might not include tags, so we'll set empty array
        // Tags can be fetched separately if needed
        const tags: string[] = [];
        const venueIds: string[] = [];

        return {
          id: d.id.toString(),
          name: d.device_name || d.name || `Device ${d.id}`,
          uuid: d.uuid || '',
          status: d.is_online ? 'online' as const : 'offline' as const,
          application: applicationName,
          applicationId: applicationIdStr,
          deviceType,
          deviceTypeCategory: deviceType.toLowerCase().includes('raspberry') ? 'Raspberry Pi' as const : 'Compute Module' as const,
          currentVersion,
          cpuUsage: 0, // Will be populated by metrics if available
          memoryUsage: 0,
          memoryTotal: 0,
          memoryUsed: 0,
          storageUsage: 0,
          storageTotal: 0,
          storageUsed: 0,
          temperature: 0,
          lastSeen: d.last_connectivity_event || d.modified_at || new Date().toISOString(),
          tags,
          osVersion: d.os_version || 'BalenaOS',
          supervisorVersion: d.supervisor_version || 'Unknown',
          venueIds,
        };
      });

      // Apply filters in JavaScript
      if (statusFilter && statusFilter !== 'all') {
        transformedDevices = transformedDevices.filter((d) => {
          if (statusFilter === 'online') return d.status === 'online';
          if (statusFilter === 'offline') return d.status === 'offline';
          return true;
        });
      }

      if (applicationFilter && applicationFilter !== 'all') {
        transformedDevices = transformedDevices.filter((d) => d.application === applicationFilter);
      }

      if (deviceTypeFilter && deviceTypeFilter !== 'all') {
        transformedDevices = transformedDevices.filter((d) => {
          const deviceTypeLower = d.deviceType.toLowerCase();
          if (deviceTypeFilter === 'Raspberry Pi') {
            return deviceTypeLower.includes('raspberry');
          }
          if (deviceTypeFilter === 'Compute Module') {
            return deviceTypeLower.includes('compute') || deviceTypeLower.includes('module');
          }
          return true;
        });
      }

      // Sort by device name
      transformedDevices.sort((a, b) => a.name.localeCompare(b.name));

      console.log(`Returning ${transformedDevices.length} transformed devices`);

      return NextResponse.json(transformedDevices);
    } catch (sdkError) {
      console.error('SDK methods failed:', sdkError);
      throw sdkError;
    }
  } catch (error: unknown) {
    console.error('Get devices error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch devices';
    
    // Check if it's an authentication error
    if (errorMessage.includes('401') || errorMessage.includes('unauthorized') || errorMessage.includes('Authentication') || errorMessage.includes('Not authenticated')) {
      return NextResponse.json(
        { error: 'Authentication failed. Please login again.' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

