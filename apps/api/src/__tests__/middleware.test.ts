/**
 * Middleware Unit Tests
 *
 * Tests for validation middleware (parsePagination, isValidUuid,
 * validateUuidParam, validateBody, validateQuery)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import {
  parsePagination,
  isValidUuid,
  validateUuidParam,
  validateBody,
  validateQuery,
} from '../middleware/validation.js';

// --- Mock helpers ---

function mockReq(overrides = {}): any {
  return { params: {}, query: {}, body: {}, headers: {}, ...overrides };
}

function mockRes(): any {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function createMockNext() {
  return vi.fn();
}

// --- parsePagination ---

describe('parsePagination', () => {
  it('returns default values when no query params are provided', () => {
    const req = mockReq({ query: {} });
    const result = parsePagination(req);
    expect(result).toEqual({ page: 1, limit: 20, offset: 0 });
  });

  it('parses custom page and limit', () => {
    const req = mockReq({ query: { page: '3', limit: '10' } });
    const result = parsePagination(req);
    expect(result).toEqual({ page: 3, limit: 10, offset: 20 });
  });

  it('caps limit at 100', () => {
    const req = mockReq({ query: { page: '1', limit: '999' } });
    const result = parsePagination(req);
    expect(result.limit).toBe(100);
  });

  it('clamps page to minimum of 1 for negative values', () => {
    const req = mockReq({ query: { page: '-5' } });
    const result = parsePagination(req);
    expect(result.page).toBe(1);
    expect(result.offset).toBe(0);
  });

  it('falls back to default limit when 0 is provided (parseInt fallback)', () => {
    // parseInt('0') is 0 which is falsy, so || 20 kicks in, then Math.max(1, 20) = 20
    const req = mockReq({ query: { limit: '0' } });
    const result = parsePagination(req);
    expect(result.limit).toBe(20);
  });

  it('clamps limit to minimum of 1 when negative limit is provided', () => {
    // parseInt('-5') is -5 which is truthy, so || 20 does NOT kick in
    // Math.max(1, -5) = 1
    const req = mockReq({ query: { limit: '-5' } });
    const result = parsePagination(req);
    expect(result.limit).toBe(1);
  });

  it('falls back to defaults for non-numeric page string', () => {
    const req = mockReq({ query: { page: 'abc' } });
    const result = parsePagination(req);
    expect(result.page).toBe(1);
  });

  it('falls back to defaults for non-numeric limit string', () => {
    const req = mockReq({ query: { limit: 'xyz' } });
    const result = parsePagination(req);
    expect(result.limit).toBe(20);
  });

  it('computes offset correctly for large page numbers', () => {
    const req = mockReq({ query: { page: '5', limit: '25' } });
    const result = parsePagination(req);
    expect(result).toEqual({ page: 5, limit: 25, offset: 100 });
  });
});

// --- isValidUuid ---

describe('isValidUuid', () => {
  it('returns true for a valid lowercase UUID', () => {
    expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('returns true for an uppercase UUID', () => {
    expect(isValidUuid('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
  });

  it('returns true for a mixed-case UUID', () => {
    expect(isValidUuid('550e8400-E29B-41d4-A716-446655440000')).toBe(true);
  });

  it('returns false for a non-UUID string', () => {
    expect(isValidUuid('not-a-uuid')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isValidUuid('')).toBe(false);
  });

  it('returns false for a string that is too short', () => {
    expect(isValidUuid('550e8400-e29b-41d4')).toBe(false);
  });

  it('returns false for a UUID without dashes', () => {
    expect(isValidUuid('550e8400e29b41d4a716446655440000')).toBe(false);
  });

  it('returns false for a UUID with invalid hex characters', () => {
    expect(isValidUuid('550e8400-e29b-41d4-a716-44665544zzzz')).toBe(false);
  });
});

// --- validateUuidParam ---

describe('validateUuidParam', () => {
  let res: any;
  let next: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    res = mockRes();
    next = createMockNext();
  });

  it('calls next() when the UUID param is valid', () => {
    const req = mockReq({ params: { id: '550e8400-e29b-41d4-a716-446655440000' } });
    const middleware = validateUuidParam('id');

    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('sends 400 with INVALID_UUID when the param is not a valid UUID', () => {
    const req = mockReq({ params: { id: 'not-valid' } });
    const middleware = validateUuidParam('id');

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'INVALID_UUID',
        }),
      })
    );
  });

  it('sends 400 with MISSING_PARAMETER when the param is absent', () => {
    const req = mockReq({ params: {} });
    const middleware = validateUuidParam('id');

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'MISSING_PARAMETER',
          message: 'Missing required parameter: id',
        }),
      })
    );
  });

  it('sends MISSING_PARAMETER when the param value is an empty string', () => {
    const req = mockReq({ params: { id: '' } });
    const middleware = validateUuidParam('id');

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'MISSING_PARAMETER',
        }),
      })
    );
  });

  it('works with a custom parameter name', () => {
    const req = mockReq({ params: { tenantId: 'bad' } });
    const middleware = validateUuidParam('tenantId');

    middleware(req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'Parameter tenantId must be a valid UUID',
        }),
      })
    );
  });
});

// --- validateBody ---

describe('validateBody', () => {
  const schema = z.object({
    name: z.string().min(1),
    age: z.number().int().positive(),
  });

  let res: any;
  let next: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    res = mockRes();
    next = createMockNext();
  });

  it('calls next() and sets parsed body when input is valid', () => {
    const req = mockReq({ body: { name: 'Alice', age: 30 } });
    const middleware = validateBody(schema);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.body).toEqual({ name: 'Alice', age: 30 });
    expect(res.status).not.toHaveBeenCalled();
  });

  it('strips unknown fields from body (Zod default strip behavior)', () => {
    const req = mockReq({ body: { name: 'Bob', age: 25, extra: true } });
    const middleware = validateBody(schema);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.body).toEqual({ name: 'Bob', age: 25 });
  });

  it('sends 400 with VALIDATION_ERROR when body is invalid', () => {
    const req = mockReq({ body: { name: '', age: -1 } });
    const middleware = validateBody(schema);

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: 'Request body validation failed',
          details: expect.any(Array),
        }),
      })
    );
  });

  it('sends 400 when body is missing required fields', () => {
    const req = mockReq({ body: {} });
    const middleware = validateBody(schema);

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.json.mock.calls[0][0];
    expect(response.error.details.length).toBeGreaterThanOrEqual(2);
  });

  it('includes field paths in validation error details', () => {
    const req = mockReq({ body: { name: 123, age: 'not-a-number' } });
    const middleware = validateBody(schema);

    middleware(req, res, next);

    const response = res.json.mock.calls[0][0];
    const fields = response.error.details.map((d: any) => d.field);
    expect(fields).toContain('name');
    expect(fields).toContain('age');
  });
});

// --- validateQuery ---

describe('validateQuery', () => {
  const schema = z.object({
    status: z.enum(['active', 'archived']),
    search: z.string().optional(),
  });

  let res: any;
  let next: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    res = mockRes();
    next = createMockNext();
  });

  it('calls next() and sets parsed query when input is valid', () => {
    const req = mockReq({ query: { status: 'active' } });
    const middleware = validateQuery(schema);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.query).toEqual({ status: 'active' });
    expect(res.status).not.toHaveBeenCalled();
  });

  it('passes through optional fields when provided', () => {
    const req = mockReq({ query: { status: 'archived', search: 'hello' } });
    const middleware = validateQuery(schema);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.query).toEqual({ status: 'archived', search: 'hello' });
  });

  it('sends 400 with VALIDATION_ERROR when query is invalid', () => {
    const req = mockReq({ query: { status: 'invalid-status' } });
    const middleware = validateQuery(schema);

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: 'Query parameter validation failed',
          details: expect.any(Array),
        }),
      })
    );
  });

  it('sends 400 when required query params are missing', () => {
    const req = mockReq({ query: {} });
    const middleware = validateQuery(schema);

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('includes field names in error details', () => {
    const req = mockReq({ query: { status: 'bad' } });
    const middleware = validateQuery(schema);

    middleware(req, res, next);

    const response = res.json.mock.calls[0][0];
    const fields = response.error.details.map((d: any) => d.field);
    expect(fields).toContain('status');
  });
});
