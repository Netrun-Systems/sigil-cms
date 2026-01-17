/**
 * Request Validation Middleware
 *
 * Helpers for validating request data using express-validator and Zod
 */

import type { Request, Response, NextFunction } from 'express';
import { validationResult, type ValidationChain } from 'express-validator';
import type { ZodSchema, ZodError } from 'zod';
import type { ApiResponse, PaginationParams } from '../types/index.js';

/**
 * Run express-validator validations and return errors if any
 */
export function validate(validations: ValidationChain[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      next();
      return;
    }

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: errors.array().map((err) => ({
          field: 'path' in err ? err.path : 'unknown',
          message: err.msg,
        })),
      },
    };

    res.status(400).json(response);
  };
}

/**
 * Validate request body against a Zod schema
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      const zodError = error as ZodError;
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request body validation failed',
          details: zodError.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      };

      res.status(400).json(response);
    }
  };
}

/**
 * Validate query parameters against a Zod schema
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as Record<string, unknown>;
      next();
    } catch (error) {
      const zodError = error as ZodError;
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Query parameter validation failed',
          details: zodError.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      };

      res.status(400).json(response);
    }
  };
}

/**
 * Parse and validate pagination parameters from query string
 */
export function parsePagination(req: Request): PaginationParams {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Validate UUID format
 */
export function isValidUuid(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Middleware to validate UUID path parameter
 */
export function validateUuidParam(paramName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.params[paramName];

    if (!value) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'MISSING_PARAMETER',
          message: `Missing required parameter: ${paramName}`,
        },
      };
      res.status(400).json(response);
      return;
    }

    if (!isValidUuid(value)) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'INVALID_UUID',
          message: `Parameter ${paramName} must be a valid UUID`,
        },
      };
      res.status(400).json(response);
      return;
    }

    next();
  };
}
