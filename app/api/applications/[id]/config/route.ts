/**
 * API Route for Application Configuration (Env Vars, Tags)
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

    // Get environment variables
    const envVars = await balena.models.application.envVar.getAllByApplication(parseInt(applicationId));
    
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

    return NextResponse.json({
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
    const apiUrl = getApiUrl();

    // Update environment variables
    if (envVars) {
      for (const envVar of envVars) {
        if (envVar.id) {
          // Update existing - use direct API call since SDK doesn't have update method
          await balena.request.send({
            method: 'PATCH',
            url: `${apiUrl}/v6/application_environment_variable(${envVar.id})`,
            body: {
              value: envVar.value,
            },
          });
        } else {
          // Create new - use direct API call
          await balena.request.send({
            method: 'POST',
            url: `${apiUrl}/v6/application_environment_variable`,
            body: {
              belongs_to__application: parseInt(applicationId),
              name: envVar.name,
              value: envVar.value,
            },
          });
        }
      }
    }

    // Update tags
    if (tags) {
      for (const tag of tags) {
        if (tag.id) {
          // Update existing - use direct API call since SDK doesn't have update method
          await balena.request.send({
            method: 'PATCH',
            url: `${apiUrl}/v6/application_tag(${tag.id})`,
            body: {
              value: tag.value,
            },
          });
        } else {
          // Create new - use direct API call
          await balena.request.send({
            method: 'POST',
            url: `${apiUrl}/v6/application_tag`,
            body: {
              belongs_to__application: parseInt(applicationId),
              tag_key: tag.key,
              value: tag.value,
            },
          });
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

