/**
 * API Route for Login using balena-sdk
 * Server-side only - uses balena-sdk properly
 * 
 * Reference: https://docs.balena.io/reference/sdk/node-sdk/latest/
 * 
 * Using dynamic import to prevent webpack from bundling balena-sdk
 * and trying to process LICENSE files
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get API URL from environment
    const apiUrl = process.env.NEXT_PUBLIC_BALENA_API_URL || 'https://api.balena-cloud.com';
    const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;

    // Dynamic import to prevent webpack from bundling balena-sdk
    // This avoids webpack trying to process LICENSE and other non-JS files
    const { getSdk } = await import('balena-sdk');

    // For OpenBalena with self-signed certificates, disable SSL verification
    // This is needed because OpenBalena often uses self-signed certificates
    if (process.env.NODE_ENV !== 'production' || cleanApiUrl.includes('withu.info')) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    // Initialize balena SDK with OpenBalena API URL
    // Reference: https://docs.balena.io/reference/sdk/node-sdk/latest/#balena-sdk~getSdk
    // Use dataDirectory: false for serverless/Next.js
    const balena = getSdk({
      apiUrl: cleanApiUrl,
      dataDirectory: false, // Use in-memory for serverless/Next.js
    });

    // Login using SDK
    // Reference: https://docs.balena.io/reference/sdk/node-sdk/latest/#auth+login
    await balena.auth.login({ 
      email, 
      password 
    });

    // Get the session token after login
    // Reference: https://docs.balena.io/reference/sdk/node-sdk/latest/#auth+getToken
    const token = await balena.auth.getToken();
    
    if (!token) {
      throw new Error('Failed to get session token after login');
    }

    // Get user information
    let user: { id: number; email: string; username: string };
    try {
      // Try to get user info using SDK
      const userInfo = await balena.auth.getUserInfo();
      user = {
        id: userInfo.id || 0,
        email: userInfo.email || email,
        username: userInfo.username || email.split('@')[0] || 'user',
      };
    } catch {
      // Fallback: fetch user info directly from API
      try {
        const userResponse = await fetch(`${cleanApiUrl}/v7/user`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          // @ts-expect-error - Node.js fetch option
          rejectUnauthorized: false,
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          const userObj = userData.d || userData;
          user = {
            id: userObj.id || 0,
            email: userObj.email || email,
            username: userObj.username || email.split('@')[0] || 'user',
          };
        } else {
          throw new Error('Failed to get user info');
        }
      } catch (fetchError) {
        // If all fails, use email to construct basic user info
        console.warn('Could not fetch user info, using email:', fetchError);
        user = {
          id: 0,
          email: email,
          username: email.split('@')[0] || 'user',
        };
      }
    }

    // Create response with user info
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email || email,
        username: user.username || email.split('@')[0] || 'user',
      },
    });

    // Store token in HTTP-only cookie for security
    response.cookies.set('balena_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    console.error('Login error:', error);

    // Handle SDK-specific errors
    const errorMessage = error instanceof Error ? error.message : 'Login failed';
    
    if (errorMessage.includes('401') || errorMessage.includes('Invalid') || errorMessage.includes('unauthorized')) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
      return NextResponse.json(
        { error: 'Access forbidden. Please check your credentials.' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

