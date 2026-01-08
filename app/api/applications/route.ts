/**
 * API Route for Applications using Balena SDK
 * Server-side only - uses authenticated SDK instance
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSdk } from '../../../lib/balena/sdk-auth';
import { getDeviceIp } from '../../../lib/balena/tags';
import { getDeviceMetrics } from '../../../lib/balena/supervisor';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated SDK instance (uses token from HTTP-only cookie)
    const balena = await getAuthenticatedSdk();

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const searchQuery = searchParams.get('search');

    // Fetch applications using SDK with expanded data
    let applications: any[] = [];

    try {
      // Get all applications using SDK - expand device type and target release
      applications = await balena.models.application.getAll({
        $expand: {
          is_for__device_type: {
            $select: ['name', 'slug'],
          },
          should_be_running__release: {
            $select: ['id', 'commit', 'release_version'],
          },
        },
      });
      console.log(`SDK fetched ${applications.length} applications`);
    } catch (sdkError) {
      console.error('SDK methods failed:', sdkError);
      throw sdkError;
    }

    // Transform applications - fetch devices and releases per application
    const transformedApplications = await Promise.all(
      applications.map(async (app: any) => {
        // Get devices for this application using SDK
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let appDevices: any[] = [];
        try {
          appDevices = await balena.models.device.getAllByApplication(app.id, {
            $select: ['id', 'is_online', 'uuid'],
          });
        } catch (deviceError) {
          console.warn(`Failed to fetch devices for app ${app.id} (non-critical):`, deviceError);
        }

        const onlineDevices = appDevices.filter((d: any) => d.is_online).length;
        const offlineDevices = appDevices.length - onlineDevices;

        // Fetch metrics for online devices (in parallel, with timeout)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const metricsPromises = appDevices
          .filter((d: any) => d.is_online)
          .slice(0, 10) // Limit to first 10 online devices to avoid too many API calls
          .map(async (device: any) => {
            try {
              const deviceIp = await getDeviceIp(device.id.toString(), device.uuid);
              if (!deviceIp) {
                return null;
              }
              // Fetch metrics with a timeout
              const metrics = await Promise.race([
                getDeviceMetrics(deviceIp),
                new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)), // 2 second timeout
              ]);
              return metrics;
            } catch (error) {
              console.warn(`Failed to fetch metrics for device ${device.id}:`, error);
              return null;
            }
          });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const metricsResults = await Promise.all(metricsPromises);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const validMetrics = metricsResults.filter((m: any) => m !== null && (m.cpuUsage > 0 || m.memoryUsage > 0));

        // Calculate average metrics
        const avgCpuUsage = validMetrics.length > 0
          ? Math.round(validMetrics.reduce((sum: number, m: any) => sum + (m.cpuUsage || 0), 0) / validMetrics.length)
          : 0;
        const avgMemoryUsage = validMetrics.length > 0
          ? Math.round(validMetrics.reduce((sum: number, m: any) => sum + (m.memoryUsage || 0), 0) / validMetrics.length)
          : 0;

        // Get current target release info
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const targetRelease = (app as any).should_be_running__release;
        let releaseVersion = 'unknown';
        let releaseCommit = 'unknown';
        
        if (targetRelease) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const releaseVersionRaw = (targetRelease as any).release_version;
          if (typeof releaseVersionRaw === 'string') {
            releaseVersion = releaseVersionRaw;
          } else if (releaseVersionRaw && typeof releaseVersionRaw === 'object') {
            // Handle semver object
            if (releaseVersionRaw.raw) {
              releaseVersion = releaseVersionRaw.raw;
            } else if (releaseVersionRaw.version) {
              releaseVersion = releaseVersionRaw.version;
            } else if (releaseVersionRaw.major !== undefined) {
              releaseVersion = `${releaseVersionRaw.major || 0}.${releaseVersionRaw.minor || 0}.${releaseVersionRaw.patch || 0}`;
            }
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          releaseCommit = (targetRelease as any).commit || 'unknown';
        } else {
          // If no target release, try to get the latest release
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const releases: any[] = await balena.models.release.getAllByApplication(app.id);
            if (releases.length > 0) {
              // Sort by created_at descending and get the latest
              releases.sort((a: any, b: any) => {
                const dateA = new Date(a.created_at || 0).getTime();
                const dateB = new Date(b.created_at || 0).getTime();
                return dateB - dateA;
              });
              const latestRelease = releases[0];
              const versionRaw = latestRelease.release_version || latestRelease.version || latestRelease.semver;
              if (typeof versionRaw === 'string') {
                releaseVersion = versionRaw;
              } else if (versionRaw && typeof versionRaw === 'object') {
                if (versionRaw.raw) releaseVersion = versionRaw.raw;
                else if (versionRaw.version) releaseVersion = versionRaw.version;
                else if (versionRaw.major !== undefined) {
                  releaseVersion = `${versionRaw.major || 0}.${versionRaw.minor || 0}.${versionRaw.patch || 0}`;
                }
              }
              releaseCommit = latestRelease.commit || latestRelease.commit_hash || 'unknown';
            }
          } catch (releaseError) {
            console.warn(`Failed to fetch releases for app ${app.id} (non-critical):`, releaseError);
          }
        }

        // Get tags using SDK
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let tags: string[] = [];
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const appTags: any[] = await balena.models.application.tags.getAllByApplication(app.id);
          tags = appTags.map((tag: any) => tag.value || tag.tag_value || '');
        } catch (tagError) {
          console.warn(`Failed to fetch tags for app ${app.id} (non-critical):`, tagError);
        }

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
          release: releaseVersion,
          commit: releaseCommit,
          createdAt: app.created_at ? new Date(app.created_at).toISOString() : new Date().toISOString(),
          updatedAt: app.modified_at ? new Date(app.modified_at).toISOString() : new Date().toISOString(),
          tags,
          avgCpuUsage,
          avgMemoryUsage,
        };
      })
    );

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
