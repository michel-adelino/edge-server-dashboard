/**
 * API Route for Application Releases
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

    const balena = await getAuthenticatedSdk();
    const apiUrl = getApiUrl();

    // Get releases for this application
    const result = await balena.request.send({
      method: 'GET',
      url: `${apiUrl}/v7/release?$filter=belongs_to__application/id eq ${applicationId}&$orderby=created_at desc&$expand=belongs_to__application`,
    });
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resultData = result as { d?: any[] } | any[];
    const releases = 'd' in resultData && resultData.d ? resultData.d : (Array.isArray(resultData) ? resultData : []);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedReleases = releases.map((r: any) => ({
      id: r.id.toString(),
      commit: r.commit || '',
      createdAt: r.created_at || new Date().toISOString(),
      status: r.status || 'unknown',
      version: r.release_version || '0.0.0',
      isFinal: r.is_final || r.is_finalized || false,
    }));

    return NextResponse.json(transformedReleases);
  } catch (error: unknown) {
    console.error('Get releases error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch releases';
    
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

