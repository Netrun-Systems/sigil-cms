/**
 * Billing Page
 *
 * Subscription management, usage meters, plan comparison,
 * and Stripe portal access for tenant admins.
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CreditCard,
  Check,
  X,
  ArrowUpRight,
  AlertCircle,
  Zap,
  TrendingUp,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';
import { PLANS, formatPrice, type PlanName } from '@netrun-cms/core';

interface SubscriptionData {
  plan: string;
  planDetails: {
    displayName: string;
    monthlyPrice: number;
    yearlyPrice: number;
  };
  subscription: {
    status: string;
    billingInterval: string;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    trialEnd: string | null;
  } | null;
}

interface UsageData {
  plan: string;
  sites: { used: number; limit: number };
  pagesPerSite: { used: number; limit: number; totalPages: number };
  storage: { usedMb: number; limitMb: number };
  mediaFiles: { used: number; limit: number };
  features: {
    customDomain: boolean;
    removeBranding: boolean;
    apiAccess: boolean;
    webhooks: boolean;
    prioritySupport: boolean;
  };
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400',
  trialing: 'bg-blue-500/20 text-blue-400',
  past_due: 'bg-yellow-500/20 text-yellow-400',
  canceled: 'bg-red-500/20 text-red-400',
  incomplete: 'bg-gray-500/20 text-gray-400',
};

const PLAN_ORDER: PlanName[] = ['free', 'starter', 'pro', 'business'];

const FEATURE_LIST = [
  { key: 'maxSites', label: 'Sites' },
  { key: 'maxPagesPerSite', label: 'Pages per site' },
  { key: 'maxStorageMb', label: 'Storage' },
  { key: 'maxMediaFiles', label: 'Media files' },
  { key: 'customDomain', label: 'Custom domain' },
  { key: 'removeBranding', label: 'Remove branding' },
  { key: 'apiAccess', label: 'API access' },
  { key: 'webhooks', label: 'Webhooks' },
  { key: 'prioritySupport', label: 'Priority support' },
] as const;

function UsageMeter({
  label,
  used,
  limit,
  unit,
}: {
  label: string;
  used: number;
  limit: number;
  unit?: string;
}) {
  const isUnlimited = limit === -1;
  const pct = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
  const color = pct < 70 ? 'bg-green-500' : pct < 90 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">
          {used}
          {unit ? ` ${unit}` : ''} / {isUnlimited ? 'Unlimited' : `${limit}${unit ? ` ${unit}` : ''}`}
        </span>
      </div>
      {!isUnlimited && (
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

function formatLimitValue(key: string, value: number | boolean): string {
  if (typeof value === 'boolean') return '';
  if (value === -1) return 'Unlimited';
  if (key === 'maxStorageMb') {
    return value >= 1024 ? `${(value / 1024).toFixed(0)} GB` : `${value} MB`;
  }
  return value.toLocaleString();
}

export function BillingPage() {
  const [searchParams] = useSearchParams();
  const [subData, setSubData] = useState<SubscriptionData | null>(null);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showSuccess = searchParams.get('success') === 'true';
  const showCanceled = searchParams.get('canceled') === 'true';

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (showSuccess) {
      setToast({ type: 'success', message: 'Subscription updated successfully!' });
      setTimeout(() => setToast(null), 5000);
    } else if (showCanceled) {
      setToast({ type: 'error', message: 'Checkout was canceled.' });
      setTimeout(() => setToast(null), 5000);
    }
  }, [showSuccess, showCanceled]);

  async function loadData() {
    setLoading(true);
    try {
      const [sub, usage] = await Promise.all([
        api.get<{ success: boolean; data: SubscriptionData }>('/billing/subscription'),
        api.get<{ success: boolean; data: UsageData }>('/billing/usage'),
      ]);
      setSubData(sub.data);
      setUsageData(usage.data);
    } catch (err) {
      console.error('Failed to load billing data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade(plan: string) {
    setActionLoading(plan);
    try {
      const result = await api.post<{ success: boolean; data: { url: string } }>('/billing/checkout', {
        plan,
        interval: billingInterval,
      });
      if (result.data.url) {
        window.location.href = result.data.url;
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to start checkout' });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleManageBilling() {
    setActionLoading('portal');
    try {
      const result = await api.post<{ success: boolean; data: { url: string } }>('/billing/portal', {});
      if (result.data.url) {
        window.location.href = result.data.url;
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to open billing portal' });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const currentPlan = subData?.plan || 'free';
  const currentPlanIndex = PLAN_ORDER.indexOf(currentPlan as PlanName);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Toast notification */}
      {toast && (
        <div
          className={cn(
            'fixed right-6 top-20 z-50 flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg',
            toast.type === 'success' ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
          )}
        >
          {toast.type === 'success' ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Billing & Subscription</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your plan, view usage, and update payment details.
        </p>
      </div>

      {/* Current plan card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-foreground">
                  {PLANS[currentPlan as PlanName]?.displayName || 'Free'} Plan
                </h2>
                {subData?.subscription && (
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-xs font-medium',
                      STATUS_COLORS[subData.subscription.status] || STATUS_COLORS.incomplete
                    )}
                  >
                    {subData.subscription.status}
                  </span>
                )}
              </div>
              {subData?.subscription?.currentPeriodEnd && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {subData.subscription.cancelAtPeriodEnd
                    ? `Cancels on ${new Date(subData.subscription.currentPeriodEnd).toLocaleDateString()}`
                    : `Renews on ${new Date(subData.subscription.currentPeriodEnd).toLocaleDateString()}`}
                  {' '}&middot;{' '}
                  {subData.subscription.billingInterval === 'yearly' ? 'Billed yearly' : 'Billed monthly'}
                </p>
              )}
              {!subData?.subscription && currentPlan === 'free' && (
                <p className="mt-1 text-sm text-muted-foreground">
                  You are on the free plan. Upgrade to unlock more features.
                </p>
              )}
            </div>
          </div>
          {subData?.subscription && currentPlan !== 'free' && (
            <button
              onClick={handleManageBilling}
              disabled={actionLoading === 'portal'}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              <ExternalLink className="h-4 w-4" />
              Manage Billing
            </button>
          )}
        </div>
      </div>

      {/* Usage meters */}
      {usageData && (
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Current Usage
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <UsageMeter
              label="Sites"
              used={usageData.sites.used}
              limit={usageData.sites.limit}
            />
            <UsageMeter
              label="Pages (max per site)"
              used={usageData.pagesPerSite.used}
              limit={usageData.pagesPerSite.limit}
            />
            <UsageMeter
              label="Storage"
              used={usageData.storage.usedMb}
              limit={usageData.storage.limitMb}
              unit="MB"
            />
            <UsageMeter
              label="Media Files"
              used={usageData.mediaFiles.used}
              limit={usageData.mediaFiles.limit}
            />
          </div>
        </div>
      )}

      {/* Plan comparison */}
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Plans
          </h3>
          <div className="flex items-center gap-2 rounded-lg border border-border p-1">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                billingInterval === 'monthly'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                billingInterval === 'yearly'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Yearly
              <span className="ml-1 text-xs text-green-400">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {PLAN_ORDER.map((planName, idx) => {
            const plan = PLANS[planName];
            const isCurrent = planName === currentPlan;
            const isUpgrade = idx > currentPlanIndex;
            const isDowngrade = idx < currentPlanIndex;
            const price =
              billingInterval === 'yearly'
                ? plan.yearlyPrice / 12
                : plan.monthlyPrice;

            return (
              <div
                key={planName}
                className={cn(
                  'relative flex flex-col rounded-xl border p-6 transition-shadow',
                  isCurrent
                    ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                    : 'border-border bg-card hover:shadow-md'
                )}
              >
                {planName === 'pro' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                    Popular
                  </div>
                )}

                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-foreground">{plan.displayName}</h4>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">
                      {price === 0 ? 'Free' : formatPrice(price)}
                    </span>
                    {price > 0 && (
                      <span className="text-sm text-muted-foreground">/mo</span>
                    )}
                  </div>
                  {billingInterval === 'yearly' && plan.yearlyPrice > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatPrice(plan.yearlyPrice)} billed yearly
                    </p>
                  )}
                </div>

                {/* Feature list */}
                <ul className="mb-6 flex-1 space-y-2.5">
                  {FEATURE_LIST.map(({ key, label }) => {
                    const value = plan.limits[key as keyof typeof plan.limits];
                    const isBoolean = typeof value === 'boolean';
                    const isEnabled = isBoolean ? value : true;

                    return (
                      <li key={key} className="flex items-center gap-2 text-sm">
                        {isEnabled ? (
                          <Check className="h-4 w-4 shrink-0 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                        )}
                        <span className={cn(isEnabled ? 'text-foreground' : 'text-muted-foreground/60')}>
                          {isBoolean ? label : `${formatLimitValue(key, value as number)} ${label.toLowerCase()}`}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {/* Action button */}
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full rounded-lg border border-primary bg-primary/10 py-2.5 text-sm font-medium text-primary"
                  >
                    Current Plan
                  </button>
                ) : isUpgrade ? (
                  <button
                    onClick={() => handleUpgrade(planName)}
                    disabled={actionLoading === planName}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {actionLoading === planName ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        Upgrade
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleManageBilling}
                    disabled={actionLoading === 'portal'}
                    className="w-full rounded-lg border border-border py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    Downgrade
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Enterprise callout */}
        <div className="mt-6 flex items-center justify-between rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Enterprise</h4>
              <p className="text-sm text-muted-foreground">
                Unlimited everything. Custom pricing, SLA, and dedicated support.
              </p>
            </div>
          </div>
          <a
            href="mailto:sales@netrunsystems.com?subject=Sigil%20CMS%20Enterprise%20Inquiry"
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Contact Sales
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
