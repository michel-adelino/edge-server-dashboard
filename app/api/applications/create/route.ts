/**
 * API Route for Creating Applications using balena-sdk
 * Server-side only - uses authenticated SDK instance
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSdk } from '../../../../lib/balena/sdk-auth';

export async function POST(request: NextRequest) {
  // Get request body first (needed for error handling)
  const body = await request.json();
  const { name, deviceType } = body;

  if (!name || !deviceType) {
    return NextResponse.json(
      { error: 'Application name and device type are required' },
      { status: 400 }
    );
  }

  try {
    // Get authenticated SDK instance (uses token from HTTP-only cookie)
    const balena = await getAuthenticatedSdk();

    console.log(`Creating application: name="${name}", deviceType="${deviceType}"`);

    // Get user's organization
    let organizationId: number | null = null;
    try {
      const organizations = await balena.models.organization.getAll();
      if (organizations && organizations.length > 0) {
        organizationId = organizations[0].id;
        console.log(`Found organization: ${organizations[0].name} (ID: ${organizationId})`);
      } else {
        // Try to get organization from user info
        // In OpenBalena, the user might be the organization owner
        // Try using the user ID as organization ID, or use null to let SDK infer
        console.log('No organizations found, will let SDK infer from session');
      }
    } catch (orgError) {
      console.warn('Could not get organization, will let SDK infer from session:', orgError);
    }

    // Create application using SDK
    const createOptions: any = {
      name,
      deviceType,
      // Pass null explicitly if no organization found - SDK will infer from session
      // Passing undefined causes an error, so we must pass null or a valid ID
      organization: organizationId !== null ? organizationId : null,
    };

    const application = await balena.models.application.create(createOptions);
    
    console.log(`Successfully created application: ${application.app_name || name} (ID: ${application.id})`);
    
    // Transform the application to match our Application interface
    const transformedApplication = {
      id: application.id.toString(),
      name: application.app_name || name,
      slug: application.slug || `${name}`,
      deviceType: (application.is_for__device_type as { name?: string })?.name || 
                  deviceType,
      deviceCount: 0,
      onlineDevices: 0,
      offlineDevices: 0,
      status: 'stopped' as const,
      release: 'unknown',
      commit: 'unknown',
      createdAt: application.created_at ? new Date(application.created_at).toISOString() : new Date().toISOString(),
      updatedAt: application.created_at ? new Date(application.created_at).toISOString() : new Date().toISOString(),
      tags: [],
      avgCpuUsage: 0,
      avgMemoryUsage: 0,
    };

    return NextResponse.json(transformedApplication);
  } catch (error: unknown) {
    console.error('Create application error:', error);
    
    // Log the full error for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to create application';
    
    // Handle specific SDK errors
    if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
      return NextResponse.json(
        { error: 'An application with this name already exists' },
        { status: 409 }
      );
    }
    
    if (errorMessage.includes('invalid') || errorMessage.includes('Invalid') || errorMessage.includes('device type') || errorMessage.includes('organization')) {
      return NextResponse.json(
        { 
          error: `Invalid application name or device type. Device type "${deviceType || 'unknown'}" might not be supported. Please check the device type slug.`,
          details: errorMessage 
        },
        { status: 400 }
      );
    }
    
    // Check if it's an authentication error
    if (errorMessage.includes('401') || errorMessage.includes('unauthorized') || errorMessage.includes('Authentication')) {
      return NextResponse.json(
        { error: 'Authentication failed. Please login again.' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: errorMessage, details: error instanceof Error ? error.stack : undefined },
      { status: 500 }
    );
  }
}
