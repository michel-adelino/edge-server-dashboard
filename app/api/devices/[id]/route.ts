/**
 * API Route for Single Device Operations
 * Server-side only - uses authenticated SDK instance
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSdk } from '../../../../lib/balena/sdk-auth';

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

    // Get device details
    const device = await balena.models.device.get(parseInt(deviceId));

    return NextResponse.json({
      id: device.id.toString(),
      name: device.device_name || 'Unknown',
      uuid: device.uuid,
      status: device.is_online ? 'online' : 'offline',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      application: (device.belongs_to__application as any)?.app_name || 'Unassigned',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      applicationId: (device.belongs_to__application as any)?.id?.toString(),
    });
  } catch (error: unknown) {
    console.error('Get device error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch device';
    
    if (errorMessage.includes('404') || errorMessage.includes('not found')) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deviceId = params.id;
    const body = await request.json();
    const { name, applicationId } = body;
    
    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      );
    }

    const balena = await getAuthenticatedSdk();

    // Rename device if name is provided
    if (name) {
      await balena.models.device.rename(parseInt(deviceId), name);
    }

    // Move device to application if applicationId is provided
    if (applicationId) {
      await balena.models.device.move(parseInt(deviceId), parseInt(applicationId));
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Update device error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to update device';
    
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
    const deviceId = params.id;
    
    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      );
    }

    const balena = await getAuthenticatedSdk();

    // Remove the device
    await balena.models.device.remove(parseInt(deviceId));

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Delete device error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete device';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

