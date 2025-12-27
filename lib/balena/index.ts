/**
 * Balena API Integration - Main Export
 */

// Configuration
export { default as config, getApiUrl, getSupervisorUrl } from './config';

// Authentication
export {
  login,
  logout,
  getToken,
  getUser,
  isAuthenticated,
  refreshToken,
  type AuthToken,
} from './auth';

// Client
export {
  apiRequest,
  get,
  post,
  patch,
  del,
  expand,
  filter,
  select,
  orderBy,
} from './client';

// Services
export * from './devices';
export * from './applications';
export * from './releases';
export * from './supervisor';
export * from './tags';
export * from './logs';

// Transformers
export {
  transformDevice,
  transformApplication,
  transformRelease,
  transformDeviceMetrics,
  parseDeviceTypeCategory,
  formatRelativeTime,
  parseVenueIdsFromTags,
} from './transformers';

// Types
export * from './types';

// Errors
export {
  BalenaAPIError,
  BalenaAuthError,
  BalenaNotFoundError,
  BalenaNetworkError,
  handleAPIError,
} from './errors';

