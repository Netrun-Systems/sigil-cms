import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Domain Manager
 *
 * UI for configuring and verifying custom domains on a Sigil CMS site.
 */
import { useState } from 'react';
import { Globe, CheckCircle2, XCircle, Loader2, Trash2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Separator, cn, } from '@netrun-cms/ui';
import { api } from '../lib/api';
export function DomainManager({ siteId, currentDomain, onDomainChange }) {
    const [domain, setDomain] = useState(currentDomain || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const [error, setError] = useState(null);
    const [verification, setVerification] = useState(null);
    const handleSave = async () => {
        if (!domain.trim())
            return;
        setIsSaving(true);
        setError(null);
        setVerification(null);
        try {
            await api.put(`/sites/${siteId}/domain`, { domain: domain.trim().toLowerCase() });
            onDomainChange(domain.trim().toLowerCase());
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save domain');
        }
        finally {
            setIsSaving(false);
        }
    };
    const handleVerify = async () => {
        setIsVerifying(true);
        setError(null);
        try {
            const res = await api.get(`/sites/${siteId}/domain/verify`);
            setVerification(res.data);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to verify domain');
        }
        finally {
            setIsVerifying(false);
        }
    };
    const handleRemove = async () => {
        if (!confirm('Remove the custom domain from this site?'))
            return;
        setIsRemoving(true);
        setError(null);
        setVerification(null);
        try {
            await api.delete(`/sites/${siteId}/domain`);
            setDomain('');
            onDomainChange('');
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to remove domain');
        }
        finally {
            setIsRemoving(false);
        }
    };
    return (_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Globe, { className: "h-5 w-5" }), "Custom Domain"] }), _jsx(CardDescription, { children: "Connect your own domain to this site" })] }), _jsxs(CardContent, { className: "space-y-4", children: [error && (_jsx("div", { className: "rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive", children: error })), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "custom-domain", children: "Domain" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { id: "custom-domain", value: domain, onChange: (e) => setDomain(e.target.value), placeholder: "example.com", className: "flex-1" }), _jsxs(Button, { onClick: handleSave, disabled: isSaving || !domain.trim(), children: [isSaving ? _jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : null, "Save"] })] }), currentDomain ? (_jsxs("p", { className: "text-sm text-muted-foreground", children: ["Current domain: ", _jsx("span", { className: "font-medium", children: currentDomain })] })) : (_jsx("p", { className: "text-sm text-muted-foreground", children: "No custom domain configured" }))] }), currentDomain && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { variant: "outline", onClick: handleVerify, disabled: isVerifying, children: [isVerifying ? (_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" })) : (_jsx(Globe, { className: "mr-2 h-4 w-4" })), "Verify DNS"] }), _jsx(Button, { variant: "outline", size: "icon", asChild: true, children: _jsx("a", { href: `https://${currentDomain}`, target: "_blank", rel: "noopener noreferrer", title: "Open site", children: _jsx(ExternalLink, { className: "h-4 w-4" }) }) }), _jsxs(Button, { variant: "destructive", size: "sm", onClick: handleRemove, disabled: isRemoving, children: [isRemoving ? (_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" })) : (_jsx(Trash2, { className: "mr-2 h-4 w-4" })), "Remove"] })] }), verification && (_jsxs("div", { className: cn('rounded-lg border p-4 space-y-2', verification.verified
                                    ? 'border-green-500/50 bg-green-500/10'
                                    : 'border-yellow-500/50 bg-yellow-500/10'), children: [_jsx("div", { className: "flex items-center gap-2", children: verification.verified ? (_jsxs(_Fragment, { children: [_jsx(CheckCircle2, { className: "h-5 w-5 text-green-600" }), _jsx("span", { className: "font-medium text-green-700", children: "DNS verified" })] })) : (_jsxs(_Fragment, { children: [_jsx(XCircle, { className: "h-5 w-5 text-yellow-600" }), _jsx("span", { className: "font-medium text-yellow-700", children: "DNS not yet pointing to Sigil" })] })) }), verification.records.length > 0 && (_jsxs("div", { className: "text-sm text-muted-foreground", children: [_jsx("p", { className: "font-medium", children: "Current records:" }), _jsx("ul", { className: "list-disc list-inside", children: verification.records.map((r, i) => (_jsx("li", { children: r }, i))) })] })), !verification.verified && (_jsxs("p", { className: "text-sm text-muted-foreground", children: ["Expected target: ", _jsx("code", { className: "rounded bg-muted px-1 py-0.5", children: verification.expected })] }))] }))] })), _jsx(Separator, {}), _jsxs("div", { className: "rounded-lg border bg-muted/50 p-4 space-y-2", children: [_jsx("p", { className: "text-sm font-medium", children: "Point your domain to Sigil:" }), _jsxs("ol", { className: "list-decimal list-inside space-y-1 text-sm text-muted-foreground", children: [_jsxs("li", { children: ["Add a CNAME record: ", _jsx("code", { className: "rounded bg-muted px-1 py-0.5", children: "your-domain.com" }), ' ', "\u2192 ", _jsx("code", { className: "rounded bg-muted px-1 py-0.5", children: "sigil.netrunsystems.com" })] }), _jsx("li", { children: "Wait for DNS propagation (up to 48 hours)" }), _jsx("li", { children: "Click \"Verify DNS\" to confirm" })] })] })] })] }));
}
//# sourceMappingURL=DomainManager.js.map