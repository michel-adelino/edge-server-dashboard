/**
 * API Route for Application Releases
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

    const balena = await getAuthenticatedSdk();
    const apiUrl = getApiUrl();

    // Get releases for this application
    const result = await balena.request.send({
      method: 'GET',
      url: `${apiUrl}/v7/release?$filter=belongs_to__application/id eq ${applicationId}&$orderby=created_at desc&$expand=belongs_to__application`,
    });
    
    const resultData = result as { d?: any[] } | any[];
    const releases = 'd' in resultData && resultData.d ? resultData.d : (Array.isArray(resultData) ? resultData : []);

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

    // Deploy release to application
    // This typically involves setting the release as the target for the application
    await balena.models.application.setToRelease(parseInt(applicationId), parseInt(releaseId));

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

