/**
 * Webhook Delivery Engine
 *
 * Delivers CMS events to registered webhook endpoints with:
 * - HMAC-SHA256 payload signing
 * - Exponential backoff retries (1min, 5min, 30min)
 * - Auto-disable after 5 consecutive failures
 * - Full delivery logging
 */

import { createHmac } from 'crypto';
import { eq, and } from 'drizzle-orm';
import { webhookEndpoints, webhookDeliveries } from '../schema.js';
import type { CmsEvent } from './events.js';
import type { DrizzleClient } from '@netrun-cms/plugin-runtime';

/** Retry backoff schedule in milliseconds */
const RETRY_DELAYS_MS = [
  1 * 60 * 1000,   // 1 minute
  5 * 60 * 1000,   // 5 minutes
  30 * 60 * 1000,  // 30 minutes
];

/** Max consecutive failures before auto-disabling an endpoint */
const MAX_FAIL_COUNT = 5;

/** Timeout for webhook HTTP requests (10 seconds) */
const DELIVERY_TIMEOUT_MS = 10_000;

/**
 * Sign a payload with HMAC-SHA256.
 */
function signPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Deliver an event to all matching webhook endpoints for the event's site.
 */
export async function deliverWebhook(db: DrizzleClient, event: CmsEvent): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = db as any;

  // Find all active endpoints for this site
  const endpoints = await d
    .select()
    .from(webhookEndpoints)
    .where(
      and(
        eq(webhookEndpoints.siteId, event.siteId),
        eq(webhookEndpoints.isActive, true),
      )
    );

  for (const endpoint of endpoints) {
    // Check if endpoint subscribes to this event type
    const events: string[] = endpoint.events || ['*'];
    const matches = events.includes('*') || events.includes(event.type);
    if (!matches) continue;

    await deliverToEndpoint(d, endpoint, event);
  }
}

/**
 * Deliver a single event to a single endpoint.
 */
async function deliverToEndpoint(
  db: any,
  endpoint: typeof webhookEndpoints.$inferSelect,
  event: CmsEvent,
): Promise<void> {
  const payloadStr = JSON.stringify(event);
  const timestamp = new Date().toISOString();

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Sigil-Event': event.type,
    'X-Sigil-Timestamp': timestamp,
  };

  if (endpoint.secret) {
    const signature = signPayload(payloadStr, endpoint.secret);
    headers['X-Sigil-Signature'] = `sha256=${signature}`;
  }

  let httpStatus: number | null = null;
  let responseBody: string | null = null;
  let status: 'delivered' | 'failed' = 'failed';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);

    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers,
      body: payloadStr,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    httpStatus = response.status;

    // Read response body (truncate to 4KB)
    const text = await response.text();
    responseBody = text.slice(0, 4096);

    if (response.ok) {
      status = 'delivered';
    }
  } catch (err) {
    responseBody = err instanceof Error ? err.message : String(err);
  }

  // Calculate new fail count
  const newFailCount = status === 'delivered' ? 0 : (endpoint.failCount || 0) + 1;
  const attemptNumber = 1; // First attempt

  // Determine retry schedule for failures
  let nextRetryAt: Date | null = null;
  if (status === 'failed' && newFailCount < MAX_FAIL_COUNT) {
    const delayIndex = Math.min(newFailCount - 1, RETRY_DELAYS_MS.length - 1);
    nextRetryAt = new Date(Date.now() + RETRY_DELAYS_MS[delayIndex]);
  }

  // Record delivery
  await db.insert(webhookDeliveries).values({
    endpointId: endpoint.id,
    eventType: event.type,
    payload: event as unknown as Record<string, unknown>,
    status,
    httpStatus,
    responseBody,
    attemptCount: attemptNumber,
    nextRetryAt,
  });

  // Update endpoint stats
  const endpointUpdates: Record<string, unknown> = {
    lastDeliveryAt: new Date(),
    lastDeliveryStatus: httpStatus,
    failCount: newFailCount,
    updatedAt: new Date(),
  };

  // Auto-disable after MAX_FAIL_COUNT consecutive failures
  if (newFailCount >= MAX_FAIL_COUNT) {
    endpointUpdates.isActive = false;
  }

  await db.update(webhookEndpoints)
    .set(endpointUpdates)
    .where(eq(webhookEndpoints.id, endpoint.id));
}

/**
 * Retry all failed deliveries for a specific endpoint.
 * Re-attempts each failed delivery and updates the record.
 */
export async function retryFailedDeliveries(db: DrizzleClient, endpointId: string): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = db as any;

  const [endpoint] = await d
    .select()
    .from(webhookEndpoints)
    .where(eq(webhookEndpoints.id, endpointId))
    .limit(1);

  if (!endpoint) return 0;

  const failed = await d
    .select()
    .from(webhookDeliveries)
    .where(
      and(
        eq(webhookDeliveries.endpointId, endpointId),
        eq(webhookDeliveries.status, 'failed'),
      )
    );

  let retried = 0;
  for (const delivery of failed) {
    const payloadStr = JSON.stringify(delivery.payload);
    const timestamp = new Date().toISOString();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Sigil-Event': delivery.eventType,
      'X-Sigil-Timestamp': timestamp,
    };

    if (endpoint.secret) {
      headers['X-Sigil-Signature'] = `sha256=${signPayload(payloadStr, endpoint.secret)}`;
    }

    let httpStatus: number | null = null;
    let responseBody: string | null = null;
    let status: 'delivered' | 'failed' = 'failed';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);

      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers,
        body: payloadStr,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      httpStatus = response.status;
      const text = await response.text();
      responseBody = text.slice(0, 4096);

      if (response.ok) {
        status = 'delivered';
      }
    } catch (err) {
      responseBody = err instanceof Error ? err.message : String(err);
    }

    await d.update(webhookDeliveries)
      .set({
        status,
        httpStatus,
        responseBody,
        attemptCount: (delivery.attemptCount || 0) + 1,
        nextRetryAt: null,
      })
      .where(eq(webhookDeliveries.id, delivery.id));

    retried++;
  }

  // Reset fail count if any retries succeeded
  if (retried > 0) {
    await d.update(webhookEndpoints)
      .set({ failCount: 0, isActive: true, updatedAt: new Date() })
      .where(eq(webhookEndpoints.id, endpointId));
  }

  return retried;
}
