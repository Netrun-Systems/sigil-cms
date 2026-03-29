/**
 * Two-Factor Authentication Routes (TOTP)
 *
 * Addresses Payload CMS's #8 most-voted request: "Implementing 2FA" (49 upvotes, Discussion #2555)
 *
 * Flow:
 * 1. POST /api/v1/auth/2fa/setup     — generate TOTP secret + QR code URI
 * 2. POST /api/v1/auth/2fa/verify     — verify a TOTP code to enable 2FA
 * 3. POST /api/v1/auth/2fa/validate   — validate a TOTP code during login
 * 4. DELETE /api/v1/auth/2fa/disable  — disable 2FA (requires current TOTP code)
 * 5. GET /api/v1/auth/2fa/status      — check if 2FA is enabled for current user
 *
 * Uses HMAC-based TOTP (RFC 6238) with Node.js crypto — no external dependencies.
 * Compatible with Google Authenticator, Authy, 1Password, etc.
 */

import crypto from 'crypto';
import { Router } from 'express';
import { sql } from 'drizzle-orm';
import { authenticate, tenantContext } from '../middleware/index.js';
import { getDb } from '../db.js';
import type { AuthenticatedRequest } from '../types/index.js';

import type { Router as RouterType } from 'express';
const router: RouterType = Router();

router.use(authenticate);
router.use(tenantContext);

// ── TOTP Implementation (RFC 6238, no external deps) ──────────────────────

const TOTP_PERIOD = 30; // seconds
const TOTP_DIGITS = 6;
const TOTP_ALGORITHM = 'sha1';

/** Generate a random base32-encoded secret */
function generateSecret(): string {
  const bytes = crypto.randomBytes(20);
  return base32Encode(bytes);
}

/** Base32 encoding (RFC 4648) */
function base32Encode(buffer: Buffer): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const byte of buffer) bits += byte.toString(2).padStart(8, '0');
  let result = '';
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, '0');
    result += alphabet[parseInt(chunk, 2)];
  }
  return result;
}

/** Base32 decoding */
function base32Decode(encoded: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const char of encoded.toUpperCase()) {
    const idx = alphabet.indexOf(char);
    if (idx === -1) continue;
    bits += idx.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

/** Generate a TOTP code for the given secret and time */
function generateTOTP(secret: string, time?: number): string {
  const counter = Math.floor((time ?? Date.now() / 1000) / TOTP_PERIOD);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeUInt32BE(0, 0);
  counterBuffer.writeUInt32BE(counter, 4);

  const key = base32Decode(secret);
  const hmac = crypto.createHmac(TOTP_ALGORITHM, key).update(counterBuffer).digest();

  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  ) % (10 ** TOTP_DIGITS);

  return code.toString().padStart(TOTP_DIGITS, '0');
}

/** Verify a TOTP code (checks current + previous + next window for clock skew) */
function verifyTOTP(secret: string, code: string): boolean {
  const now = Date.now() / 1000;
  for (const offset of [-TOTP_PERIOD, 0, TOTP_PERIOD]) {
    if (generateTOTP(secret, now + offset) === code) return true;
  }
  return false;
}

/** Build the otpauth:// URI for QR code scanning */
function buildOtpauthUri(secret: string, email: string, issuer = 'Sigil CMS'): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;
}

// ── Ensure migration ──────────────────────────────────────────────────────

let migrationRun = false;
async function ensureColumns() {
  if (migrationRun) return;
  const db = getDb();
  await db.execute(sql`
    ALTER TABLE platform_users ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(64);
    ALTER TABLE platform_users ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT false;
    ALTER TABLE platform_users ADD COLUMN IF NOT EXISTS totp_backup_codes TEXT[];
  `);
  migrationRun = true;
}

// ── Routes ────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/2fa/setup
 * Generate a new TOTP secret and return the QR code URI.
 * Does NOT enable 2FA yet — user must verify a code first.
 */
router.post('/setup', async (req: AuthenticatedRequest, res) => {
  await ensureColumns();
  const db = getDb();
  const userId = req.user!.id;

  const secret = generateSecret();
  const email = req.user!.email || 'user';
  const uri = buildOtpauthUri(secret, email);

  // Generate 8 backup codes
  const backupCodes = Array.from({ length: 8 }, () =>
    crypto.randomBytes(4).toString('hex').toUpperCase()
  );

  // Store secret (not yet enabled)
  await db.execute(sql`UPDATE platform_users SET totp_secret = ${secret}, totp_backup_codes = ${backupCodes} WHERE id = ${userId}`);

  res.json({
    success: true,
    data: {
      secret,
      uri,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}`,
      backupCodes,
      instructions: 'Scan the QR code with Google Authenticator, Authy, or 1Password. Then call /auth/2fa/verify with a code to enable 2FA.',
    },
  });
});

/**
 * POST /api/v1/auth/2fa/verify
 * Verify a TOTP code to enable 2FA.
 * Body: { code: string }
 */
router.post('/verify', async (req: AuthenticatedRequest, res) => {
  await ensureColumns();
  const db = getDb();
  const userId = req.user!.id;
  const { code } = req.body;

  if (!code || typeof code !== 'string' || code.length !== TOTP_DIGITS) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: `Code must be ${TOTP_DIGITS} digits` } });
    return;
  }

  // Get stored secret
  const result = await db.execute(sql`SELECT totp_secret FROM platform_users WHERE id = ${userId}`);
  const rows = (result as any).rows ?? result;
  const secret = rows[0]?.totp_secret;

  if (!secret) {
    res.status(400).json({ success: false, error: { code: 'SETUP_REQUIRED', message: 'Call /auth/2fa/setup first' } });
    return;
  }

  if (!verifyTOTP(secret, code)) {
    res.status(401).json({ success: false, error: { code: 'INVALID_CODE', message: 'Invalid verification code. Check your authenticator app and try again.' } });
    return;
  }

  // Enable 2FA
  await db.execute(sql`UPDATE platform_users SET totp_enabled = true WHERE id = ${userId}`);

  res.json({ success: true, data: { enabled: true, message: '2FA is now active. You will need a code from your authenticator app to log in.' } });
});

/**
 * POST /api/v1/auth/2fa/validate
 * Validate a TOTP code during login (called after password auth succeeds).
 * Body: { code: string, userId: string }
 */
router.post('/validate', async (req: AuthenticatedRequest, res) => {
  await ensureColumns();
  const db = getDb();
  const { code, userId } = req.body;

  if (!code || !userId) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'code and userId required' } });
    return;
  }

  const result = await db.execute(sql`SELECT totp_secret, totp_enabled, totp_backup_codes FROM platform_users WHERE id = ${userId}`);
  const rows = (result as any).rows ?? result;
  const user = rows[0];

  if (!user?.totp_enabled) {
    res.json({ success: true, data: { valid: true, reason: '2FA not enabled' } });
    return;
  }

  // Check TOTP code
  if (verifyTOTP(user.totp_secret, code)) {
    res.json({ success: true, data: { valid: true } });
    return;
  }

  // Check backup codes
  const backupCodes: string[] = user.totp_backup_codes || [];
  const codeUpper = code.toUpperCase();
  const backupIdx = backupCodes.indexOf(codeUpper);
  if (backupIdx !== -1) {
    // Consume the backup code
    const remaining = [...backupCodes];
    remaining.splice(backupIdx, 1);
    await db.execute(sql`UPDATE platform_users SET totp_backup_codes = ${remaining} WHERE id = ${userId}`);
    res.json({ success: true, data: { valid: true, usedBackupCode: true, remainingBackupCodes: remaining.length } });
    return;
  }

  res.status(401).json({ success: false, error: { code: 'INVALID_CODE', message: 'Invalid 2FA code' } });
});

/**
 * DELETE /api/v1/auth/2fa/disable
 * Disable 2FA. Requires a valid TOTP code for security.
 * Body: { code: string }
 */
router.delete('/disable', async (req: AuthenticatedRequest, res) => {
  await ensureColumns();
  const db = getDb();
  const userId = req.user!.id;
  const { code } = req.body;

  const result = await db.execute(sql`SELECT totp_secret, totp_enabled FROM platform_users WHERE id = ${userId}`);
  const rows = (result as any).rows ?? result;
  const user = rows[0];

  if (!user?.totp_enabled) {
    res.json({ success: true, data: { disabled: true, message: '2FA was not enabled' } });
    return;
  }

  if (!code || !verifyTOTP(user.totp_secret, code)) {
    res.status(401).json({ success: false, error: { code: 'INVALID_CODE', message: 'Valid 2FA code required to disable 2FA' } });
    return;
  }

  await db.execute(sql`UPDATE platform_users SET totp_enabled = false, totp_secret = NULL, totp_backup_codes = NULL WHERE id = ${userId}`);

  res.json({ success: true, data: { disabled: true } });
});

/**
 * GET /api/v1/auth/2fa/status
 * Check if 2FA is enabled for the current user.
 */
router.get('/status', async (req: AuthenticatedRequest, res) => {
  await ensureColumns();
  const db = getDb();
  const result = await db.execute(sql`SELECT totp_enabled, ARRAY_LENGTH(totp_backup_codes, 1) as backup_count FROM platform_users WHERE id = ${req.user!.id}`);
  const rows = (result as any).rows ?? result;
  const user = rows[0];

  res.json({
    success: true,
    data: {
      enabled: user?.totp_enabled || false,
      backupCodesRemaining: user?.backup_count || 0,
    },
  });
});

export default router;
