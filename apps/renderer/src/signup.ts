/**
 * Sigil CMS Signup Route Handler
 *
 * Maps /signup?plan=<plan> to the corresponding Stripe Payment Link.
 * Uses Stripe Hosted Checkout (PCI compliant — no card data touches our servers).
 * All payment links support promotion codes (e.g., free month codes).
 */

import type { Request, Response } from 'express';

// Stripe Payment Links — Sigil CMS plans (v2 — promo codes enabled)
const PAYMENT_LINKS: Record<string, string> = {
  // Monthly plans
  'starter':          'https://buy.stripe.com/8x26oJ8aEgc48Ar8sibwk11',
  'starter-monthly':  'https://buy.stripe.com/8x26oJ8aEgc48Ar8sibwk11',
  'solo':             'https://buy.stripe.com/8x26oJ8aEgc48Ar8sibwk11',

  'pro':              'https://buy.stripe.com/dRm5kF2Qk3pi2c323Ubwk13',
  'pro-monthly':      'https://buy.stripe.com/dRm5kF2Qk3pi2c323Ubwk13',
  'team':             'https://buy.stripe.com/dRm5kF2Qk3pi2c323Ubwk13',

  'business':         'https://buy.stripe.com/3cIdRb8aE7FydULgYObwk15',
  'business-monthly': 'https://buy.stripe.com/3cIdRb8aE7FydULgYObwk15',

  // Yearly plans (20% discount)
  'starter-yearly':   'https://buy.stripe.com/14AfZjaiMcZSeYP37Ybwk12',
  'solo-yearly':      'https://buy.stripe.com/14AfZjaiMcZSeYP37Ybwk12',

  'pro-yearly':       'https://buy.stripe.com/eVq4gB0Ic5xq9EvgYObwk14',
  'team-yearly':      'https://buy.stripe.com/eVq4gB0Ic5xq9EvgYObwk14',

  'business-yearly':  'https://buy.stripe.com/9B69AV4Ys9NG9Ev5g6bwk16',
};

const DEFAULT_PLAN = 'starter';

/**
 * GET /signup
 * GET /signup?plan=pro
 * GET /signup?plan=business-yearly
 *
 * Redirects to Stripe Payment Link. Promo codes accepted on all links.
 */
export function handleSignup(req: Request, res: Response): void {
  const planParam = (req.query.plan as string | undefined)?.toLowerCase().trim();
  const plan = planParam || DEFAULT_PLAN;

  const stripeUrl = PAYMENT_LINKS[plan];

  if (!stripeUrl) {
    console.warn(`[signup] Unknown plan: "${plan}" — redirecting to default`);
    res.redirect(302, PAYMENT_LINKS[DEFAULT_PLAN]);
    return;
  }

  console.info(`[signup] plan="${plan}" → Stripe`);
  res.redirect(302, stripeUrl);
}
