/**
 * API Route for Fetching Releases using balena-sdk
 * Server-side only - uses authenticated SDK instance
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSdk, getApiUrl } from '../../../lib/balena/sdk-auth';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated SDK instance (uses token from HTTP-only cookie)
    const balena = await getAuthenticatedSdk();
    const cleanApiUrl = getApiUrl();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId'); // Filter by application ID

    // Fetch releases
    let releases: any[] = [];
    
    if (appId) {
      // Get releases for a specific application
      try {
        // Use SDK's request method to get releases for the application
        const result = await balena.request.send({
          method: 'GET',
          url: `${cleanApiUrl}/v7/release?$filter=belongs_to__application/id eq ${appId}&$orderby=created_at desc&$expand=belongs_to__application`,
        });
        
        // Handle OData response format
        const resultData = result as { d?: any[] } | any[];
        releases = 'd' in resultData && resultData.d ? resultData.d : (Array.isArray(resultData) ? resultData : []);
      } catch (error) {
        console.error('Failed to fetch releases for application:', error);
        // Fallback: try using SDK models if available
        try {
          const app = await balena.models.application.get(parseInt(appId));
          // Note: SDK might not have a direct method to get releases by app
          // So we'll use the request method above
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
      }
    } else {
      // Get all releases
      try {
        const result = await balena.request.send({
          method: 'GET',
          url: `${cleanApiUrl}/v7/release?$orderby=created_at desc&$expand=belongs_to__application`,
        });
        
        // Handle OData response format
        const resultData = result as { d?: any[] } | any[];
        releases = 'd' in resultData && resultData.d ? resultData.d : (Array.isArray(resultData) ? resultData : []);
      } catch (error) {
        console.error('Failed to fetch all releases:', error);
      }
    }

    // Transform releases to match the expected format
    const transformedReleases = releases.map((release) => {
      return {
        id: release.id.toString(),
        commit: release.commit || '',
        createdAt: release.created_at || new Date().toISOString(),
        status: release.status || 'unknown',
        version: release.release_version || '0.0.0',
        isFinal: release.is_final || release.is_finalized || false,
        applicationId: release.belongs_to__application?.id?.toString() || '',
        applicationName: release.belongs_to__application?.app_name || 'unknown',
      };
    });

    console.log(`Fetched ${transformedReleases.length} releases${appId ? ` for application ${appId}` : ''}`);

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

