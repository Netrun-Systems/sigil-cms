/**
 * Middleware exports
 */

export { authenticate, optionalAuth, requireRole, generateToken } from './auth.js';
export { tenantContext, siteToTenantContext } from './tenant.js';
export {
  validate,
  validateBody,
  validateQuery,
  parsePagination,
  isValidUuid,
  validateUuidParam,
} from './validation.js';
export { resolveSubdomain, requireSubdomainResolution } from './subdomain.js';
export { auditLog } from './audit.js';
export {
  enforceSiteLimit,
  enforcePageLimit,
  enforceStorageLimit,
  enforceCustomDomain,
  enforcePluginAccess,
  enforceApiAccess,
} from './plan-enforcement.js';
