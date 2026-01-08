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

    // Get environment variables - with retry logic for socket errors
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let envVars: any[] = [];
    try {
      envVars = await balena.models.application.envVar.getAllByApplication(parseInt(applicationId));
      console.log(`Fetched ${envVars.length} env vars for application ${applicationId}`);
    } catch (envError: any) {
      console.warn('Failed to fetch env vars using SDK, trying direct API:', envError);
      // Fallback to direct API call if SDK fails
      try {
        const envResult = await balena.request.send({
          method: 'GET',
          url: `${apiUrl}/v7/application_environment_variable?$orderby=name asc&$filter=belongs_to__application eq ${applicationId}`,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const envData = envResult as { d?: any[] } | any[];
        envVars = 'd' in envData && envData.d ? envData.d : (Array.isArray(envData) ? envData : []);
        console.log(`Fetched ${envVars.length} env vars using direct API for application ${applicationId}`);
      } catch (directApiError) {
        console.error('Failed to fetch env vars using direct API:', directApiError);
        // Return empty array so tags can still be returned
      }
    }
    
    // Get tags - use SDK method
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let tags: any[] = [];
    try {
      tags = await balena.models.application.tags.getAllByApplication(parseInt(applicationId));
      console.log(`Fetched ${tags.length} tags for application ${applicationId}`);
    } catch (tagError) {
      console.error('Failed to fetch tags:', tagError);
      // Don't throw - return empty array so other data can still be returned
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

    // Update environment variables - use SDK methods
    if (envVars) {
      for (const envVar of envVars) {
        try {
          // SDK set() method creates if doesn't exist, updates if it does
          await balena.models.application.envVar.set(
            parseInt(applicationId),
            envVar.name,
            envVar.value
          );
          console.log(`Successfully set env var: ${envVar.name}`);
        } catch (envVarError: any) {
          console.error(`Failed to set env var ${envVar.name}:`, envVarError);
          throw new Error(`Failed to set environment variable "${envVar.name}": ${envVarError.message || 'Unknown error'}`);
        }
      }
    }

    // Update tags - use SDK methods
    if (tags) {
      for (const tag of tags) {
        try {
          // SDK set() method creates if doesn't exist, updates if it does
          await balena.models.application.tags.set(
            parseInt(applicationId),
            tag.key,
            tag.value
          );
          console.log(`Successfully set tag: ${tag.key}`);
        } catch (tagError: any) {
          console.error(`Failed to set tag ${tag.key}:`, tagError);
          throw new Error(`Failed to set tag "${tag.key}": ${tagError.message || 'Unknown error'}`);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const applicationId = params.id;
    const body = await request.json();
    const { envVarIds, tagIds } = body;
    
    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    const balena = await getAuthenticatedSdk();

    // Delete environment variables - use SDK method (requires key, not ID)
    if (envVarIds && Array.isArray(envVarIds)) {
      // Fetch all env vars to map IDs to names
      const allEnvVars = await balena.models.application.envVar.getAllByApplication(parseInt(applicationId));
      const envVarMap = new Map(allEnvVars.map((ev: any) => [ev.id.toString(), ev.name]));
      
      for (const envVarId of envVarIds) {
        const envVarName = envVarMap.get(envVarId);
        if (!envVarName) {
          console.warn(`Env var with ID ${envVarId} not found, skipping deletion`);
          continue;
        }
        try {
          await balena.models.application.envVar.remove(parseInt(applicationId), envVarName);
          console.log(`Successfully removed env var: ${envVarName} (ID: ${envVarId})`);
        } catch (envVarError) {
          console.warn(`Failed to delete env var ${envVarName} (ID: ${envVarId}):`, envVarError);
          // Continue with other deletions even if one fails
        }
      }
    }

    // Delete tags - use SDK method (requires key, not ID)
    if (tagIds && Array.isArray(tagIds)) {
      // Fetch all tags to map IDs to keys
      const allTags = await balena.models.application.tags.getAllByApplication(parseInt(applicationId));
      const tagMap = new Map(allTags.map((t: any) => [t.id.toString(), t.tag_key]));
      
      for (const tagId of tagIds) {
        const tagKey = tagMap.get(tagId);
        if (!tagKey) {
          console.warn(`Tag with ID ${tagId} not found, skipping deletion`);
          continue;
        }
        try {
          await balena.models.application.tags.remove(parseInt(applicationId), tagKey);
          console.log(`Successfully removed tag: ${tagKey} (ID: ${tagId})`);
        } catch (tagError) {
          console.warn(`Failed to delete tag ${tagKey} (ID: ${tagId}):`, tagError);
          // Continue with other deletions even if one fails
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Delete config error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete configuration';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

