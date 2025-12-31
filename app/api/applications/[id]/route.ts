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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resultData = result as { d?: any[] } | any[];
      releases = 'd' in resultData && resultData.d ? resultData.d : (Array.isArray(resultData) ? resultData : []);
    } catch (releaseError) {
      console.warn('Failed to fetch releases:', releaseError);
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

    const transformedReleases = releases.map((r: any) => ({
      id: r.id.toString(),
      commit: r.commit || '',
      createdAt: r.created_at || new Date().toISOString(),
      status: r.status || 'unknown',
      version: r.release_version || '0.0.0',
      isFinal: r.is_final || r.is_finalized || false,
    }));

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

