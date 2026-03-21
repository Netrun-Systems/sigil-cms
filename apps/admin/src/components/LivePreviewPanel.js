import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback, useEffect, useRef } from 'react';
import { Monitor, Tablet, Smartphone, RefreshCw, ExternalLink, Eye, Columns2, } from 'lucide-react';
import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, Separator, Badge, cn, } from '@netrun-cms/ui';
const VIEWPORT_WIDTHS = {
    desktop: 1280,
    tablet: 768,
    mobile: 375,
};
const VIEWPORT_ICONS = {
    desktop: Monitor,
    tablet: Tablet,
    mobile: Smartphone,
};
/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export function LivePreviewPanel({ iframeRef, previewUrl, viewport, onViewportChange, isConnected = false, }) {
    const [iframeKey, setIframeKey] = useState(0);
    const containerRef = useRef(null);
    const handleRefresh = useCallback(() => {
        setIframeKey((k) => k + 1);
    }, []);
    const handleOpenExternal = useCallback(() => {
        if (previewUrl)
            window.open(previewUrl, '_blank');
    }, [previewUrl]);
    /* Scale the iframe to fit within the container while preserving the
       viewport width.  For desktop (1280px) in a 640px-wide panel we
       scale to 0.5, etc.  */
    const [scale, setScale] = useState(1);
    useEffect(() => {
        if (!containerRef.current)
            return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const containerWidth = entry.contentRect.width;
                const targetWidth = VIEWPORT_WIDTHS[viewport];
                const newScale = Math.min(1, containerWidth / targetWidth);
                setScale(newScale);
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [viewport]);
    const targetWidth = VIEWPORT_WIDTHS[viewport];
    if (!previewUrl) {
        return (_jsxs("div", { className: "flex h-full flex-col items-center justify-center gap-4 bg-muted/30 p-8 text-center", children: [_jsx("div", { className: "flex h-16 w-16 items-center justify-center rounded-full bg-muted", children: _jsx(Eye, { className: "h-8 w-8 text-muted-foreground" }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold", children: "Live Preview" }), _jsx("p", { className: "mt-1 text-sm text-muted-foreground max-w-[280px]", children: "Configure a preview URL in your site settings to see a live preview of this page as you edit." })] }), _jsxs("div", { className: "rounded-lg border bg-card p-4 text-left text-xs text-muted-foreground max-w-[320px]", children: [_jsx("p", { className: "font-medium text-foreground mb-2", children: "Quick setup:" }), _jsx("p", { className: "font-mono bg-muted px-2 py-1 rounded", children: "VITE_PREVIEW_URL=http://localhost:3000" }), _jsxs("p", { className: "mt-2", children: ["Then wrap your Next.js layout with", ' ', _jsx("code", { className: "font-mono bg-muted px-1 rounded", children: '<SigilPreviewProvider>' })] })] })] }));
    }
    return (_jsxs("div", { className: "flex h-full flex-col", children: [_jsxs("div", { className: "flex items-center justify-between border-b bg-muted/30 px-3 py-2", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(TooltipProvider, { delayDuration: 200, children: Object.keys(VIEWPORT_WIDTHS).map((vp) => {
                                    const Icon = VIEWPORT_ICONS[vp];
                                    return (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(Button, { variant: viewport === vp ? 'secondary' : 'ghost', size: "icon", className: "h-8 w-8", onClick: () => onViewportChange(vp), children: _jsx(Icon, { className: "h-4 w-4" }) }) }), _jsxs(TooltipContent, { children: [vp.charAt(0).toUpperCase() + vp.slice(1), " (", VIEWPORT_WIDTHS[vp], "px)"] })] }, vp));
                                }) }), _jsx(Separator, { orientation: "vertical", className: "mx-1 h-5" }), _jsx(Badge, { variant: isConnected ? 'default' : 'secondary', className: "text-[10px] px-1.5 py-0", children: isConnected ? 'Live' : 'Preview' })] }), _jsx("div", { className: "flex items-center gap-1", children: _jsxs(TooltipProvider, { delayDuration: 200, children: [_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: handleRefresh, children: _jsx(RefreshCw, { className: "h-4 w-4" }) }) }), _jsx(TooltipContent, { children: "Refresh preview" })] }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: handleOpenExternal, children: _jsx(ExternalLink, { className: "h-4 w-4" }) }) }), _jsx(TooltipContent, { children: "Open in new tab" })] })] }) })] }), _jsx("div", { ref: containerRef, className: "relative flex-1 overflow-hidden bg-muted/10", children: _jsx("div", { className: "origin-top-left", style: {
                        width: targetWidth,
                        height: `${100 / scale}%`,
                        transform: `scale(${scale})`,
                    }, children: _jsx("iframe", { ref: iframeRef, src: previewUrl, title: "Page preview", className: "h-full w-full border-0 bg-white", sandbox: "allow-scripts allow-same-origin allow-forms" }, iframeKey) }) })] }));
}
export function PreviewModeToggle({ mode, onChange }) {
    return (_jsx(TooltipProvider, { delayDuration: 200, children: _jsxs("div", { className: "flex items-center rounded-lg border bg-muted/50 p-0.5", children: [_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { className: cn('rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors', mode === 'edit'
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'), onClick: () => onChange('edit'), children: "Edit" }) }), _jsx(TooltipContent, { children: "Editor only" })] }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsxs("button", { className: cn('rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors', mode === 'split'
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'), onClick: () => onChange('split'), children: [_jsx(Columns2, { className: "mr-1 inline-block h-3.5 w-3.5" }), "Split"] }) }), _jsx(TooltipContent, { children: "Side-by-side editor and preview" })] }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsxs("button", { className: cn('rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors', mode === 'preview'
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'), onClick: () => onChange('preview'), children: [_jsx(Eye, { className: "mr-1 inline-block h-3.5 w-3.5" }), "Preview"] }) }), _jsx(TooltipContent, { children: "Full-width preview" })] })] }) }));
}
//# sourceMappingURL=LivePreviewPanel.js.map