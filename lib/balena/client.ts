/**
 * Base HTTP Client for Balena API
 * Handles authentication, request/response interceptors, and error handling
 */

import { getApiUrl } from './config';
import { getToken } from './auth';
import { handleAPIError } from './errors';

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  requireAuth?: boolean;
}

/**
 * Build OData query string from parameters
 */
function buildODataQuery(params: Record<string, string | number | boolean | undefined>): string {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });

  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Make authenticated API request
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, requireAuth = true, headers = {}, ...fetchOptions } = options;

  // Build URL with query parameters
  let url = getApiUrl(path);
  if (params) {
    url += buildODataQuery(params);
  }

  // Prepare headers
  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Add authentication token if required
  if (requireAuth) {
    const token = getToken();
    if (!token) {
      throw new Error('Authentication required. Please login first.');
    }
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: requestHeaders,
    });

    // Handle empty responses (e.g., 204 No Content)
    if (response.status === 204) {
      return {} as T;
    }

    // Handle error responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        response: {
          status: response.status,
          statusText: response.statusText,
          data: errorData,
        },
      };
    }

    // Parse JSON response
    const data = await response.json();
    
    // Handle OData responses (d:results or value array)
    if (data.d && Array.isArray(data.d.results)) {
      return data.d.results as T;
    }
    if (Array.isArray(data.value)) {
      return data.value as T;
    }
    if (data.d) {
      return data.d as T;
    }

    return data as T;
  } catch (error) {
    handleAPIError(error);
    throw error;
  }
}

/**
 * GET request helper
 */
export function get<T>(path: string, options?: RequestOptions): Promise<T> {
  return apiRequest<T>(path, {
    ...options,
    method: 'GET',
  });
}

/**
 * POST request helper
 */
export function post<T>(path: string, data?: any, options?: RequestOptions): Promise<T> {
  return apiRequest<T>(path, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PATCH request helper
 */
export function patch<T>(path: string, data?: any, options?: RequestOptions): Promise<T> {
  return apiRequest<T>(path, {
    ...options,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request helper
 */
export function del<T>(path: string, options?: RequestOptions): Promise<T> {
  return apiRequest<T>(path, {
    ...options,
    method: 'DELETE',
  });
}

/**
 * Build OData $expand query parameter
 */
export function expand(...relations: string[]): string {
  return relations.join(',');
}

/**
 * Build OData $filter query parameter
 */
export function filter(condition: string): string {
  return condition;
}

/**
 * Build OData $select query parameter
 */
export function select(...fields: string[]): string {
  return fields.join(',');
}

/**
 * Build OData $orderby query parameter
 */
export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): string {
  return `${field} ${direction}`;
}

