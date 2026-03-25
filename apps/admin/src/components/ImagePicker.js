import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * ImagePicker — Modal dialog for browsing and selecting stock images from
 * Unsplash, Pexels, and Pixabay.
 *
 * Usage:
 *   <ImagePicker
 *     open={open}
 *     onOpenChange={setOpen}
 *     onSelect={(image) => handleImageSelected(image)}
 *     defaultQuery="restaurant interior"
 *     vertical="restaurant"
 *   />
 */
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Input, Tabs, TabsList, TabsTrigger, TabsContent, ScrollArea, Skeleton, cn, } from '@netrun-cms/ui';
import { Search, Camera, ExternalLink, ImageOff, AlertCircle, ChevronDown, } from 'lucide-react';
import { useStockImages } from '../hooks/useStockImages';
import { verticalSuggestions, isSourceConfigured, } from '../lib/stock-image-api';
// ---------------------------------------------------------------------------
// Source labels
// ---------------------------------------------------------------------------
const SOURCE_LABELS = {
    all: 'All',
    unsplash: 'Unsplash',
    pexels: 'Pexels',
    pixabay: 'Pixabay',
};
// ---------------------------------------------------------------------------
// Skeleton grid shown while loading
// ---------------------------------------------------------------------------
function SkeletonGrid() {
    return (_jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-1", children: Array.from({ length: 12 }).map((_, i) => (_jsx(Skeleton, { className: "aspect-video rounded-lg" }, i))) }));
}
// ---------------------------------------------------------------------------
// Individual image card
// ---------------------------------------------------------------------------
function ImageCard({ image, isSelected, onSelect, onPreview, }) {
    const [loaded, setLoaded] = useState(false);
    return (_jsxs("div", { className: cn('group relative cursor-pointer overflow-hidden rounded-lg border bg-muted transition-all hover:border-primary', isSelected && 'border-primary ring-2 ring-primary/30'), onClick: onSelect, children: [_jsxs("div", { className: "aspect-video w-full", children: [!loaded && _jsx(Skeleton, { className: "absolute inset-0" }), _jsx("img", { src: image.thumbnailUrl, alt: image.alt, loading: "lazy", onLoad: () => setLoaded(true), className: cn('h-full w-full object-cover transition-opacity duration-200', loaded ? 'opacity-100' : 'opacity-0') })] }), _jsxs("div", { className: "absolute inset-0 flex flex-col justify-between bg-black/60 p-2 opacity-0 transition-opacity group-hover:opacity-100", children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsx("span", { className: "rounded bg-white/20 px-1.5 py-0.5 text-xs font-medium text-white capitalize", children: image.source }), _jsx("button", { onClick: (e) => {
                                    e.stopPropagation();
                                    onPreview();
                                }, className: "rounded bg-white/20 p-1 text-white hover:bg-white/30", title: "Preview", children: _jsx(ExternalLink, { className: "h-3 w-3" }) })] }), _jsx("p", { className: "truncate text-xs text-white/90", children: image.photographer })] }), isSelected && (_jsx("div", { className: "absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold", children: "\u2713" }))] }));
}
// ---------------------------------------------------------------------------
// Preview modal shown when user clicks the external link icon
// ---------------------------------------------------------------------------
function PreviewModal({ image, onClose, onSelect, }) {
    return (_jsx(Dialog, { open: true, onOpenChange: (o) => !o && onClose(), children: _jsxs(DialogContent, { className: "max-w-3xl", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { className: "truncate", children: image.alt || 'Image preview' }) }), _jsx("div", { className: "flex items-center justify-center rounded-lg bg-muted p-4", children: _jsx("img", { src: image.thumbnailUrl, alt: image.alt, className: "max-h-[55vh] max-w-full object-contain rounded" }) }), _jsxs("div", { className: "flex items-center justify-between text-sm text-muted-foreground", children: [_jsxs("span", { children: ["Photo by", ' ', _jsx("a", { href: image.photographerUrl, target: "_blank", rel: "noopener noreferrer", className: "underline hover:text-foreground", onClick: (e) => e.stopPropagation(), children: image.photographer }), ' ', "on", ' ', _jsx("a", { href: image.sourceUrl, target: "_blank", rel: "noopener noreferrer", className: "underline hover:text-foreground capitalize", onClick: (e) => e.stopPropagation(), children: image.source })] }), image.width > 0 && image.height > 0 && (_jsxs("span", { children: [image.width, " \u00D7 ", image.height] }))] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: onClose, children: "Cancel" }), _jsx(Button, { onClick: () => { onSelect(); onClose(); }, children: "Insert Image" })] })] }) }));
}
// ---------------------------------------------------------------------------
// "Source not configured" notice
// ---------------------------------------------------------------------------
function UnconfiguredNotice({ source }) {
    const envVar = source === 'pexels' ? 'VITE_PEXELS_KEY' : 'VITE_PIXABAY_KEY';
    return (_jsxs("div", { className: "flex flex-col items-center justify-center gap-3 py-16 text-center", children: [_jsx(AlertCircle, { className: "h-10 w-10 text-muted-foreground" }), _jsxs("div", { children: [_jsxs("p", { className: "font-medium capitalize", children: [source, " API key not configured"] }), _jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: ["Add ", _jsx("code", { className: "rounded bg-muted px-1 text-xs", children: envVar }), " to your ", _jsx("code", { className: "rounded bg-muted px-1 text-xs", children: ".env" }), " file to enable ", source, " search."] })] })] }));
}
// ---------------------------------------------------------------------------
// Image grid + load-more for a single source tab
// ---------------------------------------------------------------------------
function ImageGrid({ query, source, selected, onSelect, onPreview, }) {
    const { images, isLoading, error, hasMore, loadMore } = useStockImages(query, source);
    if (!query.trim()) {
        return (_jsxs("div", { className: "flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground", children: [_jsx(Search, { className: "h-10 w-10 opacity-30" }), _jsx("p", { className: "text-sm", children: "Enter a search term above to find images" })] }));
    }
    if (error) {
        return (_jsxs("div", { className: "flex flex-col items-center justify-center gap-3 py-16 text-center", children: [_jsx(ImageOff, { className: "h-10 w-10 text-destructive/60" }), _jsx("p", { className: "text-sm text-destructive", children: error })] }));
    }
    if (!isLoading && images.length === 0) {
        return (_jsxs("div", { className: "flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground", children: [_jsx(ImageOff, { className: "h-10 w-10 opacity-30" }), _jsxs("p", { className: "text-sm", children: ["No images found for \"", query, "\""] })] }));
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-1", children: [images.map((img, i) => (_jsx(ImageCard, { image: img, isSelected: selected?.sourceUrl === img.sourceUrl, onSelect: () => onSelect(img), onPreview: () => onPreview(img) }, `${img.source}-${img.sourceUrl}-${i}`))), isLoading && images.length > 0 && (Array.from({ length: 4 }).map((_, i) => (_jsx(Skeleton, { className: "aspect-video rounded-lg" }, `skel-${i}`))))] }), !isLoading && hasMore && (_jsx("div", { className: "flex justify-center pb-2", children: _jsxs(Button, { variant: "outline", size: "sm", onClick: loadMore, children: [_jsx(ChevronDown, { className: "mr-2 h-4 w-4" }), "Load More"] }) })), isLoading && images.length === 0 && _jsx(SkeletonGrid, {})] }));
}
// ---------------------------------------------------------------------------
// Main ImagePicker component
// ---------------------------------------------------------------------------
export function ImagePicker({ open, onOpenChange, onSelect, defaultQuery = '', vertical, }) {
    const [query, setQuery] = useState(defaultQuery);
    const [activeSource, setActiveSource] = useState('all');
    const [selected, setSelected] = useState(null);
    const [previewing, setPreviewing] = useState(null);
    // Sync defaultQuery when it changes externally (e.g. different block type).
    useEffect(() => {
        setQuery(defaultQuery);
    }, [defaultQuery]);
    // Reset state when dialog closes.
    useEffect(() => {
        if (!open) {
            setSelected(null);
            setPreviewing(null);
        }
    }, [open]);
    const suggestions = vertical && verticalSuggestions[vertical]
        ? verticalSuggestions[vertical]
        : null;
    const handleConfirm = () => {
        if (selected) {
            onSelect(selected);
            onOpenChange(false);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: "max-w-5xl h-[85vh] flex flex-col p-0 gap-0", children: [_jsxs(DialogHeader, { className: "px-6 pt-6 pb-4 border-b shrink-0", children: [_jsxs(DialogTitle, { className: "flex items-center gap-2", children: [_jsx(Camera, { className: "h-5 w-5 text-muted-foreground" }), "Browse Stock Images"] }), _jsxs("div", { className: "relative mt-3", children: [_jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), _jsx(Input, { placeholder: "Search images...", value: query, onChange: (e) => setQuery(e.target.value), className: "pl-9", autoFocus: true })] }), suggestions && (_jsx("div", { className: "mt-2 flex flex-wrap gap-1.5", children: suggestions.map((term) => (_jsx("button", { onClick: () => setQuery(term), className: cn('rounded-full border px-2.5 py-0.5 text-xs transition-colors hover:bg-accent', query === term
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-border text-muted-foreground'), children: term }, term))) }))] }), _jsxs(Tabs, { value: activeSource, onValueChange: (v) => setActiveSource(v), className: "flex flex-col flex-1 min-h-0", children: [_jsx(TabsList, { className: "shrink-0 mx-6 mt-3 w-fit", children: Object.keys(SOURCE_LABELS).map((src) => (_jsxs(TabsTrigger, { value: src, children: [SOURCE_LABELS[src], src !== 'all' && !isSourceConfigured(src) && (_jsx("span", { className: "ml-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/50", title: "API key not configured" }))] }, src))) }), Object.keys(SOURCE_LABELS).map((src) => (_jsx(TabsContent, { value: src, className: "flex-1 min-h-0 mt-0 data-[state=active]:flex data-[state=active]:flex-col", children: _jsx(ScrollArea, { className: "flex-1 px-6 py-3", children: (src === 'pexels' || src === 'pixabay') &&
                                            !isSourceConfigured(src) ? (_jsx(UnconfiguredNotice, { source: src })) : (_jsx(ImageGrid, { query: query, source: src, selected: selected, onSelect: setSelected, onPreview: setPreviewing })) }) }, src)))] }), _jsx(DialogFooter, { className: "px-6 py-4 border-t shrink-0", children: _jsxs("div", { className: "flex w-full items-center justify-between gap-4", children: [selected ? (_jsxs("div", { className: "flex items-center gap-2 text-sm min-w-0", children: [_jsx(Camera, { className: "h-4 w-4 shrink-0 text-muted-foreground" }), _jsxs("span", { className: "truncate text-muted-foreground", children: [selected.photographer, " on", ' ', _jsx("span", { className: "capitalize", children: selected.source })] })] })) : (_jsx("span", { className: "text-sm text-muted-foreground", children: "Select an image to insert" })), _jsxs("div", { className: "flex gap-2 shrink-0", children: [_jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: "Cancel" }), _jsx(Button, { onClick: handleConfirm, disabled: !selected, children: "Insert Image" })] })] }) })] }) }), previewing && (_jsx(PreviewModal, { image: previewing, onClose: () => setPreviewing(null), onSelect: () => {
                    setSelected(previewing);
                    setPreviewing(null);
                } }))] }));
}
export default ImagePicker;
//# sourceMappingURL=ImagePicker.js.map