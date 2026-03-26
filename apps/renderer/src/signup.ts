/**
 * Sigil CMS Signup Route Handler
 *
 * Maps /signup?plan=<plan> to the corresponding Stripe Payment Link.
 * Uses Stripe Hosted Checkout (PCI compliant — no card data touches our servers).
 *
 * Payment links are registered in:
 *   /data/workspace/github/boardroom/reports/payment_links_registry.md
 */

import type { Request, Response } from 'express';

// Stripe Payment Links — Sigil CMS plans
// Source of truth: boardroom/reports/payment_links_registry.md
const PAYMENT_LINKS: Record<string, string> = {
  // Monthly plans
  'starter':          'https://buy.stripe.com/dRmeVf1Mgf806sjcIybwk0F',
  'starter-monthly':  'https://buy.stripe.com/dRmeVf1Mgf806sjcIybwk0F',
  'solo':             'https://buy.stripe.com/dRmeVf1Mgf806sjcIybwk0F',

  'pro':              'https://buy.stripe.com/28E14p9eIcZS3g78sibwk0H',
  'pro-monthly':      'https://buy.stripe.com/28E14p9eIcZS3g78sibwk0H',
  'team':             'https://buy.stripe.com/28E14p9eIcZS3g78sibwk0H',

  'business':         'https://buy.stripe.com/cNi00l1Mg5xq6sj23Ubwk0J',
  'business-monthly': 'https://buy.stripe.com/cNi00l1Mg5xq6sj23Ubwk0J',

  'enterprise':         'https://buy.stripe.com/fZu14p3Uo0d617Z5g6bwk0L',
  'enterprise-monthly': 'https://buy.stripe.com/fZu14p3Uo0d617Z5g6bwk0L',

  // Yearly plans
  'starter-yearly':   'https://buy.stripe.com/8x214p1Mgf80aIzaAqbwk0G',
  'solo-yearly':      'https://buy.stripe.com/8x214p1Mgf80aIzaAqbwk0G',

  'pro-yearly':       'https://buy.stripe.com/8x2bJ3fD69NG17ZfUKbwk0I',
  'team-yearly':      'https://buy.stripe.com/8x2bJ3fD69NG17ZfUKbwk0I',

  'business-yearly':  'https://buy.stripe.com/dRm7sNcqU5xqdUL37Ybwk0K',

  'enterprise-yearly':'https://buy.stripe.com/8x228tfD60d6cQH4c2bwk0M',
};

// Default plan when no plan is specified — lowest paid tier
const DEFAULT_PLAN = 'starter';

/**
 * GET /signup
 * GET /signup?plan=pro
 * GET /signup?plan=enterprise-yearly
 *
 * Redirects to the Stripe Payment Link for the requested plan.
 * Returns 302 to Stripe Hosted Checkout.
 */
export function handleSignup(req: Request, res: Response): void {
  const planParam = (req.query.plan as string | undefined)?.toLowerCase().trim();
  const plan = planParam || DEFAULT_PLAN;

  const stripeUrl = PAYMENT_LINKS[plan];

  if (!stripeUrl) {
    // Unknown plan — redirect to default with a note, not a 404
    // This prevents broken links from bouncing visitors entirely
    console.warn(`[signup] Unknown plan requested: "${plan}" — redirecting to default`);
    res.redirect(302, PAYMENT_LINKS[DEFAULT_PLAN]);
    return;
  }

  console.info(`[signup] Redirecting plan="${plan}" to Stripe`);
  res.redirect(302, stripeUrl);
}
