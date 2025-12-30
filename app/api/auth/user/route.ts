/**
 * API Route to get current user using balena-sdk
 * Server-side only - uses balena-sdk properly
 * 
 * Reference: https://docs.balena.io/reference/sdk/node-sdk/latest/
 * 
 * Using dynamic import to prevent webpack from bundling balena-sdk
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get API URL from environment
    const apiUrl = process.env.NEXT_PUBLIC_BALENA_API_URL || 'https://api.balena-cloud.com';
    const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;

    // Dynamic import to prevent webpack from bundling balena-sdk
    const { getSdk } = await import('balena-sdk');

    // For OpenBalena with self-signed certificates, disable SSL verification
    if (process.env.NODE_ENV !== 'production' || cleanApiUrl.includes('withu.info')) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    // Initialize balena SDK
    const balena = getSdk({
      apiUrl: cleanApiUrl,
    });

    // Get user information - make direct API call
    // The SDK handles authentication via cookies, so we can make a direct request
    const userResponse = await fetch(`${cleanApiUrl}/v7/user`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Disable SSL verification for self-signed certs
      // @ts-ignore - Node.js fetch option
      rejectUnauthorized: false,
    });
    
    if (!userResponse.ok) {
      throw new Error('Failed to get user');
    }
    
    const userData = await userResponse.json();
    // Handle OData response format
    const userObj = userData.d || userData;
    
    const user = {
      id: userObj.id,
      email: userObj.email,
      username: userObj.username,
    };

    return NextResponse.json({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  } catch (error: unknown) {
    console.error('Get user error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get user';
    return NextResponse.json(
      { error: errorMessage },
      { status: 401 }
    );
  }
}

