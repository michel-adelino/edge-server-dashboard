/**
 * Balena SDK Authentication Helper
 * Server-side only - provides authenticated SDK instances
 */

import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_BALENA_API_URL || 'https://api.balena-cloud.com';
const CLEAN_API_URL = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;

/**
 * Get an authenticated Balena SDK instance
 * Uses token from HTTP-only cookie
 */
export async function getAuthenticatedSdk() {
  const cookieStore = await cookies();
  const token = cookieStore.get('balena_token')?.value;
  
  if (!token) {
    throw new Error('Not authenticated');
  }
  
  // Dynamic import to prevent webpack bundling
  const { getSdk } = await import('balena-sdk');
  
  // For OpenBalena with self-signed certificates
  if (process.env.NODE_ENV !== 'production' || CLEAN_API_URL.includes('withu.info')) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
  
  const balena = getSdk({
    apiUrl: CLEAN_API_URL,
    dataDirectory: false, // Use in-memory for serverless/Next.js
  });
  
  await balena.auth.loginWithToken(token);
  
  return balena;
}

/**
 * Get the API URL
 */
export function getApiUrl(): string {
  return CLEAN_API_URL;
}

