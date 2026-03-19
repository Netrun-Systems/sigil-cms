/**
 * API Type Definitions
 *
 * Common types used across the Express.js API
 */

import type { Request } from 'express';

/**
 * Authenticated user from JWT token
 */
export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'author' | 'viewer';
  tenantId: string;
}

/**
 * Extended Express Request with tenant and user context
 */
export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  tenantId?: string;
  params: { [key: string]: string };
}

/**
 * Pagination query parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Standard paginated response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Sort direction for queries
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Site filter options for page/block/theme queries
 */
export interface SiteFilterParams {
  siteId: string;
  status?: string;
  language?: string;
}

/**
 * Media filter options
 */
export interface MediaFilterParams {
  siteId: string;
  folder?: string;
  mimeType?: string;
}
