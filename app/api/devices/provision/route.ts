/**
 * API Route for Generating Device Provisioning Keys
 * Server-side only - uses authenticated SDK instance
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSdk, getApiUrl } from '../../../../lib/balena/sdk-auth';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated SDK instance (uses token from HTTP-only cookie)
    const balena = await getAuthenticatedSdk();
    const apiUrl = getApiUrl();

    // For global provisioning, we need to create a provisioning key
    // In OpenBalena, this is typically done through the API
    // Use the direct API approach since SDK doesn't have a provision method
    try {
      const response = await balena.request.send({
        method: 'POST',
        url: `${apiUrl}/api-key/provisioning`,
      });

      const keyData = response as any;
      const provisioningKey = keyData.key || keyData.api_key || keyData;

      return NextResponse.json({
        key: typeof provisioningKey === 'string' ? provisioningKey : JSON.stringify(provisioningKey),
        provisioningKey: typeof provisioningKey === 'string' ? provisioningKey : JSON.stringify(provisioningKey),
      });
    } catch (apiError) {
      console.error('Failed to create provisioning key via API:', apiError);
      
      // If both methods fail, return a helpful error
      return NextResponse.json(
        { 
          error: 'Failed to generate provisioning key. Please ensure your OpenBalena instance supports device provisioning.',
          details: apiError instanceof Error ? apiError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Provision key generation error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate provisioning key';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

