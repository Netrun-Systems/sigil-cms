import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * AI Design Panel — Stitch-powered design generation for the Design Playground.
 *
 * Provides a text prompt input, device selector, preview area, edit/variant
 * generation, and import-to-page flow. Rendered as a collapsible panel
 * inside the Theme Editor.
 */
import { useState, useCallback } from 'react';
import { Wand2, Monitor, Tablet, Smartphone, Loader2, Copy, Download, RefreshCw, ChevronDown, ChevronUp, Sparkles, } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, cn, } from '@netrun-cms/ui';
import { designAi, } from '../lib/design-ai';
// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function AIDesignPanel({ siteId, onImport }) {
    const [isOpen, setIsOpen] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [editPrompt, setEditPrompt] = useState('');
    const [deviceType, setDeviceType] = useState('DESKTOP');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoadingVariants, setIsLoadingVariants] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [currentScreen, setCurrentScreen] = useState(null);
    const [variants, setVariants] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [error, setError] = useState(null);
    const [isMock, setIsMock] = useState(false);
    // ── Generate ────────────────────────────────────────────────────────
    const handleGenerate = useCallback(async () => {
        if (!prompt.trim())
            return;
        setIsGenerating(true);
        setError(null);
        setVariants([]);
        try {
            const res = await designAi.generate(siteId, prompt.trim(), deviceType);
            const data = res.data;
            setCurrentScreen({
                screenId: data.screenId,
                previewUrl: data.previewUrl,
                code: data.code,
            });
            setSuggestions(data.suggestions ?? []);
            setIsMock(data.mock);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Generation failed');
        }
        finally {
            setIsGenerating(false);
        }
    }, [siteId, prompt, deviceType]);
    // ── Edit ────────────────────────────────────────────────────────────
    const handleEdit = useCallback(async () => {
        if (!editPrompt.trim() || !currentScreen)
            return;
        setIsEditing(true);
        setError(null);
        try {
            const res = await designAi.edit(siteId, currentScreen.screenId, editPrompt.trim());
            const data = res.data;
            setCurrentScreen({
                screenId: data.screenId,
                previewUrl: data.previewUrl,
                code: data.code,
            });
            setEditPrompt('');
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Edit failed');
        }
        finally {
            setIsEditing(false);
        }
    }, [siteId, currentScreen, editPrompt]);
    // ── Variants ────────────────────────────────────────────────────────
    const handleVariants = useCallback(async () => {
        if (!currentScreen)
            return;
        setIsLoadingVariants(true);
        setError(null);
        try {
            const res = await designAi.variants(siteId, currentScreen.screenId, 3);
            setVariants(res.data.variants);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Variant generation failed');
        }
        finally {
            setIsLoadingVariants(false);
        }
    }, [siteId, currentScreen]);
    // ── Import ──────────────────────────────────────────────────────────
    const handleImport = useCallback(async (screen) => {
        setIsImporting(true);
        setError(null);
        try {
            // Import returns blocks — we pass a placeholder pageId;
            // the actual page association is handled by the parent.
            const res = await designAi.importToPage(siteId, screen.screenId, 'current');
            onImport?.(res.data.blocks);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Import failed');
        }
        finally {
            setIsImporting(false);
        }
    }, [siteId, onImport]);
    // ── Select a variant ────────────────────────────────────────────────
    const handleSelectVariant = (screen) => {
        setCurrentScreen(screen);
        setVariants([]);
    };
    // ── Copy HTML to clipboard ──────────────────────────────────────────
    const handleCopyCode = () => {
        if (currentScreen?.code) {
            navigator.clipboard.writeText(currentScreen.code);
        }
    };
    // ── Render ──────────────────────────────────────────────────────────
    const deviceButtons = [
        { type: 'DESKTOP', icon: Monitor, label: 'Desktop' },
        { type: 'TABLET', icon: Tablet, label: 'Tablet' },
        { type: 'MOBILE', icon: Smartphone, label: 'Mobile' },
    ];
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "cursor-pointer select-none", onClick: () => setIsOpen(!isOpen), children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Sparkles, { className: "h-5 w-5 text-purple-500" }), _jsxs("div", { children: [_jsx(CardTitle, { className: "text-base", children: "AI Design Generator" }), _jsx(CardDescription, { children: "Describe a page and get a designed, editable result" })] })] }), isOpen ? _jsx(ChevronUp, { className: "h-4 w-4" }) : _jsx(ChevronDown, { className: "h-4 w-4" })] }) }), isOpen && (_jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Describe what you want" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { placeholder: "A modern SaaS landing page with dark theme and gradient hero...", value: prompt, onChange: (e) => setPrompt(e.target.value), onKeyDown: (e) => e.key === 'Enter' && handleGenerate(), className: "flex-1" }), _jsxs(Button, { onClick: handleGenerate, disabled: isGenerating || !prompt.trim(), children: [isGenerating ? (_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" })) : (_jsx(Wand2, { className: "mr-2 h-4 w-4" })), "Generate"] })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Label, { className: "text-sm text-muted-foreground", children: "Device:" }), _jsx("div", { className: "flex gap-1 rounded-lg border p-1", children: deviceButtons.map(({ type, icon: Icon, label }) => (_jsx(Button, { variant: deviceType === type ? 'secondary' : 'ghost', size: "sm", onClick: () => setDeviceType(type), title: label, children: _jsx(Icon, { className: "h-4 w-4" }) }, type))) })] }), isMock && currentScreen && (_jsx("div", { className: "rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200", children: "Running in preview mode (STITCH_API_KEY not configured). Showing sample output." })), error && (_jsx("div", { className: "rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive", children: error })), currentScreen && (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Label, { className: "text-sm font-medium", children: "Preview" }), _jsxs("div", { className: "flex gap-1", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: handleCopyCode, title: "Copy HTML", children: [_jsx(Copy, { className: "mr-1.5 h-3.5 w-3.5" }), "Copy"] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: handleVariants, disabled: isLoadingVariants, title: "Generate variants", children: [isLoadingVariants ? (_jsx(Loader2, { className: "mr-1.5 h-3.5 w-3.5 animate-spin" })) : (_jsx(RefreshCw, { className: "mr-1.5 h-3.5 w-3.5" })), "Variants"] }), _jsxs(Button, { size: "sm", onClick: () => handleImport(currentScreen), disabled: isImporting, children: [isImporting ? (_jsx(Loader2, { className: "mr-1.5 h-3.5 w-3.5 animate-spin" })) : (_jsx(Download, { className: "mr-1.5 h-3.5 w-3.5" })), "Import to Page"] })] })] }), _jsx("div", { className: cn('overflow-hidden rounded-lg border bg-white', deviceType === 'MOBILE' && 'mx-auto max-w-[375px]', deviceType === 'TABLET' && 'mx-auto max-w-[768px]'), children: currentScreen.previewUrl ? (_jsx("img", { src: currentScreen.previewUrl, alt: "Design preview", className: "w-full" })) : currentScreen.code ? (_jsx("iframe", { srcDoc: currentScreen.code, title: "Design preview", className: "h-[500px] w-full border-0", sandbox: "allow-scripts" })) : (_jsx("div", { className: "flex h-48 items-center justify-center text-muted-foreground", children: "No preview available" })) }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { placeholder: "Refine: Make the hero bigger, change colors...", value: editPrompt, onChange: (e) => setEditPrompt(e.target.value), onKeyDown: (e) => e.key === 'Enter' && handleEdit(), className: "flex-1" }), _jsxs(Button, { variant: "outline", onClick: handleEdit, disabled: isEditing || !editPrompt.trim(), children: [isEditing ? (_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" })) : (_jsx(Wand2, { className: "mr-2 h-4 w-4" })), "Edit"] })] })] })), variants.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { className: "text-sm font-medium", children: "Variants" }), _jsx("div", { className: "grid gap-3 sm:grid-cols-3", children: variants.map((variant, i) => (_jsxs("div", { className: "cursor-pointer overflow-hidden rounded-lg border transition-shadow hover:shadow-md", onClick: () => handleSelectVariant(variant), children: [variant.previewUrl ? (_jsx("img", { src: variant.previewUrl, alt: `Variant ${i + 1}`, className: "w-full" })) : variant.code ? (_jsx("iframe", { srcDoc: variant.code, title: `Variant ${i + 1}`, className: "pointer-events-none h-32 w-full border-0", sandbox: "" })) : (_jsxs("div", { className: "flex h-32 items-center justify-center text-xs text-muted-foreground", children: ["Variant ", i + 1] })), _jsxs("div", { className: "border-t px-2 py-1 text-center text-xs text-muted-foreground", children: ["Variant ", i + 1] })] }, variant.screenId))) })] })), suggestions.length > 0 && !currentScreen && (_jsx("div", { className: "flex flex-wrap gap-2", children: suggestions.map((s, i) => (_jsx("button", { className: "rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground", onClick: () => {
                                setPrompt(s);
                            }, children: s }, i))) }))] }))] }));
}
//# sourceMappingURL=AIDesignPanel.js.map