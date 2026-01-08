/**
 * API Route for Single Application using Balena SDK
 * Server-side only - uses authenticated SDK instance
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSdk } from '../../../../lib/balena/sdk-auth';

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

    // Get application details - include should_be_running__release to know current target
    const app = await balena.models.application.get(parseInt(applicationId), {
      $select: ['id', 'app_name', 'slug', 'is_for__device_type', 'should_be_running__release', 'created_at', 'modified_at'],
      $expand: {
        is_for__device_type: {
          $select: ['name', 'slug'],
        },
        should_be_running__release: {
          $select: ['id', 'commit', 'release_version'],
        },
      },
    });
    
    // Get the current target release ID from application
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentTargetReleaseId = (app as any).should_be_running__release?.id || 
                                   (app as any).should_be_running__release?.__id || 
                                   null;
    
    // Get devices for this application - include their target release info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let devices: any[] = [];
    try {
      devices = await balena.models.device.getAllByApplication(parseInt(applicationId), {
        $select: ['id', 'device_name', 'uuid', 'is_online', 'last_connectivity_event', 'modified_at', 'should_be_running__release'],
      });
      console.log(`Fetched ${devices.length} devices for application ${applicationId}`);
    } catch (deviceError) {
      console.warn('Failed to fetch devices (non-critical):', deviceError);
      // Continue without device data - don't fail the entire request
      devices = [];
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
      // Don't fail the entire request if releases fail, but log the error
    }

    // Get environment variables - with retry logic for socket errors
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let envVars: any[] = [];
    try {
      envVars = await balena.models.application.envVar.getAllByApplication(parseInt(applicationId));
      console.log(`Fetched ${envVars.length} env vars for application ${applicationId}`);
    } catch (envError: any) {
      console.error('Failed to fetch env vars:', envError);
      // Continue without env vars - don't fail the entire request
    }

    // Get tags - use SDK method
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let tags: any[] = [];
    try {
      tags = await balena.models.application.tags.getAllByApplication(parseInt(applicationId));
      console.log(`Fetched ${tags.length} tags for application ${applicationId}`);
    } catch (tagError) {
      console.error('Failed to fetch tags:', tagError);
      // Continue without tags - don't fail the entire request
    }

    // Transform the data
    const transformedDevices = devices.map((d: any) => ({
      id: d.id.toString(),
      name: d.device_name || d.name || `Device ${d.id}`,
      uuid: d.uuid || '',
      status: d.is_online ? 'online' as const : 'offline' as const,
      lastSeen: d.last_connectivity_event || d.modified_at || new Date().toISOString(),
    }));

    const transformedReleases = releases.map((r: any, index: number) => {
      try {
        // Handle various field name possibilities from Balena API
        const releaseId = r.id || r.release_id || '';
        const releaseIdNum = parseInt(String(releaseId));
        const commit = r.commit || r.commit_hash || '';
        const createdAt = r.created_at || r.createdAt || r.__metadata?.created_at || new Date().toISOString();
        const status = r.status || r.release_status || 'success'; // Default to 'success' if not specified
        
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
            // Fallback: try to stringify the object
            version = JSON.stringify(versionRaw);
          }
        } else if (versionRaw !== undefined && versionRaw !== null) {
          // Convert any other type to string
          version = String(versionRaw);
        }
        
        // Ensure isFinal is a boolean
        const isFinal = Boolean(r.is_final || r.is_finalized || r.finalized || false);
        
        // Check if this is the currently deployed release
        const isDeployed = currentTargetReleaseId !== null && releaseIdNum === currentTargetReleaseId;
        const deployedDeviceCount = releaseDeviceCounts.get(releaseIdNum) || 0;
        
        // Ensure all values are primitives
        const transformed = {
          id: releaseId ? String(releaseId) : '',
          commit: String(commit || ''),
          createdAt: String(createdAt),
          status: String(status),
          version: String(version),
          isFinal: isFinal,
          isDeployed: isDeployed,
          deployedDeviceCount: deployedDeviceCount,
        };
        
        // Validate that no object values slipped through
        Object.keys(transformed).forEach(key => {
          const value = (transformed as any)[key];
          if (value !== null && typeof value === 'object') {
            console.error(`Release ${index} has object value for ${key}:`, value);
            (transformed as any)[key] = JSON.stringify(value);
          }
        });
        
        return transformed;
      } catch (error) {
        console.error(`Error transforming release ${index}:`, error, r);
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

    return NextResponse.json({
      id: app.id.toString(),
      name: app.app_name || 'Unknown',
      slug: app.slug,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      deviceType: (app.is_for__device_type as any)?.name || 
                  (app as any).device_type || 
                  (app.is_for__device_type as any)?.slug ||
                  'Unknown',
      deviceCount: devices.length,
      devices: transformedDevices,
      releases: transformedReleases,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      envVars: envVars.map((ev: any) => ({
        id: ev.id?.toString() || '',
        name: ev.name || ev.env_var_name,
        value: ev.value || ev.env_var_value,
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tags: tags.map((t: any) => ({
        id: t.id?.toString() || '',
        key: t.tag_key || t.name,
        value: t.value || t.tag_value,
      })),
      createdAt: app.created_at ? new Date(app.created_at).toISOString() : new Date().toISOString(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updatedAt: (app as any).modified_at ? new Date((app as any).modified_at).toISOString() : new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Get application error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch application';
    
    if (errorMessage.includes('404') || errorMessage.includes('not found')) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Delete the application
    await balena.models.application.remove(parseInt(applicationId));

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Delete application error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete application';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

