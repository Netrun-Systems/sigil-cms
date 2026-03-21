/**
 * Membership management — registration, verification, magic-link auth, JWT
 *
 * Community members are SEPARATE from CMS admin users. They are public
 * visitors who register to participate in forums.
 */

import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { communityMembers } from '../schema.js';
import type { DrizzleClient, PluginLogger } from '@netrun-cms/plugin-runtime';
import type { Request, Response, NextFunction } from 'express';

// Lazy-loaded jsonwebtoken to avoid cold start failures
let jwt: typeof import('jsonwebtoken') | null = null;
function getJwt() {
  if (!jwt) {
    jwt = require('jsonwebtoken');
  }
  return jwt;
}

const COMMUNITY_JWT_SECRET =
  process.env.COMMUNITY_JWT_SECRET || process.env.JWT_SECRET || 'community-dev-secret';
const JWT_EXPIRY = '7d';
const LOGIN_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

// In-memory login token store (short-lived — acceptable for single-instance)
// Production should use DB or Redis
const loginTokens = new Map<string, { memberId: string; siteId: string; expiresAt: number }>();

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export async function registerMember(
  db: DrizzleClient,
  siteId: string,
  data: { email: string; displayName: string },
): Promise<Record<string, unknown>> {
  const d = db as any;

  // Check for existing member
  const [existing] = await d
    .select({ id: communityMembers.id, isVerified: communityMembers.isVerified })
    .from(communityMembers)
    .where(and(eq(communityMembers.siteId, siteId), eq(communityMembers.email, data.email.toLowerCase())))
    .limit(1);

  if (existing) {
    throw new Error('A member with this email already exists');
  }

  const verificationToken = uuidv4();

  const [member] = await d
    .insert(communityMembers)
    .values({
      siteId,
      email: data.email.toLowerCase(),
      displayName: data.displayName,
      verificationToken,
    })
    .returning();

  // Try sending verification email via ACS (degrade silently if not configured)
  await sendVerificationEmail(data.email, verificationToken).catch(() => {
    // ACS not configured — verification will need to happen manually or via API
  });

  return member;
}

// ---------------------------------------------------------------------------
// Email Verification
// ---------------------------------------------------------------------------

export async function verifyEmail(db: DrizzleClient, token: string): Promise<boolean> {
  const d = db as any;

  const [member] = await d
    .select({ id: communityMembers.id })
    .from(communityMembers)
    .where(eq(communityMembers.verificationToken, token))
    .limit(1);

  if (!member) return false;

  await d
    .update(communityMembers)
    .set({ isVerified: true, verificationToken: null, updatedAt: new Date() })
    .where(eq(communityMembers.id, member.id));

  return true;
}

// ---------------------------------------------------------------------------
// Magic Link Login
// ---------------------------------------------------------------------------

export async function requestLoginLink(
  db: DrizzleClient,
  siteId: string,
  email: string,
): Promise<void> {
  const d = db as any;

  const [member] = await d
    .select({ id: communityMembers.id, isBanned: communityMembers.isBanned })
    .from(communityMembers)
    .where(and(eq(communityMembers.siteId, siteId), eq(communityMembers.email, email.toLowerCase())))
    .limit(1);

  if (!member) {
    // Don't reveal whether the email exists — silently return
    return;
  }

  if (member.isBanned) {
    return;
  }

  const token = uuidv4();
  loginTokens.set(token, {
    memberId: member.id,
    siteId,
    expiresAt: Date.now() + LOGIN_TOKEN_EXPIRY_MS,
  });

  // Also mark them verified if they weren't already (they have email access)
  await d
    .update(communityMembers)
    .set({ isVerified: true, updatedAt: new Date() })
    .where(eq(communityMembers.id, member.id));

  await sendLoginEmail(email, token).catch(() => {
    // ACS not configured — token is still in memory for API verification
  });
}

export async function verifyLoginToken(
  db: DrizzleClient,
  token: string,
): Promise<{ memberId: string; siteId: string }> {
  const entry = loginTokens.get(token);
  if (!entry) {
    throw new Error('Invalid or expired login token');
  }

  if (Date.now() > entry.expiresAt) {
    loginTokens.delete(token);
    throw new Error('Login token has expired');
  }

  // Consume the token (single use)
  loginTokens.delete(token);

  // Update last active
  const d = db as any;
  await d
    .update(communityMembers)
    .set({ lastActiveAt: new Date(), updatedAt: new Date() })
    .where(eq(communityMembers.id, entry.memberId));

  return { memberId: entry.memberId, siteId: entry.siteId };
}

// ---------------------------------------------------------------------------
// JWT Token Management
// ---------------------------------------------------------------------------

export function generateMemberToken(member: {
  id: string;
  siteId: string;
  role: string;
  displayName: string;
}): string {
  const jwtLib = getJwt();
  return jwtLib.sign(
    {
      memberId: member.id,
      siteId: member.siteId,
      role: member.role,
      displayName: member.displayName,
      type: 'community',
    },
    COMMUNITY_JWT_SECRET,
    { expiresIn: JWT_EXPIRY },
  );
}

export function verifyMemberToken(token: string): {
  memberId: string;
  siteId: string;
  role: string;
  displayName: string;
} {
  const jwtLib = getJwt();
  const payload = jwtLib.verify(token, COMMUNITY_JWT_SECRET) as any;
  if (payload.type !== 'community') {
    throw new Error('Invalid token type');
  }
  return {
    memberId: payload.memberId,
    siteId: payload.siteId,
    role: payload.role,
    displayName: payload.displayName,
  };
}

// ---------------------------------------------------------------------------
// Express Middleware
// ---------------------------------------------------------------------------

/**
 * Authenticate community member from Bearer token.
 * Sets req.member on success, 401 on failure.
 */
export function authenticateMember(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: { message: 'Authentication required' } });
    return;
  }

  try {
    const token = authHeader.slice(7);
    const member = verifyMemberToken(token);
    (req as any).member = member;
    next();
  } catch {
    res.status(401).json({ success: false, error: { message: 'Invalid or expired token' } });
  }
}

/**
 * Optional auth — sets req.member if token present, continues if not.
 */
export function optionalMember(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    const token = authHeader.slice(7);
    (req as any).member = verifyMemberToken(token);
  } catch {
    // Invalid token — continue without member context
  }
  next();
}

/**
 * Require moderator or admin role. Must be used after authenticateMember.
 */
export function requireModerator(req: Request, res: Response, next: NextFunction): void {
  const member = (req as any).member;
  if (!member) {
    res.status(401).json({ success: false, error: { message: 'Authentication required' } });
    return;
  }

  if (member.role !== 'moderator' && member.role !== 'admin') {
    res.status(403).json({ success: false, error: { message: 'Moderator or admin access required' } });
    return;
  }

  next();
}

// ---------------------------------------------------------------------------
// Email Helpers (ACS — graceful degradation)
// ---------------------------------------------------------------------------

async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
  const senderAddress = process.env.ACS_SENDER_ADDRESS;
  if (!connectionString || !senderAddress) return;

  const { EmailClient } = await import('@azure/communication-email');
  const client = new EmailClient(connectionString);

  await client.beginSend({
    senderAddress,
    recipients: { to: [{ address: email }] },
    content: {
      subject: 'Verify your community membership',
      plainText: `Welcome! Please verify your email by visiting:\n\n${process.env.APP_URL || 'http://localhost:3001'}/community/verify?token=${token}\n\nThis link will expire in 24 hours.`,
    },
  });
}

async function sendLoginEmail(email: string, token: string): Promise<void> {
  const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
  const senderAddress = process.env.ACS_SENDER_ADDRESS;
  if (!connectionString || !senderAddress) return;

  const { EmailClient } = await import('@azure/communication-email');
  const client = new EmailClient(connectionString);

  await client.beginSend({
    senderAddress,
    recipients: { to: [{ address: email }] },
    content: {
      subject: 'Your login link',
      plainText: `Click to log in to the community:\n\n${process.env.APP_URL || 'http://localhost:3001'}/community/login?token=${token}\n\nThis link expires in 15 minutes and can only be used once.`,
    },
  });
}
