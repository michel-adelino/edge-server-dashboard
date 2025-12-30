/**
 * API Route for Devices using Balena SDK
 * Server-side only - uses authenticated SDK instance
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSdk, getApiUrl } from '../../../lib/balena/sdk-auth';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated SDK instance (uses token from HTTP-only cookie)
    const balena = await getAuthenticatedSdk();
    const cleanApiUrl = getApiUrl();

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const applicationFilter = searchParams.get('application');
    const deviceTypeFilter = searchParams.get('deviceType');

    // Fetch devices using SDK
    let devices: any[] = [];

    try {
      // Get all devices using SDK
      // Note: SDK might not have getAll() method, so we'll use request.send()
      
      // Build OData query
      const expandParams = 'belongs_to__application,is_of__device_type,should_be_running__release,device_tag';
      let odataQuery = `$expand=${expandParams}&$orderby=device_name asc`;
      
      // Add filters
      const filterConditions: string[] = [];
      if (statusFilter && statusFilter !== 'all') {
        if (statusFilter === 'online') {
          filterConditions.push('is_online eq true');
        } else if (statusFilter === 'offline') {
          filterConditions.push('is_online eq false');
        }
      }
      if (applicationFilter && applicationFilter !== 'all') {
        filterConditions.push(`belongs_to__application/app_name eq '${applicationFilter}'`);
      }
      if (deviceTypeFilter && deviceTypeFilter !== 'all') {
        filterConditions.push(`is_of__device_type/name eq '${deviceTypeFilter}'`);
      }
      
      if (filterConditions.length > 0) {
        odataQuery += `&$filter=${filterConditions.join(' and ')}`;
      }

      // Use SDK's request method to get devices
      const result = await balena.request.send({
        method: 'GET',
        url: `${cleanApiUrl}/v7/device?${odataQuery}`,
      });

      // Handle OData response format
      const resultData = result as { d?: any[] } | any[];
      devices = 'd' in resultData && resultData.d ? resultData.d : (Array.isArray(resultData) ? resultData : []);
      
      console.log(`SDK fetched ${devices.length} devices`);
    } catch (sdkError) {
      console.error('SDK methods failed:', sdkError);
      throw sdkError;
    }

    // Transform devices to match our Device interface format
    const transformedDevices = devices.map((d: any) => {
      // Get tags
      const tags = (d.device_tag || []).map((tag: any) => {
        if (typeof tag === 'string') return tag;
        return `${tag.tag_key || 'tag'}:${tag.value || ''}`;
      });

      // Get application info
      const application = d.belongs_to__application;
      const applicationName = application?.app_name || 'Unknown';
      const applicationId = application?.id?.toString() || '';

      // Get device type
      const deviceType = d.is_of__device_type?.name || 
                        d.device_type || 
                        d.is_of__device_type?.slug ||
                        'Unknown';

      // Get release info
      const release = d.should_be_running__release;
      const currentVersion = release?.release_version || 
                            (release?.commit ? `commit-${release.commit.substring(0, 7)}` : 'unknown');

      return {
        id: d.id.toString(),
        name: d.device_name || d.name || `Device ${d.id}`,
        uuid: d.uuid || '',
        status: d.is_online ? 'online' as const : 'offline' as const,
        application: applicationName,
        applicationId,
        deviceType,
        deviceTypeCategory: deviceType.toLowerCase().includes('raspberry') ? 'Raspberry Pi' as const : 'Compute Module' as const,
        currentVersion,
        cpuUsage: 0, // Will be populated by metrics if available
        memoryUsage: 0,
        memoryTotal: 0,
        memoryUsed: 0,
        storageUsage: 0,
        storageTotal: 0,
        storageUsed: 0,
        temperature: 0,
        lastSeen: d.last_connectivity_event || d.modified_at || new Date().toISOString(),
        tags,
        osVersion: 'BalenaOS',
        supervisorVersion: 'Unknown',
        venueIds: tags.filter((t: string) => t.startsWith('venue_id:')).map((t: string) => t.split(':')[1]),
      };
    });

    console.log(`Returning ${transformedDevices.length} transformed devices`);

    return NextResponse.json(transformedDevices);
  } catch (error: unknown) {
    console.error('Get devices error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch devices';
    
    // Check if it's an authentication error
    if (errorMessage.includes('401') || errorMessage.includes('unauthorized') || errorMessage.includes('Authentication') || errorMessage.includes('Not authenticated')) {
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

