/**
 * Plan Definitions & Enforcement Utilities
 *
 * Defines SaaS plan tiers, limits, and helper functions for
 * checking plan capabilities across the Sigil CMS platform.
 */

export interface PlanLimits {
  maxSites: number;
  maxPagesPerSite: number;
  maxStorageMb: number;
  maxMediaFiles: number;
  customDomain: boolean;
  removeBranding: boolean;
  plugins: string[]; // plugin IDs that are enabled, '*' = all
  apiAccess: boolean;
  webhooks: boolean;
  prioritySupport: boolean;
}

export interface PlanDefinition {
  name: string;
  displayName: string;
  monthlyPrice: number; // in cents
  yearlyPrice: number; // in cents (total for 12 months)
  limits: PlanLimits;
}

export const PLAN_NAMES = ['free', 'starter', 'pro', 'business', 'enterprise'] as const;
export type PlanName = typeof PLAN_NAMES[number];

export const PLANS: Record<PlanName, PlanDefinition> = {
  free: {
    name: 'free',
    displayName: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    limits: {
      maxSites: 1,
      maxPagesPerSite: 5,
      maxStorageMb: 100,
      maxMediaFiles: 50,
      customDomain: false,
      removeBranding: false,
      plugins: ['seo', 'contact', 'mailing-list'],
      apiAccess: false,
      webhooks: false,
      prioritySupport: false,
    },
  },
  starter: {
    name: 'starter',
    displayName: 'Starter',
    monthlyPrice: 1200, // $12
    yearlyPrice: 11520, // $9.60/mo billed yearly ($115.20)
    limits: {
      maxSites: 1,
      maxPagesPerSite: 50,
      maxStorageMb: 1024,
      maxMediaFiles: 500,
      customDomain: true,
      removeBranding: true,
      plugins: ['seo', 'contact', 'mailing-list', 'artist', 'docs'],
      apiAccess: false,
      webhooks: false,
      prioritySupport: false,
    },
  },
  pro: {
    name: 'pro',
    displayName: 'Pro',
    monthlyPrice: 2900, // $29
    yearlyPrice: 27840, // $23.20/mo billed yearly
    limits: {
      maxSites: 3,
      maxPagesPerSite: -1, // unlimited
      maxStorageMb: 10240, // 10GB
      maxMediaFiles: -1,
      customDomain: true,
      removeBranding: true,
      plugins: ['*'], // all plugins
      apiAccess: true,
      webhooks: true,
      prioritySupport: false,
    },
  },
  business: {
    name: 'business',
    displayName: 'Business',
    monthlyPrice: 7900, // $79
    yearlyPrice: 75840, // $63.20/mo billed yearly
    limits: {
      maxSites: 10,
      maxPagesPerSite: -1,
      maxStorageMb: 51200, // 50GB
      maxMediaFiles: -1,
      customDomain: true,
      removeBranding: true,
      plugins: ['*'],
      apiAccess: true,
      webhooks: true,
      prioritySupport: true,
    },
  },
  enterprise: {
    name: 'enterprise',
    displayName: 'Enterprise',
    monthlyPrice: 0, // custom pricing
    yearlyPrice: 0,
    limits: {
      maxSites: -1,
      maxPagesPerSite: -1,
      maxStorageMb: -1,
      maxMediaFiles: -1,
      customDomain: true,
      removeBranding: true,
      plugins: ['*'],
      apiAccess: true,
      webhooks: true,
      prioritySupport: true,
    },
  },
};

/**
 * Get plan limits for a given plan name. Falls back to free tier.
 */
export function getPlanLimits(planName: string): PlanLimits {
  return PLANS[planName as PlanName]?.limits || PLANS.free.limits;
}

/**
 * Get the full plan definition by name.
 */
export function getPlanDefinition(planName: string): PlanDefinition | undefined {
  return PLANS[planName as PlanName];
}

/**
 * Check if a plugin is allowed by the tenant's plan.
 */
export function isPluginAllowed(planName: string, pluginId: string): boolean {
  const limits = getPlanLimits(planName);
  return limits.plugins.includes('*') || limits.plugins.includes(pluginId);
}

/**
 * Check if a current count is within the plan limit.
 * Returns true if max is -1 (unlimited) or current < max.
 */
export function isWithinLimit(current: number, max: number): boolean {
  return max === -1 || current < max;
}

/**
 * Format cents to a display price string (e.g. 2900 -> "$29")
 */
export function formatPrice(cents: number): string {
  if (cents === 0) return 'Free';
  const dollars = cents / 100;
  return `$${dollars % 1 === 0 ? dollars.toFixed(0) : dollars.toFixed(2)}`;
}

/**
 * Get Stripe price ID env var name for a plan + interval combo.
 */
export function getStripePriceEnvKey(plan: string, interval: 'monthly' | 'yearly'): string {
  return `STRIPE_PRICE_${plan.toUpperCase()}_${interval.toUpperCase()}`;
}
