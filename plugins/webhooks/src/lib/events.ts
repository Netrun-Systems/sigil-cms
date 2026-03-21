/**
 * CMS Event Bus
 *
 * In-memory event emitter for CMS lifecycle events.
 * Plugins can subscribe to events and the webhook delivery system
 * listens to dispatch HTTP webhooks to registered endpoints.
 */

export interface CmsEvent {
  /** Event type identifier, e.g. 'page.published', 'block.created' */
  type: string;
  /** Site that owns this resource */
  siteId: string;
  /** Resource kind: 'page', 'block', 'media', 'order', etc. */
  resourceType: string;
  /** ID of the affected resource */
  resourceId: string;
  /** Arbitrary event payload */
  data: Record<string, unknown>;
  /** ISO-8601 timestamp */
  timestamp: string;
}

export type EventHandler = (event: CmsEvent) => void | Promise<void>;

/** In-memory listener registry keyed by event type */
const listeners = new Map<string, EventHandler[]>();

/**
 * Subscribe to an event type.
 * Use '*' to listen to all events.
 */
export function on(eventType: string, handler: EventHandler): void {
  const existing = listeners.get(eventType) || [];
  existing.push(handler);
  listeners.set(eventType, existing);
}

/**
 * Unsubscribe a handler from an event type.
 */
export function off(eventType: string, handler: EventHandler): void {
  const existing = listeners.get(eventType);
  if (!existing) return;
  const filtered = existing.filter((h) => h !== handler);
  if (filtered.length === 0) {
    listeners.delete(eventType);
  } else {
    listeners.set(eventType, filtered);
  }
}

/**
 * Emit an event. Fires all matching handlers asynchronously (does not block).
 * Handlers for the specific event type AND wildcard '*' handlers are both invoked.
 */
export function emit(event: CmsEvent): void {
  const specific = listeners.get(event.type) || [];
  const wildcard = listeners.get('*') || [];
  const all = [...specific, ...wildcard];

  for (const handler of all) {
    // Fire-and-forget — handlers run async, errors are caught and logged
    Promise.resolve()
      .then(() => handler(event))
      .catch((err) => {
        console.error(`[webhooks] Event handler error for "${event.type}":`, err);
      });
  }
}

/** Pre-defined event types for type-safe usage */
export const EVENT_TYPES = {
  PAGE_CREATED: 'page.created',
  PAGE_UPDATED: 'page.updated',
  PAGE_PUBLISHED: 'page.published',
  PAGE_DELETED: 'page.deleted',
  BLOCK_CREATED: 'block.created',
  BLOCK_UPDATED: 'block.updated',
  BLOCK_DELETED: 'block.deleted',
  MEDIA_UPLOADED: 'media.uploaded',
  MEDIA_DELETED: 'media.deleted',
  THEME_UPDATED: 'theme.updated',
  SITE_UPDATED: 'site.updated',
  ORDER_COMPLETED: 'order.completed',
  APPOINTMENT_BOOKED: 'appointment.booked',
  APPOINTMENT_CONFIRMED: 'appointment.confirmed',
  CONTACT_SUBMITTED: 'contact.submitted',
  SUBSCRIBER_ADDED: 'subscriber.added',
} as const;
