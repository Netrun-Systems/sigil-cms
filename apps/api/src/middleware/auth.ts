/**
 * Authentication Middleware
 *
 * JWT-based authentication for protected routes
 * This is a stub implementation - integrate with your auth provider
 */

import type { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthenticatedRequest, AuthUser } from '../types/index.js';

// JWT secret - should come from environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'netrun-cms-dev-secret-change-in-production';

/**
 * Verify JWT token and attach user to request
 */
export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'No authorization header provided',
      },
    });
    return;
  }

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    req.tenantId = decoded.tenantId;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Authentication token has expired',
        },
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
      },
    });
  }
}

/**
 * Optional authentication - attaches user if token present, continues without if not
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    req.tenantId = decoded.tenantId;
  } catch {
    // Token invalid or expired, continue without user
  }

  next();
}

/**
 * Require specific role(s) for access
 */
export function requireRole(...roles: AuthUser['role'][]) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Required role(s): ${roles.join(', ')}`,
        },
      });
      return;
    }

    next();
  };
}

/**
 * Generate JWT token for testing purposes
 * In production, this should be handled by your auth service
 */
export function generateToken(user: AuthUser, expiresIn = '24h'): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn });
}
