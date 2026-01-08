/**
 * API Route for Application Releases using Balena SDK
 * Server-side only - uses authenticated SDK instance
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSdk } from '../../../../../lib/balena/sdk-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const applicationId = params.id;
    
    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    // Get authenticated SDK instance
    const balena = await getAuthenticatedSdk();

    // Get application to find current target release
    const app = await balena.models.application.get(parseInt(applicationId), {
      $select: ['should_be_running__release'],
      $expand: {
        should_be_running__release: {
          $select: ['id'],
        },
      },
    });
    
    // Get the current target release ID from application
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentTargetReleaseId = (app as any).should_be_running__release?.id || 
                                   (app as any).should_be_running__release?.__id || 
                                   null;
    
    // Get devices to count how many are targeting each release
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let devices: any[] = [];
    try {
      devices = await balena.models.device.getAllByApplication(parseInt(applicationId), {
        $select: ['should_be_running__release'],
      });
    } catch (deviceError) {
      console.warn('Failed to fetch devices for release counts (non-critical):', deviceError);
    }
    
    // Count how many devices are targeting each release
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const releaseDeviceCounts = new Map<number, number>();
    devices.forEach((device: any) => {
      const deviceTargetReleaseId = device.should_be_running__release?.id || 
                                    device.should_be_running__release?.__id || 
                                    null;
      if (deviceTargetReleaseId) {
        releaseDeviceCounts.set(deviceTargetReleaseId, (releaseDeviceCounts.get(deviceTargetReleaseId) || 0) + 1);
      }
    });

    // Get releases for this application - use SDK method
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let releases: any[] = [];
    try {
      releases = await balena.models.release.getAllByApplication(parseInt(applicationId));
      // Sort by created_at descending (newest first)
      releases = releases.sort((a: any, b: any) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA; // Descending order
      });
      console.log(`Fetched ${releases.length} releases for application ${applicationId}`);
    } catch (releaseError) {
      console.error('Failed to fetch releases:', releaseError);
      // Don't fail the entire request, but log the error
    }

    // Transform releases to match the expected format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedReleases = releases.map((r: any) => {
      try {
        // Handle version - can be a string or a semver object
        let version: string = '0.0.0';
        const versionRaw = r.release_version || r.version || r.semver;
        if (typeof versionRaw === 'string') {
          version = versionRaw;
        } else if (versionRaw && typeof versionRaw === 'object') {
          // Handle semver object: {raw, build, major, minor, patch, version, prerelease}
          if (versionRaw.raw && typeof versionRaw.raw === 'string') {
            version = versionRaw.raw;
          } else if (versionRaw.version && typeof versionRaw.version === 'string') {
            version = versionRaw.version;
          } else if (versionRaw.major !== undefined) {
            version = `${versionRaw.major || 0}.${versionRaw.minor || 0}.${versionRaw.patch || 0}`;
            if (versionRaw.prerelease) {
              version += `-${versionRaw.prerelease}`;
            }
            if (versionRaw.build) {
              version += `+${versionRaw.build}`;
            }
          } else {
            version = JSON.stringify(versionRaw);
          }
        } else if (versionRaw !== undefined && versionRaw !== null) {
          version = String(versionRaw);
        }
        
        // Check if this is the currently deployed release
        const releaseIdNum = parseInt(String(r.id || r.release_id || '0'));
        const isDeployed = currentTargetReleaseId !== null && releaseIdNum === currentTargetReleaseId;
        const deployedDeviceCount = releaseDeviceCounts.get(releaseIdNum) || 0;
        
        return {
          id: (r.id || r.release_id || '').toString(),
          commit: String(r.commit || r.commit_hash || ''),
          createdAt: String(r.created_at || r.createdAt || new Date().toISOString()),
          status: String(r.status || r.release_status || 'success'),
          version: String(version),
          isFinal: Boolean(r.is_final || r.is_finalized || r.finalized || false),
          isDeployed: isDeployed,
          deployedDeviceCount: deployedDeviceCount,
        };
      } catch (error) {
        console.error('Error transforming release:', error, r);
        // Return a safe fallback
        return {
          id: String(r.id || ''),
          commit: String(r.commit || ''),
          createdAt: new Date().toISOString(),
          status: 'unknown',
          version: '0.0.0',
          isFinal: false,
          isDeployed: false,
          deployedDeviceCount: 0,
        };
      }
    });

    return NextResponse.json(transformedReleases);
  } catch (error: unknown) {
    console.error('Get releases error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch releases';
    
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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const applicationId = params.id;
    const body = await request.json();
    const { releaseId } = body;
    
    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    if (!releaseId) {
      return NextResponse.json(
        { error: 'Release ID is required' },
        { status: 400 }
      );
    }

    const balena = await getAuthenticatedSdk();

    // Deploy release to application by updating all devices in the application
    // First, get all devices in the application
    const devices = await balena.models.device.getAllByApplication(parseInt(applicationId));
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deviceIds = devices.map((device: any) => device.id);
    
    if (deviceIds.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No devices found in application' 
      });
    }
    
    // Try batch operation first (more efficient)
    try {
      // Use pinToRelease to set all devices to the target release
      // pinToRelease accepts an array of device IDs
      await balena.models.device.pinToRelease(deviceIds, parseInt(releaseId));
      console.log(`Deployed release ${releaseId} to ${deviceIds.length} devices in application ${applicationId} (batch)`);
    } catch (batchError: any) {
      // If batch operation fails (e.g., socket errors), fall back to individual updates
      console.warn('Batch pinToRelease failed, trying individual updates:', batchError);
      
      // Update devices one at a time as fallback
      let successCount = 0;
      let failureCount = 0;
      const errors: string[] = [];
      
      // Try individual SDK updates first
      for (const deviceId of deviceIds) {
        try {
          await balena.models.device.pinToRelease(deviceId, parseInt(releaseId));
          successCount++;
        } catch (individualError: any) {
          // If SDK method fails, try using Pine client directly as last resort
          try {
            if (balena.pine && typeof balena.pine.patch === 'function') {
              await balena.pine.patch({
                resource: 'device',
                id: deviceId,
                body: {
                  should_be_running__release: parseInt(releaseId),
                },
              });
              successCount++;
              console.log(`Updated device ${deviceId} using Pine client fallback`);
            } else {
              throw individualError; // Re-throw if Pine client not available
            }
          } catch (pineError: any) {
            // Both SDK and Pine client failed for this device
            failureCount++;
            const errorMsg = `Device ${deviceId}: ${individualError.message || 'Unknown error'}`;
            errors.push(errorMsg);
            console.warn(`Failed to update device ${deviceId} (both SDK and Pine failed):`, individualError, pineError);
          }
        }
      }
      
      if (successCount === 0) {
        // All devices failed
        throw new Error(`Failed to deploy release to any device. Errors: ${errors.join('; ')}`);
      } else if (failureCount > 0) {
        // Some succeeded, some failed
        console.warn(`Deployed release ${releaseId} to ${successCount}/${deviceIds.length} devices. ${failureCount} failed.`);
        // Still return success but log the partial failure
      } else {
        console.log(`Deployed release ${releaseId} to ${successCount} devices in application ${applicationId} (individual)`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Deploy release error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to deploy release';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

