import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * StockImageBrowser — full-page stock image search embedded inside the
 * Media Library's "Stock Images" tab.
 *
 * Unlike ImagePicker (which is a modal), this renders inline so users can
 * browse, copy URLs, or download images directly from the Media Library
 * without needing to be inside a block editor context.
 */
import { useState } from 'react';
import { Input, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton, cn, } from '@netrun-cms/ui';
import { Search, Copy, ExternalLink, ImageOff, AlertCircle, ChevronDown, Check, } from 'lucide-react';
import { useStockImages } from '../../hooks/useStockImages';
import { verticalSuggestions, isSourceConfigured, } from '../../lib/stock-image-api';
// ---------------------------------------------------------------------------
// Source options for the select dropdown
// ---------------------------------------------------------------------------
const SOURCE_OPTIONS = [
    { value: 'all', label: 'All Sources' },
    { value: 'unsplash', label: 'Unsplash' },
    { value: 'pexels', label: 'Pexels' },
    { value: 'pixabay', label: 'Pixabay' },
];
// ---------------------------------------------------------------------------
// Individual image card
// ---------------------------------------------------------------------------
function BrowserImageCard({ image, copied, onCopy, }) {
    const [loaded, setLoaded] = useState(false);
    return (_jsxs("div", { className: "group relative overflow-hidden rounded-lg border bg-muted transition-all hover:border-primary", children: [_jsxs("div", { className: "aspect-video w-full", children: [!loaded && _jsx(Skeleton, { className: "absolute inset-0" }), _jsx("img", { src: image.thumbnailUrl, alt: image.alt, loading: "lazy", onLoad: () => setLoaded(true), className: cn('h-full w-full object-cover transition-opacity duration-200', loaded ? 'opacity-100' : 'opacity-0') })] }), _jsxs("div", { className: "absolute inset-0 flex flex-col justify-between bg-black/60 p-2 opacity-0 transition-opacity group-hover:opacity-100", children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsx("span", { className: "rounded bg-white/20 px-1.5 py-0.5 text-xs font-medium text-white capitalize", children: image.source }), _jsx("a", { href: image.sourceUrl, target: "_blank", rel: "noopener noreferrer", className: "rounded bg-white/20 p-1 text-white hover:bg-white/30", title: "View on source site", onClick: (e) => e.stopPropagation(), children: _jsx(ExternalLink, { className: "h-3 w-3" }) })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "truncate text-xs text-white/90", children: image.photographer }), _jsx(Button, { size: "sm", variant: "secondary", className: "h-7 w-full text-xs", onClick: onCopy, children: copied ? (_jsxs(_Fragment, { children: [_jsx(Check, { className: "mr-1.5 h-3 w-3" }), " Copied"] })) : (_jsxs(_Fragment, { children: [_jsx(Copy, { className: "mr-1.5 h-3 w-3" }), " Copy URL"] })) })] })] })] }));
}
// ---------------------------------------------------------------------------
// Main browser component
// ---------------------------------------------------------------------------
export function StockImageBrowser() {
    const [query, setQuery] = useState('');
    const [source, setSource] = useState('all');
    const [copiedUrl, setCopiedUrl] = useState(null);
    const { images, isLoading, error, hasMore, loadMore } = useStockImages(query, source);
    const handleCopy = (url) => {
        navigator.clipboard.writeText(url).then(() => {
            setCopiedUrl(url);
            setTimeout(() => setCopiedUrl(null), 2000);
        });
    };
    // Flat list of all suggestion terms across all verticals for the browser.
    const allSuggestions = [
        'business meeting',
        'modern office',
        'technology',
        'nature landscape',
        'team collaboration',
        'food plating',
        'restaurant interior',
        'music studio',
        'coding workspace',
        'community gathering',
    ];
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), _jsx(Input, { placeholder: "Search stock images...", value: query, onChange: (e) => setQuery(e.target.value), className: "pl-9" })] }), _jsxs(Select, { value: source, onValueChange: (v) => setSource(v), children: [_jsx(SelectTrigger, { className: "w-full sm:w-[180px]", children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: SOURCE_OPTIONS.map((opt) => (_jsxs(SelectItem, { value: opt.value, children: [opt.label, opt.value !== 'all' && !isSourceConfigured(opt.value) && (_jsx("span", { className: "ml-2 text-xs text-muted-foreground", children: "(not configured)" }))] }, opt.value))) })] })] }), !query && (_jsx("div", { className: "flex flex-wrap gap-1.5", children: allSuggestions.map((term) => (_jsx("button", { onClick: () => setQuery(term), className: "rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground", children: term }, term))) })), !query && (_jsx("div", { className: "space-y-2", children: Object.entries(verticalSuggestions).slice(0, 3).map(([vertical, terms]) => (_jsxs("div", { className: "flex flex-wrap items-center gap-1.5", children: [_jsx("span", { className: "text-xs font-medium capitalize text-muted-foreground w-24 shrink-0", children: vertical.replace('_', ' ') }), terms.map((term) => (_jsx("button", { onClick: () => setQuery(term), className: "rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground", children: term }, term)))] }, vertical))) })), !query.trim() ? (_jsxs("div", { className: "flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground", children: [_jsx(Search, { className: "h-10 w-10 opacity-30" }), _jsx("p", { className: "text-sm", children: "Enter a search term or click a suggestion above" })] })) : error ? (_jsxs("div", { className: "flex flex-col items-center justify-center gap-3 py-16", children: [_jsx(AlertCircle, { className: "h-10 w-10 text-destructive/60" }), _jsx("p", { className: "text-sm text-destructive", children: error })] })) : isLoading && images.length === 0 ? (_jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3", children: Array.from({ length: 12 }).map((_, i) => (_jsx(Skeleton, { className: "aspect-video rounded-lg" }, i))) })) : images.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground", children: [_jsx(ImageOff, { className: "h-10 w-10 opacity-30" }), _jsxs("p", { className: "text-sm", children: ["No images found for \"", query, "\""] })] })) : (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3", children: [images.map((img, i) => (_jsx(BrowserImageCard, { image: img, copied: copiedUrl === img.url, onCopy: () => handleCopy(img.url) }, `${img.source}-${img.sourceUrl}-${i}`))), isLoading && images.length > 0 &&
                                Array.from({ length: 4 }).map((_, i) => (_jsx(Skeleton, { className: "aspect-video rounded-lg" }, `sk-${i}`)))] }), !isLoading && hasMore && (_jsx("div", { className: "flex justify-center", children: _jsxs(Button, { variant: "outline", onClick: loadMore, children: [_jsx(ChevronDown, { className: "mr-2 h-4 w-4" }), "Load More"] }) }))] }))] }));
}
export default StockImageBrowser;
//# sourceMappingURL=StockImageBrowser.js.map