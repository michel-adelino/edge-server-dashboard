/**
 * API Route for Application Configuration (Env Vars, Tags)
 * Server-side only - uses authenticated SDK instance
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSdk } from '../../../../lib/balena/sdk-auth';

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

    // Get environment variables
    const envVars = await balena.models.application.envVar.getAllByApplication(parseInt(applicationId));
    
    // Get tags
    const tags = await balena.models.application.tag.getAllByApplication(parseInt(applicationId));

    return NextResponse.json({
      envVars: envVars.map((ev: any) => ({
        id: ev.id?.toString() || '',
        name: ev.name || ev.env_var_name,
        value: ev.value || ev.env_var_value,
      })),
      tags: tags.map((t: any) => ({
        id: t.id?.toString() || '',
        key: t.tag_key || t.name,
        value: t.value || t.tag_value,
      })),
    });
  } catch (error: unknown) {
    console.error('Get config error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch configuration';
    
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
    const applicationId = params.id;
    const body = await request.json();
    const { envVars, tags } = body;
    
    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    const balena = await getAuthenticatedSdk();

    // Update environment variables
    if (envVars) {
      for (const envVar of envVars) {
        if (envVar.id) {
          // Update existing
          await balena.models.application.envVar.update(parseInt(envVar.id), envVar.value);
        } else {
          // Create new
          await balena.models.application.envVar.create(parseInt(applicationId), envVar.name, envVar.value);
        }
      }
    }

    // Update tags
    if (tags) {
      for (const tag of tags) {
        if (tag.id) {
          // Update existing
          await balena.models.application.tag.update(parseInt(tag.id), tag.value);
        } else {
          // Create new
          await balena.models.application.tag.create(parseInt(applicationId), tag.key, tag.value);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Update config error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to update configuration';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

