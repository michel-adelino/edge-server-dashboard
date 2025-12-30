/**
 * API Route to get current user using balena-sdk
 * Server-side only - uses authenticated SDK instance
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSdk } from '../../../lib/balena/sdk-auth';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated SDK instance (uses token from HTTP-only cookie)
    const balena = await getAuthenticatedSdk();

    // Get user information using SDK
    const userInfo = await balena.auth.getUserInfo();
    
    return NextResponse.json({
      id: userInfo.id || 0,
      email: userInfo.email || '',
      username: userInfo.username || '',
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

