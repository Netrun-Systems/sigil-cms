/**
 * Stripe Terminal server-side helpers
 *
 * Provides connection tokens for Terminal JS SDK, PaymentIntent creation
 * for card-present transactions, and refund handling.
 */

import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-03-31.basil' as Stripe.LatestApiVersion,
      appInfo: { name: 'Poppies-POS', version: '1.0.0' },
    });
  }
  return stripeInstance;
}

/**
 * Generate a connection token for the Stripe Terminal JS SDK.
 * The client SDK calls this on initialization and periodically to refresh.
 */
export async function createConnectionToken(): Promise<string> {
  const stripe = getStripe();
  const token = await stripe.terminal.connectionTokens.create();
  return token.secret;
}

/**
 * Create a PaymentIntent for a card-present transaction via Stripe Terminal.
 * Amount is in dollars — converted to cents internally.
 */
export async function createPaymentIntent(
  amount: number,
  metadata: Record<string, string>,
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe();
  return stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // convert dollars to cents
    currency: 'usd',
    payment_method_types: ['card_present'],
    capture_method: 'automatic',
    metadata,
  });
}

/**
 * Refund a payment (full or partial).
 * If amount is provided, it should be in dollars.
 */
export async function refundPayment(
  paymentIntentId: string,
  amount?: number,
): Promise<Stripe.Refund> {
  const stripe = getStripe();
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    ...(amount ? { amount: Math.round(amount * 100) } : {}),
  });
}

/**
 * List registered Terminal readers for the account.
 */
export async function listReaders(): Promise<Stripe.Terminal.Reader[]> {
  const stripe = getStripe();
  const result = await stripe.terminal.readers.list({ limit: 100 });
  return result.data;
}

/**
 * Register a new Terminal reader by registration code.
 */
export async function registerReader(
  registrationCode: string,
  label: string,
  locationId?: string,
): Promise<Stripe.Terminal.Reader> {
  const stripe = getStripe();
  return stripe.terminal.readers.create({
    registration_code: registrationCode,
    label,
    ...(locationId ? { location: locationId } : {}),
  });
}
