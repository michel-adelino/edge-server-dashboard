/**
 * API Route for Application Releases using Balena SDK
 * Server-side only - uses authenticated SDK instance
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSdk, getApiUrl } from '../../../../../lib/balena/sdk-auth';

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
    const apiUrl = getApiUrl();

    // Get releases for this application using SDK
    // Use SDK's Pine client (same approach as other SDK model methods use internally)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let releases: any[] = [];
    try {
      // Try using SDK's Pine client first (this is what SDK models use internally)
      if (balena.pine && typeof balena.pine.get === 'function') {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pineResult: any = await balena.pine.get({
            resource: 'release',
            options: {
              $filter: {
                belongs_to__application: parseInt(applicationId),
              },
              $orderby: 'created_at',
              $expand: ['belongs_to__application'],
            },
          });
          
          // Pine client returns array directly or wrapped
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          releases = Array.isArray(pineResult) ? pineResult : (pineResult?.d || pineResult?.value || []);
          // Sort descending since SDK might not support 'desc' in orderby
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          releases = releases.sort((a: any, b: any) => {
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();
            return dateB - dateA; // Descending order
          });
          
          console.log(`SDK Pine client fetched ${releases.length} releases for application ${applicationId}`);
        } catch (pineError) {
          console.warn('Pine client failed, falling back to request.send():', pineError);
          // Fall through to request.send()
        }
      }
      
      // Fallback to request.send() if Pine client failed or isn't available
      if (releases.length === 0) {
        const result = await balena.request.send({
          method: 'GET',
          url: `${apiUrl}/v7/release?$filter=belongs_to__application/id eq ${applicationId}&$orderby=created_at desc&$expand=belongs_to__application`,
        });
        
        // Handle different response formats from balena.request.send()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let resultData: any = result;
        
        // Check if result is a response object with body/data property
        if (resultData && typeof resultData === 'object' && !Array.isArray(resultData)) {
          if ('body' in resultData && resultData.body !== undefined) {
            resultData = resultData.body;
          } else if ('data' in resultData && resultData.data !== undefined) {
            resultData = resultData.data;
          } else if ('response' in resultData && resultData.response !== undefined) {
            resultData = resultData.response;
          }
        }
        
        // Handle OData response formats
        if (resultData && typeof resultData === 'object') {
          if ('d' in resultData) {
            // OData v2 format: { d: { results: [...] } } or { d: [...] }
            if (Array.isArray(resultData.d)) {
              resultData = resultData.d;
            } else if (resultData.d && Array.isArray(resultData.d.results)) {
              resultData = resultData.d.results;
            } else if (resultData.d && typeof resultData.d === 'object') {
              // Try to find array in d object
              const dKeys = Object.keys(resultData.d);
              for (const key of dKeys) {
                if (Array.isArray(resultData.d[key])) {
                  resultData = resultData.d[key];
                  break;
                }
              }
            }
          } else if ('value' in resultData && Array.isArray(resultData.value)) {
            // OData v4 format
            resultData = resultData.value;
          }
        }
        
        releases = Array.isArray(resultData) ? resultData : [];
        console.log(`SDK request.send() fetched ${releases.length} releases for application ${applicationId}`);
      }
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
        
        return {
          id: (r.id || r.release_id || '').toString(),
          commit: String(r.commit || r.commit_hash || ''),
          createdAt: String(r.created_at || r.createdAt || new Date().toISOString()),
          status: String(r.status || r.release_status || 'success'),
          version: String(version),
          isFinal: Boolean(r.is_final || r.is_finalized || r.finalized || false),
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
    const apiUrl = getApiUrl();

    // Deploy release to application by updating all devices in the application
    // First, get all devices in the application
    const devices = await balena.models.device.getAllByApplication(parseInt(applicationId));
    
    // Update each device to point to the new release
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatePromises = devices.map((device: any) =>
      balena.request.send({
        method: 'PATCH',
        url: `${apiUrl}/v6/device(${device.id})`,
        body: {
          should_be_running__release: parseInt(releaseId),
        },
      })
    );

    await Promise.all(updatePromises);

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

