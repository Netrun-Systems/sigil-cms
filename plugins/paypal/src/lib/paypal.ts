/**
 * PayPal API Client — OAuth2 token management, Orders API
 *
 * Supports sandbox and production environments via PAYPAL_SANDBOX env var.
 * Access tokens are cached with expiry to minimize API calls.
 */

const PAYPAL_BASE = process.env.PAYPAL_SANDBOX === 'true'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com';

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

/**
 * Get an OAuth2 access token using client credentials grant.
 * Caches the token until 60 seconds before expiry.
 */
export async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PayPal OAuth failed (${res.status}): ${body}`);
  }

  const data = await res.json() as { access_token: string; expires_in: number };
  cachedToken = data.access_token;
  // Expire 60 seconds early to avoid race conditions
  tokenExpiresAt = now + (data.expires_in - 60) * 1000;

  return cachedToken;
}

export interface OrderItem {
  name: string;
  unitPrice: number; // cents
  quantity: number;
}

/**
 * Create a PayPal order via the Orders v2 API.
 * Returns the PayPal order ID for client-side approval.
 */
export async function createOrder(
  items: OrderItem[],
  currency = 'USD',
): Promise<{ id: string; status: string }> {
  const token = await getAccessToken();

  const totalCents = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalDollars = (totalCents / 100).toFixed(2);

  const purchaseItems = items.map((item) => ({
    name: item.name,
    quantity: String(item.quantity),
    unit_amount: {
      currency_code: currency,
      value: (item.unitPrice / 100).toFixed(2),
    },
  }));

  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: totalDollars,
            breakdown: {
              item_total: {
                currency_code: currency,
                value: totalDollars,
              },
            },
          },
          items: purchaseItems,
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PayPal create order failed (${res.status}): ${body}`);
  }

  return await res.json() as { id: string; status: string };
}

/**
 * Capture an approved PayPal order.
 * Returns capture details including capture ID and payer email.
 */
export async function captureOrder(
  orderId: string,
): Promise<{ id: string; status: string; captureId: string; payerEmail?: string }> {
  const token = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PayPal capture failed (${res.status}): ${body}`);
  }

  const data = await res.json() as {
    id: string;
    status: string;
    payer?: { email_address?: string };
    purchase_units?: Array<{
      payments?: { captures?: Array<{ id: string }> };
    }>;
  };

  const captureId = data.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? '';
  const payerEmail = data.payer?.email_address;

  return {
    id: data.id,
    status: data.status,
    captureId,
    payerEmail,
  };
}
