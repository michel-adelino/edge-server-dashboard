/**
 * API Route for Single Application using Balena SDK
 * Server-side only - uses authenticated SDK instance
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSdk, getApiUrl } from '../../../../lib/balena/sdk-auth';

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

    // Get application details
    const app = await balena.models.application.get(parseInt(applicationId));
    
    // Get devices for this application
    const devices = await balena.models.device.getAllByApplication(parseInt(applicationId));
    
    // Get releases for this application
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let releases: any[] = [];
    try {
      const result = await balena.request.send({
        method: 'GET',
        url: `${apiUrl}/v7/release?$filter=belongs_to__application/id eq ${applicationId}&$orderby=created_at desc&$expand=belongs_to__application`,
      });
      
      // Handle different response formats from balena.request.send()
      // The response might be the data directly, or a response object
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let resultData: any = result;
      
      // Debug: Log the raw response structure
      if (result && typeof result === 'object') {
        console.log('Raw release response keys:', Object.keys(result));
        console.log('Raw release response type:', typeof result);
        // Check if it's a response wrapper with statusCode
        if ('statusCode' in result) {
          console.log('Response statusCode:', result.statusCode);
          // If statusCode indicates success (200-299), the body should be in the response
          // balena.request.send() typically returns the parsed body directly, but let's check
        }
      }
      
      // Check if result is a response object with body/data property
      if (resultData && typeof resultData === 'object' && !Array.isArray(resultData)) {
        // Check for common response object properties
        if ('body' in resultData && resultData.body !== undefined) {
          resultData = resultData.body;
          console.log('Found body property, extracted:', typeof resultData, Array.isArray(resultData));
          if (resultData && typeof resultData === 'object' && !Array.isArray(resultData)) {
            console.log('Body keys:', Object.keys(resultData));
          }
        } else if ('data' in resultData && resultData.data !== undefined) {
          resultData = resultData.data;
          console.log('Found data property, extracted:', typeof resultData, Array.isArray(resultData));
        } else if ('response' in resultData && resultData.response !== undefined) {
          resultData = resultData.response;
          console.log('Found response property, extracted:', typeof resultData, Array.isArray(resultData));
        } else if ('request' in resultData && resultData.request !== undefined) {
          // Sometimes the data might be nested in request object
          const requestObj = resultData.request;
          if (requestObj && typeof requestObj === 'object') {
            if ('body' in requestObj) resultData = requestObj.body;
            else if ('data' in requestObj) resultData = requestObj.data;
          }
        }
      }
      
      // Handle OData response formats
      if (resultData && typeof resultData === 'object' && !Array.isArray(resultData)) {
        if ('d' in resultData) {
          // OData v2 format: { d: { results: [...] } } or { d: [...] }
          if (Array.isArray(resultData.d)) {
            resultData = resultData.d;
            console.log('Found d as array, extracted', resultData.length, 'items');
          } else if (resultData.d && Array.isArray(resultData.d.results)) {
            resultData = resultData.d.results;
            console.log('Found d.results as array, extracted', resultData.length, 'items');
          } else if (resultData.d && typeof resultData.d === 'object') {
            // Try to find array in d object
            console.log('d object keys:', Object.keys(resultData.d));
            const dKeys = Object.keys(resultData.d);
            for (const key of dKeys) {
              if (Array.isArray(resultData.d[key])) {
                resultData = resultData.d[key];
                console.log(`Found d.${key} as array, extracted`, resultData.length, 'items');
                break;
              }
            }
          }
        } else if ('value' in resultData && Array.isArray(resultData.value)) {
          // OData v4 format
          resultData = resultData.value;
          console.log('Found value as array, extracted', resultData.length, 'items');
        } else if (Array.isArray(resultData)) {
          // Already an array
          console.log('ResultData is already an array:', resultData.length, 'items');
        } else {
          // Try to find array in nested structure
          const keys = Object.keys(resultData);
          console.log('Searching for array in keys:', keys);
          for (const key of keys) {
            if (key !== 'request' && Array.isArray(resultData[key])) {
              resultData = resultData[key];
              console.log(`Found ${key} as array, extracted`, resultData.length, 'items');
              break;
            }
          }
        }
      } else if (Array.isArray(resultData)) {
        console.log('ResultData is already an array:', resultData.length, 'items');
      }
      
      releases = Array.isArray(resultData) ? resultData : [];
      console.log(`Fetched ${releases.length} releases for application ${applicationId}`);
      
      // Debug: Log response structure if releases are empty but we got a response
      if (releases.length === 0 && result) {
        console.log('Releases array is empty, but response received.');
        console.log('Response structure:', {
          keys: Object.keys(result),
          hasBody: 'body' in result,
          hasData: 'data' in result,
          hasResponse: 'response' in result,
          hasRequest: 'request' in result,
          resultType: typeof result,
          isArray: Array.isArray(result),
        });
        // Log a sample of the response (first level only to avoid huge logs)
        if (result && typeof result === 'object') {
          const sample: any = {};
          Object.keys(result).slice(0, 5).forEach(key => {
            const val = (result as any)[key];
            sample[key] = Array.isArray(val) ? `[Array(${val.length})]` : typeof val;
          });
          console.log('Response sample:', sample);
        }
      }
    } catch (releaseError) {
      console.error('Failed to fetch releases:', releaseError);
      // Don't fail the entire request if releases fail, but log the error
    }

    // Get environment variables
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let envVars: any[] = [];
    try {
      envVars = await balena.models.application.envVar.getAllByApplication(parseInt(applicationId));
    } catch (envError) {
      console.warn('Failed to fetch env vars:', envError);
    }

    // Get tags - use direct API call
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let tags: any[] = [];
    try {
      const tagsResult = await balena.request.send({
        method: 'GET',
        url: `${apiUrl}/v6/application_tag?$filter=belongs_to__application/id eq ${applicationId}`,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tagsData = tagsResult as { d?: any[] } | any[];
      tags = 'd' in tagsData && tagsData.d ? tagsData.d : (Array.isArray(tagsData) ? tagsData : []);
    } catch (tagError) {
      console.warn('Failed to fetch tags:', tagError);
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
        
        // Ensure all values are primitives
        const transformed = {
          id: releaseId ? String(releaseId) : '',
          commit: String(commit || ''),
          createdAt: String(createdAt),
          status: String(status),
          version: String(version),
          isFinal: isFinal,
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

