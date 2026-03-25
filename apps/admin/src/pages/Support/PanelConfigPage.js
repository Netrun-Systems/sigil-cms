import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Save, MessageSquare, Search, Mail, Bot, Megaphone } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';
const defaultConfig = {
    docs_search_enabled: true,
    contact_form_enabled: true,
    ai_chat_enabled: false,
    announcements_enabled: true,
    primary_color: '#90b9ab',
    accent_color: '#6b8f83',
    panel_title: 'Help & Support',
    greeting_message: 'How can we help you today?',
    position: 'bottom-right',
};
export function PanelConfigPage() {
    const { siteId } = useParams();
    const [config, setConfig] = useState(defaultConfig);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const load = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/sites/${siteId}/support/config`);
            if (res.data)
                setConfig(res.data);
        }
        catch { /* */ }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, [siteId]);
    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/sites/${siteId}/support/config`, config);
        }
        catch { /* */ }
        finally {
            setSaving(false);
        }
    };
    const updateField = (key, value) => {
        setConfig((prev) => ({ ...prev, [key]: value }));
    };
    if (loading) {
        return (_jsx("div", { className: "flex h-32 items-center justify-center", children: _jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }) }));
    }
    const featureToggles = [
        { key: 'docs_search_enabled', label: 'Docs Search', icon: _jsx(Search, { className: "h-4 w-4" }), description: 'Allow users to search documentation' },
        { key: 'contact_form_enabled', label: 'Contact Form', icon: _jsx(Mail, { className: "h-4 w-4" }), description: 'Show a contact/support form' },
        { key: 'ai_chat_enabled', label: 'AI Chat', icon: _jsx(Bot, { className: "h-4 w-4" }), description: 'Enable AI-powered chat assistant' },
        { key: 'announcements_enabled', label: 'Announcements', icon: _jsx(Megaphone, { className: "h-4 w-4" }), description: 'Display active announcements' },
    ];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Panel Settings" }), _jsxs("button", { onClick: handleSave, disabled: saving, className: "flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50", children: [saving ? _jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : _jsx(Save, { className: "h-4 w-4" }), "Save"] })] }), _jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [_jsx(Card, { children: _jsxs(CardContent, { className: "pt-4 space-y-4", children: [_jsx("h2", { className: "text-lg font-medium", children: "Features" }), featureToggles.map((ft) => (_jsxs("label", { className: "flex items-center justify-between cursor-pointer group", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-muted-foreground", children: ft.icon }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", children: ft.label }), _jsx("p", { className: "text-xs text-muted-foreground", children: ft.description })] })] }), _jsx("button", { type: "button", role: "switch", "aria-checked": config[ft.key], onClick: () => updateField(ft.key, !config[ft.key]), className: cn('relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors', config[ft.key] ? 'bg-primary' : 'bg-gray-600'), children: _jsx("span", { className: cn('pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform', config[ft.key] ? 'translate-x-5' : 'translate-x-0') }) })] }, ft.key)))] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "pt-4 space-y-4", children: [_jsx("h2", { className: "text-lg font-medium", children: "Appearance" }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Primary Color" }), _jsxs("div", { className: "mt-1 flex items-center gap-2", children: [_jsx("input", { type: "color", value: config.primary_color, onChange: (e) => updateField('primary_color', e.target.value), className: "h-9 w-12 cursor-pointer rounded-md border border-input bg-background p-0.5" }), _jsx("input", { value: config.primary_color, onChange: (e) => updateField('primary_color', e.target.value), className: "flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Accent Color" }), _jsxs("div", { className: "mt-1 flex items-center gap-2", children: [_jsx("input", { type: "color", value: config.accent_color, onChange: (e) => updateField('accent_color', e.target.value), className: "h-9 w-12 cursor-pointer rounded-md border border-input bg-background p-0.5" }), _jsx("input", { value: config.accent_color, onChange: (e) => updateField('accent_color', e.target.value), className: "flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Panel Title" }), _jsx("input", { value: config.panel_title, onChange: (e) => updateField('panel_title', e.target.value), className: "mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", placeholder: "Help & Support" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Greeting Message" }), _jsx("input", { value: config.greeting_message, onChange: (e) => updateField('greeting_message', e.target.value), className: "mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", placeholder: "How can we help you today?" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Position" }), _jsxs("select", { value: config.position, onChange: (e) => updateField('position', e.target.value), className: "mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", children: [_jsx("option", { value: "bottom-right", children: "Bottom Right" }), _jsx("option", { value: "bottom-left", children: "Bottom Left" })] })] })] }) })] }), _jsx(Card, { children: _jsxs(CardContent, { className: "pt-4 space-y-4", children: [_jsx("h2", { className: "text-lg font-medium", children: "Preview" }), _jsx("div", { className: "relative rounded-lg border border-border bg-muted/30 p-8 min-h-[200px]", children: _jsxs("div", { className: cn('absolute bottom-4 w-72 rounded-lg border shadow-lg overflow-hidden', config.position === 'bottom-right' ? 'right-4' : 'left-4'), style: { borderColor: config.primary_color + '40' }, children: [_jsx("div", { className: "px-4 py-3 text-white text-sm font-medium", style: { backgroundColor: config.primary_color }, children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(MessageSquare, { className: "h-4 w-4" }), config.panel_title] }) }), _jsxs("div", { className: "bg-background p-4 space-y-3", children: [_jsx("p", { className: "text-sm text-muted-foreground", children: config.greeting_message }), _jsxs("div", { className: "space-y-2", children: [config.docs_search_enabled && (_jsxs("div", { className: "flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground", children: [_jsx(Search, { className: "h-3 w-3" }), " Search docs..."] })), config.announcements_enabled && (_jsxs("div", { className: "flex items-center gap-2 rounded-md px-3 py-2 text-xs", style: { backgroundColor: config.accent_color + '15', color: config.accent_color }, children: [_jsx(Megaphone, { className: "h-3 w-3" }), " 1 active announcement"] })), config.contact_form_enabled && (_jsxs("div", { className: "flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground", children: [_jsx(Mail, { className: "h-3 w-3" }), " Contact us"] })), config.ai_chat_enabled && (_jsxs("div", { className: "flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground", children: [_jsx(Bot, { className: "h-3 w-3" }), " Chat with AI"] }))] })] })] }) })] }) })] }));
}
//# sourceMappingURL=PanelConfigPage.js.map