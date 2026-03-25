/**
 * Square Terminal API integration for Poppies POS
 *
 * Uses the Square Terminal Checkout API to send payment requests
 * to existing Square hardware (readers, terminals) from our POS.
 *
 * Flow:
 * 1. Our POS calculates total and creates a TerminalCheckout
 * 2. Square reader displays the amount, customer taps/inserts/swipes
 * 3. Square processes the payment
 * 4. We poll for completion or receive webhook
 * 5. Our POS records the payment with Square's payment_id
 *
 * Env vars: SQUARE_ACCESS_TOKEN, SQUARE_LOCATION_ID, SQUARE_DEVICE_ID, SQUARE_ENVIRONMENT
 */

const SQUARE_VERSION = '2024-01-18';

function getBaseUrl(): string {
  const env = process.env.SQUARE_ENVIRONMENT || 'sandbox';
  return env === 'production'
    ? 'https://connect.squareup.com'
    : 'https://connect.squareupsandbox.com';
}

function getHeaders(): Record<string, string> {
  return {
    'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
    'Square-Version': SQUARE_VERSION,
    'Content-Type': 'application/json',
  };
}

export interface SquareTerminalCheckout {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'CANCEL_REQUESTED' | 'CANCELED' | 'COMPLETED';
  amount_money: { amount: number; currency: string };
  payment_ids?: string[];
  created_at: string;
  updated_at: string;
  device_options: { device_id: string };
}

/**
 * List available Square Terminal devices at this location
 */
export async function listDevices(): Promise<Array<{ id: string; name: string; status: string }>> {
  const locationId = process.env.SQUARE_LOCATION_ID;
  if (!locationId) throw new Error('SQUARE_LOCATION_ID not configured');

  const res = await fetch(`${getBaseUrl()}/v2/devices?location_id=${locationId}`, {
    headers: getHeaders(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Square Devices API error: ${res.status} ${err}`);
  }

  const data = await res.json() as {
    devices?: Array<{
      id: string;
      attributes?: { name?: string; type?: string };
      status?: { category?: string };
    }>;
  };

  return (data.devices || []).map(d => ({
    id: d.id,
    name: d.attributes?.name || d.attributes?.type || 'Unknown',
    status: d.status?.category || 'unknown',
  }));
}

/**
 * Create a Terminal Checkout — sends payment request to Square reader
 *
 * @param amountCents - Amount in cents (e.g., 17779 for $177.79)
 * @param receiptNumber - Our POS receipt number for reference
 * @param note - Description shown on reader (e.g., "Poppies Art & Gifts")
 * @param deviceId - Square device ID (falls back to SQUARE_DEVICE_ID env var)
 */
export async function createTerminalCheckout(
  amountCents: number,
  receiptNumber: string,
  note?: string,
  deviceId?: string,
): Promise<SquareTerminalCheckout> {
  const device = deviceId || process.env.SQUARE_DEVICE_ID;
  if (!device) throw new Error('No Square device ID configured');

  const idempotencyKey = `pos-${receiptNumber}-${Date.now()}`;

  const body = {
    idempotency_key: idempotencyKey,
    checkout: {
      amount_money: {
        amount: amountCents,
        currency: 'USD',
      },
      device_options: {
        device_id: device,
        skip_receipt_screen: false,
        collect_signature: false,
        show_itemized_cart: false,
      },
      reference_id: receiptNumber,
      note: note || 'Poppies Art & Gifts',
      payment_options: {
        autocomplete: true, // Automatically capture the payment
      },
    },
  };

  const res = await fetch(`${getBaseUrl()}/v2/terminals/checkouts`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Square Terminal Checkout error: ${res.status} ${err}`);
  }

  const data = await res.json() as { checkout: SquareTerminalCheckout };
  return data.checkout;
}

/**
 * Get the status of a Terminal Checkout (poll until COMPLETED or CANCELED)
 */
export async function getCheckoutStatus(checkoutId: string): Promise<SquareTerminalCheckout> {
  const res = await fetch(`${getBaseUrl()}/v2/terminals/checkouts/${checkoutId}`, {
    headers: getHeaders(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Square Terminal status error: ${res.status} ${err}`);
  }

  const data = await res.json() as { checkout: SquareTerminalCheckout };
  return data.checkout;
}

/**
 * Cancel a pending Terminal Checkout
 */
export async function cancelCheckout(checkoutId: string): Promise<SquareTerminalCheckout> {
  const res = await fetch(`${getBaseUrl()}/v2/terminals/checkouts/${checkoutId}/cancel`, {
    method: 'POST',
    headers: getHeaders(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Square Terminal cancel error: ${res.status} ${err}`);
  }

  const data = await res.json() as { checkout: SquareTerminalCheckout };
  return data.checkout;
}

/**
 * Get payment details for a completed checkout
 */
export async function getPaymentDetails(paymentId: string): Promise<{
  id: string;
  status: string;
  amount: number;
  cardBrand?: string;
  cardLast4?: string;
  receiptUrl?: string;
}> {
  const res = await fetch(`${getBaseUrl()}/v2/payments/${paymentId}`, {
    headers: getHeaders(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Square Payment details error: ${res.status} ${err}`);
  }

  const data = await res.json() as {
    payment: {
      id: string;
      status: string;
      amount_money: { amount: number };
      card_details?: {
        card?: { card_brand?: string; last_4?: string };
      };
      receipt_url?: string;
    };
  };

  const p = data.payment;
  return {
    id: p.id,
    status: p.status,
    amount: p.amount_money.amount,
    cardBrand: p.card_details?.card?.card_brand,
    cardLast4: p.card_details?.card?.last_4,
    receiptUrl: p.receipt_url,
  };
}

/**
 * Poll a checkout until it completes or times out
 *
 * @param checkoutId - Square checkout ID
 * @param timeoutMs - Max wait time (default 120s)
 * @param intervalMs - Poll interval (default 2s)
 */
export async function waitForCheckoutCompletion(
  checkoutId: string,
  timeoutMs = 120_000,
  intervalMs = 2_000,
): Promise<SquareTerminalCheckout> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const checkout = await getCheckoutStatus(checkoutId);

    if (checkout.status === 'COMPLETED' || checkout.status === 'CANCELED') {
      return checkout;
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Checkout ${checkoutId} timed out after ${timeoutMs}ms`);
}

/**
 * Refund a Square payment
 */
export async function refundPayment(
  paymentId: string,
  amountCents: number,
  reason?: string,
): Promise<{ id: string; status: string }> {
  const idempotencyKey = `refund-${paymentId}-${Date.now()}`;

  const res = await fetch(`${getBaseUrl()}/v2/refunds`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      idempotency_key: idempotencyKey,
      payment_id: paymentId,
      amount_money: {
        amount: amountCents,
        currency: 'USD',
      },
      reason: reason || 'POS refund',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Square refund error: ${res.status} ${err}`);
  }

  const data = await res.json() as { refund: { id: string; status: string } };
  return data.refund;
}

/**
 * Check if Square Terminal is configured
 */
export function isSquareConfigured(): boolean {
  return !!(process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_LOCATION_ID);
}

/**
 * Check if a specific device is configured
 */
export function isDeviceConfigured(): boolean {
  return !!(process.env.SQUARE_DEVICE_ID);
}
