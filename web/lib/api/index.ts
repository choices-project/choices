/**
 * API Library - Centralized Exports
 *
 * Single import point for all API utilities, types, and clients.
 *
 * @example
 * import { successResponse, apiClient, type UserProfile } from '@/lib/api';
 *
 * Created: November 6, 2025 (Phase 3)
 * Status: ✅ ACTIVE
 */

// Types
export * from './types';

// Response utilities (server-side)
export * from './response-utils';

// Client utilities (client-side)
export {
  apiClient,
  ApiError,
  get,
  post,
  put,
  patch,
  del,
  createQueryFn,
  createMutationFn,
  profileApi,
  dashboardApi,
  feedbackApi,
  trendingApi,
  healthApi,
  authApi,
  getErrorMessage,
  shouldReAuthenticate,
  shouldRetry,
} from './client';

export type { ApiClientOptions } from './client';

