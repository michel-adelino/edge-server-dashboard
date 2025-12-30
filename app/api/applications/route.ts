/**
 * API Route for Applications using Balena SDK
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
    const searchQuery = searchParams.get('search');

    // Fetch applications using SDK
    let applications: any[] = [];
    let devices: any[] = [];

    try {
      // Get all applications using SDK
      applications = await balena.models.application.getAll({});
      console.log(`SDK fetched ${applications.length} applications`);

      // Get devices - try to get all devices per application
      try {
        const devicePromises = applications.map(async (app: any) => {
          try {
            return await balena.models.device.getAllByApplication(app.id);
          } catch {
            return [];
          }
        });
        
        const deviceArrays = await Promise.all(devicePromises);
        devices = deviceArrays.flat();
        console.log(`Fetched ${devices.length} devices`);
      } catch (deviceError) {
        console.warn('Error fetching devices (non-critical):', deviceError);
        // Continue without device data
      }
    } catch (sdkError) {
      console.error('SDK methods failed:', sdkError);
      throw sdkError;
    }

    // Transform devices to match our Device interface format
    const transformedDevices = devices.map((d: any) => ({
      id: d.id.toString(),
      applicationId: d.belongs_to__application?.id?.toString() || '',
      status: d.is_online ? 'online' as const : 'offline' as const,
      cpuUsage: 0,
      memoryUsage: 0,
    }));

    // Transform applications
    const transformedApplications = applications.map((app: any) => {
      const appDevices = transformedDevices.filter((d) => d.applicationId === app.id.toString());
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
      const tags = (app.application_tag || []).map((tag: any) => {
        if (typeof tag === 'string') return tag;
        return tag.value || tag.tag_value || '';
      });

      // Determine status
      const status: 'running' | 'stopped' = onlineDevices > 0 ? 'running' : 'stopped';

      // Get device type name
      const deviceType = app.is_for__device_type?.name || 
                        app.device_type || 
                        app.is_for__device_type?.slug ||
                        'Unknown';

      return {
        id: app.id.toString(),
        name: app.app_name || app.name,
        slug: app.slug,
        deviceType,
        deviceCount: appDevices.length,
        onlineDevices,
        offlineDevices,
        status,
        release: 'unknown',
        commit: 'unknown',
        createdAt: app.created_at ? new Date(app.created_at).toISOString() : new Date().toISOString(),
        updatedAt: app.modified_at ? new Date(app.modified_at).toISOString() : new Date().toISOString(),
        tags,
        avgCpuUsage,
        avgMemoryUsage,
      };
    });

    // Apply filters
    let filteredApplications = transformedApplications;
    if (statusFilter && statusFilter !== 'all') {
      filteredApplications = filteredApplications.filter((app) => app.status === statusFilter);
    }
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filteredApplications = filteredApplications.filter(
        (app) =>
          app.name.toLowerCase().includes(searchLower) ||
          app.slug.toLowerCase().includes(searchLower)
      );
    }

    console.log(`Returning ${filteredApplications.length} filtered applications`);

    return NextResponse.json(filteredApplications);
  } catch (error: unknown) {
    console.error('Get applications error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch applications';
    
    // Check if it's an authentication error
    if (errorMessage.includes('401') || errorMessage.includes('unauthorized') || errorMessage.includes('Authentication')) {
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
