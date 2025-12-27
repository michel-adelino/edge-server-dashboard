/**
 * Custom error classes for Balena API
 */

export class BalenaAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'BalenaAPIError';
  }
}

export class BalenaAuthError extends BalenaAPIError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
    this.name = 'BalenaAuthError';
  }
}

export class BalenaNotFoundError extends BalenaAPIError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
    this.name = 'BalenaNotFoundError';
  }
}

export class BalenaNetworkError extends Error {
  constructor(message: string = 'Network error occurred') {
    super(message);
    this.name = 'BalenaNetworkError';
  }
}

export function handleAPIError(error: any): never {
  if (error instanceof BalenaAPIError) {
    throw error;
  }

  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.error || error.response.statusText || 'API request failed';

    switch (status) {
      case 401:
        // Clear authentication on 401 errors
        if (typeof window !== 'undefined') {
          localStorage.removeItem('balena_auth_token');
          localStorage.removeItem('balena_user');
          // Redirect to login if not already there
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
        throw new BalenaAuthError(message);
      case 404:
        throw new BalenaNotFoundError(message);
      case 403:
        throw new BalenaAPIError('Forbidden: You do not have permission to perform this action', 403, error.response.data);
      case 500:
        throw new BalenaAPIError('Internal server error', 500, error.response.data);
      default:
        throw new BalenaAPIError(message, status, error.response.data);
    }
  }

  if (error.request) {
    throw new BalenaNetworkError('Network request failed. Please check your connection.');
  }

  throw new BalenaAPIError(error.message || 'An unexpected error occurred');
}

