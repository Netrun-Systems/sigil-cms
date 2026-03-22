#!/usr/bin/env npx tsx
/**
 * Sigil CMS — Stripe Product & Price Setup
 *
 * Creates the Stripe Products and Prices for Sigil billing tiers.
 * Run once to bootstrap your Stripe account, then set the price IDs
 * as environment variables on Cloud Run.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_... npx tsx scripts/setup-stripe.ts
 *
 * Outputs the env vars to set on Cloud Run.
 */

import Stripe from 'stripe';

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_KEY) {
  console.error('ERROR: Set STRIPE_SECRET_KEY environment variable');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_KEY);

interface PlanConfig {
  name: string;
  description: string;
  monthlyPrice: number; // cents
  yearlyPrice: number;  // cents per month (billed annually)
}

const PLANS: Record<string, PlanConfig> = {
  starter: {
    name: 'Sigil Starter',
    description: '1 site, 50 pages, 1GB storage, 5 plugins, custom domain',
    monthlyPrice: 1200,
    yearlyPrice: 11520, // $115.20/year ($9.60/mo)
  },
  pro: {
    name: 'Sigil Pro',
    description: '3 sites, unlimited pages, 10GB storage, all plugins, API access',
    monthlyPrice: 2900,
    yearlyPrice: 27840, // $278.40/year ($23.20/mo)
  },
  business: {
    name: 'Sigil Business',
    description: '10 sites, unlimited pages, 50GB storage, white-label, priority support',
    monthlyPrice: 7900,
    yearlyPrice: 75840, // $758.40/year ($63.20/mo)
  },
};

async function main() {
  console.log('Setting up Stripe products and prices for Sigil CMS...\n');

  const envVars: string[] = [];

  for (const [planId, plan] of Object.entries(PLANS)) {
    console.log(`Creating ${plan.name}...`);

    // Check if product already exists
    const existing = await stripe.products.search({
      query: `metadata["sigil_plan"]:"${planId}"`,
    });

    let product: Stripe.Product;

    if (existing.data.length > 0) {
      product = existing.data[0];
      console.log(`  Product exists: ${product.id}`);
    } else {
      product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: { sigil_plan: planId },
      });
      console.log(`  Product created: ${product.id}`);
    }

    // Create monthly price
    const monthlyPrices = await stripe.prices.list({
      product: product.id,
      type: 'recurring',
      active: true,
    });

    let monthlyPrice = monthlyPrices.data.find(
      (p) => p.recurring?.interval === 'month' && p.unit_amount === plan.monthlyPrice
    );

    if (!monthlyPrice) {
      monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.monthlyPrice,
        currency: 'usd',
        recurring: { interval: 'month' },
        metadata: { sigil_plan: planId, billing: 'monthly' },
      });
      console.log(`  Monthly price: ${monthlyPrice.id} ($${plan.monthlyPrice / 100}/mo)`);
    } else {
      console.log(`  Monthly price exists: ${monthlyPrice.id}`);
    }

    // Create yearly price
    let yearlyPrice = monthlyPrices.data.find(
      (p) => p.recurring?.interval === 'year' && p.unit_amount === plan.yearlyPrice
    );

    if (!yearlyPrice) {
      yearlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.yearlyPrice,
        currency: 'usd',
        recurring: { interval: 'year' },
        metadata: { sigil_plan: planId, billing: 'yearly' },
      });
      console.log(`  Yearly price: ${yearlyPrice.id} ($${plan.yearlyPrice / 100}/yr)`);
    } else {
      console.log(`  Yearly price exists: ${yearlyPrice.id}`);
    }

    const key = planId.toUpperCase();
    envVars.push(`STRIPE_PRICE_${key}_MONTHLY=${monthlyPrice.id}`);
    envVars.push(`STRIPE_PRICE_${key}_YEARLY=${yearlyPrice.id}`);
    console.log();
  }

  // Create webhook endpoint
  console.log('Creating webhook endpoint...');
  const webhooks = await stripe.webhookEndpoints.list({ limit: 10 });
  const existingWebhook = webhooks.data.find(
    (w) => w.url.includes('sigil-api') && w.status === 'enabled'
  );

  if (existingWebhook) {
    console.log(`  Webhook exists: ${existingWebhook.id}`);
    console.log(`  Secret: (already configured)`);
  } else {
    const webhook = await stripe.webhookEndpoints.create({
      url: 'https://sigil-api.netrunsystems.com/api/v1/billing/webhook',
      enabled_events: [
        'checkout.session.completed',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.payment_failed',
        'invoice.payment_succeeded',
      ],
    });
    console.log(`  Webhook created: ${webhook.id}`);
    console.log(`  Webhook secret: ${webhook.secret}`);
    envVars.push(`STRIPE_WEBHOOK_SECRET=${webhook.secret}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('SETUP COMPLETE');
  console.log('='.repeat(60));
  console.log('\nSet these environment variables on Cloud Run:\n');
  console.log(`STRIPE_SECRET_KEY=${STRIPE_KEY}`);
  envVars.forEach((v) => console.log(v));
  console.log(`APP_URL=https://sigil-admin.netrunsystems.com`);

  console.log('\nTo set on Cloud Run:');
  console.log(`gcloud run services update sigil-api --region us-central1 --project gen-lang-client-0047375361 --update-env-vars "${['STRIPE_SECRET_KEY=' + STRIPE_KEY, ...envVars, 'APP_URL=https://sigil-admin.netrunsystems.com'].join(',')}"`);
}

main().catch(console.error);
