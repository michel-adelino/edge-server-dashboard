/**
 * API Route for Logout using balena-sdk
 * Server-side only - uses balena-sdk properly
 * 
 * Reference: https://docs.balena.io/reference/sdk/node-sdk/latest/
 * 
 * Using dynamic import to prevent webpack from bundling balena-sdk
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
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
      dataDirectory: false, // Use in-memory for serverless/Next.js
    });

    // Try to logout using SDK (if authenticated)
    try {
      await balena.auth.logout();
    } catch (error) {
      // Ignore errors - we'll clear the cookie anyway
      console.warn('SDK logout failed (may not be authenticated):', error);
    }

    // Clear the HTTP-only cookie
    const response = NextResponse.json({ success: true });
    response.cookies.delete('balena_token');

    return response;
  } catch (error: unknown) {
    console.error('Logout error:', error);
    // Even if logout fails, return success (client will clear local storage)
    return NextResponse.json({ success: true });
  }
}

