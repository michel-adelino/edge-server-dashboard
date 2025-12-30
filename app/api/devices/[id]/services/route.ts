/**
 * API Route for Device Services Management
 * Server-side only - uses Supervisor API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSdk } from '../../../../lib/balena/sdk-auth';
import { getDeviceIp } from '../../../../lib/balena/tags';
import { getSupervisorUrl } from '../../../../lib/balena/config';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deviceId = params.id;
    
    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      );
    }

    const balena = await getAuthenticatedSdk();

    // Get device to find IP
    const device = await balena.models.device.get(parseInt(deviceId));
    const deviceIp = await getDeviceIp(deviceId, device.uuid);

    if (!deviceIp) {
      return NextResponse.json(
        { error: 'Device IP not found. Please configure device IP in tags.' },
        { status: 400 }
      );
    }

    // Get services from Supervisor API
    // Supervisor API endpoint for services: /v1/apps/{appId}/services
    // We need to get the app ID from the device
    const appId = device.belongs_to__application?.id;
    
    if (!appId) {
      return NextResponse.json(
        { error: 'Device is not assigned to an application' },
        { status: 400 }
      );
    }

    try {
      // Get services from Supervisor API
      const response = await fetch(getSupervisorUrl(deviceIp, `/v1/apps/${appId}/services`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // If endpoint doesn't exist, try alternative endpoint
        const stateResponse = await fetch(getSupervisorUrl(deviceIp, '/v1/state'), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (stateResponse.ok) {
          const state = await stateResponse.json();
          // Extract services from state if available
          const services = state.services || state.local?.services || [];
          
          return NextResponse.json(services.map((s: any, index: number) => ({
            id: s.service_id || s.id || index.toString(),
            name: s.service_name || s.name || `service-${index}`,
            image: s.image || s.image_id || 'unknown',
            status: s.status || s.state || 'unknown',
            cpuUsage: s.cpu_usage || 0,
            memoryUsage: s.memory_usage || 0,
            memoryLimit: s.memory_limit || 0,
          })));
        }

        throw new Error(`Supervisor API error: ${response.statusText}`);
      }

      const services = await response.json();
      
      // Transform services to match expected format
      const transformedServices = (Array.isArray(services) ? services : services.services || []).map((s: any, index: number) => ({
        id: s.service_id || s.id || index.toString(),
        name: s.service_name || s.name || `service-${index}`,
        image: s.image || s.image_id || 'unknown',
        status: s.status || s.state || 'unknown',
        cpuUsage: s.cpu_usage || 0,
        memoryUsage: s.memory_usage || 0,
        memoryLimit: s.memory_limit || 0,
      }));

      return NextResponse.json(transformedServices);
    } catch (supervisorError) {
      console.error('Supervisor API error:', supervisorError);
      // Return empty array if Supervisor API is not accessible
      return NextResponse.json([]);
    }
  } catch (error: unknown) {
    console.error('Get services error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch services';
    
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
    const deviceId = params.id;
    const body = await request.json();
    const { serviceId, action } = body; // action: 'restart' | 'stop' | 'start'
    
    if (!deviceId || !serviceId || !action) {
      return NextResponse.json(
        { error: 'Device ID, service ID, and action are required' },
        { status: 400 }
      );
    }

    const balena = await getAuthenticatedSdk();

    // Get device to find IP
    const device = await balena.models.device.get(parseInt(deviceId));
    const deviceIp = await getDeviceIp(deviceId, device.uuid);

    if (!deviceIp) {
      return NextResponse.json(
        { error: 'Device IP not found. Please configure device IP in tags.' },
        { status: 400 }
      );
    }

    const appId = device.belongs_to__application?.id;
    
    if (!appId) {
      return NextResponse.json(
        { error: 'Device is not assigned to an application' },
        { status: 400 }
      );
    }

    // Control service via Supervisor API
    const endpoint = action === 'restart' 
      ? `/v1/apps/${appId}/services/${serviceId}/restart`
      : action === 'stop'
      ? `/v1/apps/${appId}/services/${serviceId}/stop`
      : `/v1/apps/${appId}/services/${serviceId}/start`;

    const response = await fetch(getSupervisorUrl(deviceIp, endpoint), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to ${action} service: ${response.statusText}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Control service error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to control service';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

