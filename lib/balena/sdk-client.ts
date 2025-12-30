/**
 * Balena SDK Client Wrapper
 * 
 * NOTE: balena-sdk is Node.js-only and cannot be used in browser/client-side code.
 * This file is kept for future server-side API routes usage only.
 * 
 * For client-side code, use direct API calls via lib/balena/client.ts
 */

// Get the base API URL (without /v7)
const getBaseApiUrl = (): string => {
  const baseUrl = process.env.NEXT_PUBLIC_BALENA_API_URL || 'https://api.balena-cloud.com';
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
};

/**
 * Create and configure a Balena SDK instance for OpenBalena
 * 
 * IMPORTANT: This function can ONLY be called from server-side code (API routes, server components).
 * It will throw an error if called from client-side code.
 * 
 * Usage example in API route:
 * ```typescript
 * // app/api/example/route.ts
 * import { createBalenaSDK } from '@/lib/balena/sdk-client';
 * 
 * export async function GET() {
 *   const sdk = await createBalenaSDK();
 *   // Use SDK here
 * }
 * ```
 */
export async function createBalenaSDK(): Promise<any> {
  // Only allow server-side usage
  if (typeof window !== 'undefined') {
    throw new Error('balena-sdk cannot be used in client-side code. Use API routes or direct API calls instead.');
  }

  try {
    // Dynamic import - only works server-side
    const BalenaSdk = await import('balena-sdk');
    const apiUrl = getBaseApiUrl();
    
    // Configure SDK for OpenBalena
    const sdk = (BalenaSdk as any).fromSharedOptions?.({
      apiUrl: apiUrl,
    }) || new (BalenaSdk as any).BalenaSDK({
      apiUrl: apiUrl,
    });

    return sdk;
  } catch (error) {
    console.error('Failed to initialize balena-sdk:', error);
    throw error;
  }
}

/**
 * Get or create a singleton SDK instance (server-side only)
 */
let sdkInstance: any = null;

export async function getBalenaSDK(): Promise<any> {
  if (typeof window !== 'undefined') {
    throw new Error('balena-sdk cannot be used in client-side code.');
  }

  if (!sdkInstance) {
    sdkInstance = await createBalenaSDK();
  }
  return sdkInstance;
}

/**
 * Reset SDK instance
 */
export function resetBalenaSDK(): void {
  sdkInstance = null;
}

