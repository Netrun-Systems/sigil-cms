import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Billing Page
 *
 * Subscription management, usage meters, plan comparison,
 * and Stripe portal access for tenant admins.
 */
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CreditCard, Check, X, ArrowUpRight, AlertCircle, Zap, TrendingUp, ExternalLink, } from 'lucide-react';
import { cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';
import { PLANS, formatPrice } from '@netrun-cms/core';
const STATUS_COLORS = {
    active: 'bg-green-500/20 text-green-400',
    trialing: 'bg-blue-500/20 text-blue-400',
    past_due: 'bg-yellow-500/20 text-yellow-400',
    canceled: 'bg-red-500/20 text-red-400',
    incomplete: 'bg-gray-500/20 text-gray-400',
};
const PLAN_ORDER = ['free', 'starter', 'pro', 'business'];
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
];
function UsageMeter({ label, used, limit, unit, }) {
    const isUnlimited = limit === -1;
    const pct = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
    const color = pct < 70 ? 'bg-green-500' : pct < 90 ? 'bg-yellow-500' : 'bg-red-500';
    return (_jsxs("div", { className: "rounded-lg border border-border bg-card p-4", children: [_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: label }), _jsxs("span", { className: "font-medium text-foreground", children: [used, unit ? ` ${unit}` : '', " / ", isUnlimited ? 'Unlimited' : `${limit}${unit ? ` ${unit}` : ''}`] })] }), !isUnlimited && (_jsx("div", { className: "mt-2 h-2 w-full overflow-hidden rounded-full bg-muted", children: _jsx("div", { className: cn('h-full rounded-full transition-all', color), style: { width: `${pct}%` } }) }))] }));
}
function formatLimitValue(key, value) {
    if (typeof value === 'boolean')
        return '';
    if (value === -1)
        return 'Unlimited';
    if (key === 'maxStorageMb') {
        return value >= 1024 ? `${(value / 1024).toFixed(0)} GB` : `${value} MB`;
    }
    return value.toLocaleString();
}
export function BillingPage() {
    const [searchParams] = useSearchParams();
    const [subData, setSubData] = useState(null);
    const [usageData, setUsageData] = useState(null);
    const [billingInterval, setBillingInterval] = useState('monthly');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [toast, setToast] = useState(null);
    const showSuccess = searchParams.get('success') === 'true';
    const showCanceled = searchParams.get('canceled') === 'true';
    useEffect(() => {
        loadData();
    }, []);
    useEffect(() => {
        if (showSuccess) {
            setToast({ type: 'success', message: 'Subscription updated successfully!' });
            setTimeout(() => setToast(null), 5000);
        }
        else if (showCanceled) {
            setToast({ type: 'error', message: 'Checkout was canceled.' });
            setTimeout(() => setToast(null), 5000);
        }
    }, [showSuccess, showCanceled]);
    async function loadData() {
        setLoading(true);
        try {
            const [sub, usage] = await Promise.all([
                api.get('/billing/subscription'),
                api.get('/billing/usage'),
            ]);
            setSubData(sub.data);
            setUsageData(usage.data);
        }
        catch (err) {
            console.error('Failed to load billing data:', err);
        }
        finally {
            setLoading(false);
        }
    }
    async function handleUpgrade(plan) {
        setActionLoading(plan);
        try {
            const result = await api.post('/billing/checkout', {
                plan,
                interval: billingInterval,
            });
            if (result.data.url) {
                window.location.href = result.data.url;
            }
        }
        catch (err) {
            setToast({ type: 'error', message: err.message || 'Failed to start checkout' });
            setTimeout(() => setToast(null), 5000);
        }
        finally {
            setActionLoading(null);
        }
    }
    async function handleManageBilling() {
        setActionLoading('portal');
        try {
            const result = await api.post('/billing/portal', {});
            if (result.data.url) {
                window.location.href = result.data.url;
            }
        }
        catch (err) {
            setToast({ type: 'error', message: err.message || 'Failed to open billing portal' });
            setTimeout(() => setToast(null), 5000);
        }
        finally {
            setActionLoading(null);
        }
    }
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-[400px]", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" }) }));
    }
    const currentPlan = subData?.plan || 'free';
    const currentPlanIndex = PLAN_ORDER.indexOf(currentPlan);
    return (_jsxs("div", { className: "mx-auto max-w-6xl space-y-8", children: [toast && (_jsxs("div", { className: cn('fixed right-6 top-20 z-50 flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg', toast.type === 'success' ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'), children: [toast.type === 'success' ? _jsx(Check, { className: "h-5 w-5" }) : _jsx(AlertCircle, { className: "h-5 w-5" }), _jsx("span", { className: "text-sm font-medium", children: toast.message })] })), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-foreground", children: "Billing & Subscription" }), _jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Manage your plan, view usage, and update payment details." })] }), _jsx("div", { className: "rounded-xl border border-border bg-card p-6", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10", children: _jsx(CreditCard, { className: "h-6 w-6 text-primary" }) }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("h2", { className: "text-lg font-semibold text-foreground", children: [PLANS[currentPlan]?.displayName || 'Free', " Plan"] }), subData?.subscription && (_jsx("span", { className: cn('rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_COLORS[subData.subscription.status] || STATUS_COLORS.incomplete), children: subData.subscription.status }))] }), subData?.subscription?.currentPeriodEnd && (_jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: [subData.subscription.cancelAtPeriodEnd
                                                    ? `Cancels on ${new Date(subData.subscription.currentPeriodEnd).toLocaleDateString()}`
                                                    : `Renews on ${new Date(subData.subscription.currentPeriodEnd).toLocaleDateString()}`, ' ', "\u00B7", ' ', subData.subscription.billingInterval === 'yearly' ? 'Billed yearly' : 'Billed monthly'] })), !subData?.subscription && currentPlan === 'free' && (_jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "You are on the free plan. Upgrade to unlock more features." }))] })] }), subData?.subscription && currentPlan !== 'free' && (_jsxs("button", { onClick: handleManageBilling, disabled: actionLoading === 'portal', className: "flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50", children: [_jsx(ExternalLink, { className: "h-4 w-4" }), "Manage Billing"] }))] }) }), usageData && (_jsxs("div", { children: [_jsx("h3", { className: "mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground", children: "Current Usage" }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [_jsx(UsageMeter, { label: "Sites", used: usageData.sites.used, limit: usageData.sites.limit }), _jsx(UsageMeter, { label: "Pages (max per site)", used: usageData.pagesPerSite.used, limit: usageData.pagesPerSite.limit }), _jsx(UsageMeter, { label: "Storage", used: usageData.storage.usedMb, limit: usageData.storage.limitMb, unit: "MB" }), _jsx(UsageMeter, { label: "Media Files", used: usageData.mediaFiles.used, limit: usageData.mediaFiles.limit })] })] })), _jsxs("div", { children: [_jsxs("div", { className: "mb-6 flex items-center justify-between", children: [_jsx("h3", { className: "text-sm font-semibold uppercase tracking-wider text-muted-foreground", children: "Plans" }), _jsxs("div", { className: "flex items-center gap-2 rounded-lg border border-border p-1", children: [_jsx("button", { onClick: () => setBillingInterval('monthly'), className: cn('rounded-md px-3 py-1.5 text-sm font-medium transition-colors', billingInterval === 'monthly'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:text-foreground'), children: "Monthly" }), _jsxs("button", { onClick: () => setBillingInterval('yearly'), className: cn('rounded-md px-3 py-1.5 text-sm font-medium transition-colors', billingInterval === 'yearly'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:text-foreground'), children: ["Yearly", _jsx("span", { className: "ml-1 text-xs text-green-400", children: "Save 20%" })] })] })] }), _jsx("div", { className: "grid gap-6 lg:grid-cols-4", children: PLAN_ORDER.map((planName, idx) => {
                            const plan = PLANS[planName];
                            const isCurrent = planName === currentPlan;
                            const isUpgrade = idx > currentPlanIndex;
                            const isDowngrade = idx < currentPlanIndex;
                            const price = billingInterval === 'yearly'
                                ? plan.yearlyPrice / 12
                                : plan.monthlyPrice;
                            return (_jsxs("div", { className: cn('relative flex flex-col rounded-xl border p-6 transition-shadow', isCurrent
                                    ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                                    : 'border-border bg-card hover:shadow-md'), children: [planName === 'pro' && (_jsx("div", { className: "absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground", children: "Popular" })), _jsxs("div", { className: "mb-4", children: [_jsx("h4", { className: "text-lg font-semibold text-foreground", children: plan.displayName }), _jsxs("div", { className: "mt-2 flex items-baseline gap-1", children: [_jsx("span", { className: "text-3xl font-bold text-foreground", children: price === 0 ? 'Free' : formatPrice(price) }), price > 0 && (_jsx("span", { className: "text-sm text-muted-foreground", children: "/mo" }))] }), billingInterval === 'yearly' && plan.yearlyPrice > 0 && (_jsxs("p", { className: "mt-1 text-xs text-muted-foreground", children: [formatPrice(plan.yearlyPrice), " billed yearly"] }))] }), _jsx("ul", { className: "mb-6 flex-1 space-y-2.5", children: FEATURE_LIST.map(({ key, label }) => {
                                            const value = plan.limits[key];
                                            const isBoolean = typeof value === 'boolean';
                                            const isEnabled = isBoolean ? value : true;
                                            return (_jsxs("li", { className: "flex items-center gap-2 text-sm", children: [isEnabled ? (_jsx(Check, { className: "h-4 w-4 shrink-0 text-green-500" })) : (_jsx(X, { className: "h-4 w-4 shrink-0 text-muted-foreground/40" })), _jsx("span", { className: cn(isEnabled ? 'text-foreground' : 'text-muted-foreground/60'), children: isBoolean ? label : `${formatLimitValue(key, value)} ${label.toLowerCase()}` })] }, key));
                                        }) }), isCurrent ? (_jsx("button", { disabled: true, className: "w-full rounded-lg border border-primary bg-primary/10 py-2.5 text-sm font-medium text-primary", children: "Current Plan" })) : isUpgrade ? (_jsx("button", { onClick: () => handleUpgrade(planName), disabled: actionLoading === planName, className: "flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50", children: actionLoading === planName ? (_jsx("div", { className: "h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" })) : (_jsxs(_Fragment, { children: [_jsx(Zap, { className: "h-4 w-4" }), "Upgrade"] })) })) : (_jsx("button", { onClick: handleManageBilling, disabled: actionLoading === 'portal', className: "w-full rounded-lg border border-border py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50", children: "Downgrade" }))] }, planName));
                        }) }), _jsxs("div", { className: "mt-6 flex items-center justify-between rounded-xl border border-border bg-card p-6", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10", children: _jsx(TrendingUp, { className: "h-5 w-5 text-primary" }) }), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-foreground", children: "Enterprise" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Unlimited everything. Custom pricing, SLA, and dedicated support." })] })] }), _jsxs("a", { href: "mailto:sales@netrunsystems.com?subject=Sigil%20CMS%20Enterprise%20Inquiry", className: "flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted", children: ["Contact Sales", _jsx(ArrowUpRight, { className: "h-4 w-4" })] })] })] })] }));
}
//# sourceMappingURL=BillingPage.js.map