---
title: Authentication & RBAC
description: JWT authentication, role-based access control, and the auth middleware.
order: 5
---

## Authentication Model

Sigil uses JWT (JSON Web Token) authentication. All authenticated endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <jwt-token>
```

## JWT Token Structure

Tokens are signed with the `JWT_SECRET` environment variable and contain:

```typescript
interface AuthUser {
  id: string;       // User UUID
  tenantId: string; // Tenant UUID (for multi-tenant scoping)
  email: string;    // User email
  role: 'admin' | 'editor' | 'author' | 'viewer';
}
```

## Auth Middleware

### `authenticate`

Verifies the JWT and attaches the user to the request. Returns 401 for:
- Missing `Authorization` header (`UNAUTHORIZED`)
- Expired token (`TOKEN_EXPIRED`)
- Invalid token (`INVALID_TOKEN`)

### `optionalAuth`

Same as `authenticate` but does not reject unauthenticated requests. If a valid token is present, the user is attached; otherwise the request continues without a user.

### `requireRole(...roles)`

Checks that the authenticated user has one of the specified roles. Returns 403 (`FORBIDDEN`) if the role check fails.

```typescript
router.post('/', requireRole('admin', 'editor', 'author'), controller.create);
router.delete('/:id', requireRole('admin', 'editor'), controller.delete);
```

## Role-Based Access Control

| Role | Create | Read | Update | Delete | Manage Users | Manage Site |
|------|--------|------|--------|--------|-------------|-------------|
| `admin` | Yes | Yes | Yes | Yes | Yes | Yes |
| `editor` | Yes | Yes | Yes | Yes | No | Limited |
| `author` | Yes | Yes | Own | No | No | No |
| `viewer` | No | Yes | No | No | No | No |

### Per-Endpoint Roles

| Resource | Create | Update | Delete |
|----------|--------|--------|--------|
| Sites | admin, editor | admin, editor | admin |
| Pages | admin, editor, author | admin, editor, author | admin, editor |
| Blocks | admin, editor, author | admin, editor, author | admin, editor |
| Media | admin, editor, author | admin, editor, author | admin, editor |
| Themes | admin, editor | admin, editor | admin |
| Scheduling | admin, editor | admin, editor | -- |

## Tenant Context

The `tenantContext` middleware extracts `tenantId` from the JWT and scopes all database queries to that tenant. This enforces data isolation between organizations.

```typescript
// Middleware chain on all authenticated routes:
router.use(authenticate);     // Verify JWT, attach user
router.use(tenantContext);    // Scope queries to tenant
```

## Token Generation

For development and testing:

```typescript
import { generateToken } from './middleware/auth';

const token = generateToken({
  id: 'user-uuid',
  tenantId: 'tenant-uuid',
  email: 'admin@example.com',
  role: 'admin',
}, '24h');
```

In production, integrate with your identity provider (Auth0, Clerk, Supabase Auth, etc.) and issue JWTs containing the `AuthUser` claims.
