/**
 * Balena API Configuration
 */

export interface BalenaConfig {
  baseUrl: string;
  apiVersion: string;
  timeout: number;
}

const config: BalenaConfig = {
  baseUrl: process.env.NEXT_PUBLIC_BALENA_API_URL || 'https://api.balena-cloud.com',
  apiVersion: 'v7',
  timeout: 30000, // 30 seconds
};

export function getApiUrl(path: string = ''): string {
  const base = config.baseUrl.endsWith('/') ? config.baseUrl.slice(0, -1) : config.baseUrl;
  const version = config.apiVersion;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}/${version}${cleanPath}`;
}

export function getSupervisorUrl(deviceIp: string, path: string = ''): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `http://${deviceIp}:48484${cleanPath}`;
}

export default config;

