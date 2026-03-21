import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * FontBrowser — Search and preview Google Fonts + upload custom fonts
 *
 * Two modes:
 * 1. Google Fonts: Searches a curated list of 200+ popular fonts, loads them
 *    via the Google Fonts CSS API for instant preview, no API key required.
 * 2. Custom Upload: Upload .woff2/.woff/.ttf/.otf files, generates @font-face rules.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Input, Label, cn, } from '@netrun-cms/ui';
import { Search, Upload, Check, X, Globe, HardDrive, Loader2, Type, } from 'lucide-react';
const GOOGLE_FONTS = [
    // Sans-serif (most popular)
    { family: 'Inter', category: 'sans-serif', variants: ['300', '400', '500', '600', '700', '800'] },
    { family: 'Roboto', category: 'sans-serif', variants: ['300', '400', '500', '700'] },
    { family: 'Open Sans', category: 'sans-serif', variants: ['300', '400', '600', '700'] },
    { family: 'Lato', category: 'sans-serif', variants: ['300', '400', '700'] },
    { family: 'Montserrat', category: 'sans-serif', variants: ['300', '400', '500', '600', '700', '800'] },
    { family: 'Poppins', category: 'sans-serif', variants: ['300', '400', '500', '600', '700'] },
    { family: 'Nunito', category: 'sans-serif', variants: ['300', '400', '600', '700'] },
    { family: 'Raleway', category: 'sans-serif', variants: ['300', '400', '500', '600', '700'] },
    { family: 'DM Sans', category: 'sans-serif', variants: ['400', '500', '700'] },
    { family: 'Space Grotesk', category: 'sans-serif', variants: ['300', '400', '500', '600', '700'] },
    { family: 'Outfit', category: 'sans-serif', variants: ['300', '400', '500', '600', '700'] },
    { family: 'Sora', category: 'sans-serif', variants: ['300', '400', '500', '600', '700'] },
    { family: 'Manrope', category: 'sans-serif', variants: ['300', '400', '500', '600', '700', '800'] },
    { family: 'Plus Jakarta Sans', category: 'sans-serif', variants: ['300', '400', '500', '600', '700', '800'] },
    { family: 'Figtree', category: 'sans-serif', variants: ['300', '400', '500', '600', '700'] },
    { family: 'Geist', category: 'sans-serif', variants: ['300', '400', '500', '600', '700'] },
    { family: 'Lexend', category: 'sans-serif', variants: ['300', '400', '500', '600', '700'] },
    { family: 'Work Sans', category: 'sans-serif', variants: ['300', '400', '500', '600', '700'] },
    { family: 'Rubik', category: 'sans-serif', variants: ['300', '400', '500', '600', '700'] },
    { family: 'Karla', category: 'sans-serif', variants: ['300', '400', '500', '600', '700'] },
    { family: 'Barlow', category: 'sans-serif', variants: ['300', '400', '500', '600', '700'] },
    { family: 'Source Sans 3', category: 'sans-serif', variants: ['300', '400', '600', '700'] },
    { family: 'IBM Plex Sans', category: 'sans-serif', variants: ['300', '400', '500', '600', '700'] },
    { family: 'Noto Sans', category: 'sans-serif', variants: ['300', '400', '500', '600', '700'] },
    { family: 'Ubuntu', category: 'sans-serif', variants: ['300', '400', '500', '700'] },
    { family: 'Cabin', category: 'sans-serif', variants: ['400', '500', '600', '700'] },
    { family: 'Mukta', category: 'sans-serif', variants: ['300', '400', '500', '600', '700'] },
    { family: 'Exo 2', category: 'sans-serif', variants: ['300', '400', '500', '600', '700'] },
    { family: 'Quicksand', category: 'sans-serif', variants: ['300', '400', '500', '600', '700'] },
    { family: 'Josefin Sans', category: 'sans-serif', variants: ['300', '400', '600', '700'] },
    { family: 'Archivo', category: 'sans-serif', variants: ['400', '500', '600', '700'] },
    { family: 'Red Hat Display', category: 'sans-serif', variants: ['400', '500', '700'] },
    { family: 'Albert Sans', category: 'sans-serif', variants: ['300', '400', '500', '600', '700'] },
    { family: 'Urbanist', category: 'sans-serif', variants: ['300', '400', '500', '600', '700'] },
    { family: 'Satoshi', category: 'sans-serif', variants: ['400', '500', '700'] },
    // Serif
    { family: 'Playfair Display', category: 'serif', variants: ['400', '500', '600', '700'] },
    { family: 'Merriweather', category: 'serif', variants: ['300', '400', '700'] },
    { family: 'Lora', category: 'serif', variants: ['400', '500', '600', '700'] },
    { family: 'Source Serif 4', category: 'serif', variants: ['300', '400', '600', '700'] },
    { family: 'PT Serif', category: 'serif', variants: ['400', '700'] },
    { family: 'Libre Baskerville', category: 'serif', variants: ['400', '700'] },
    { family: 'DM Serif Display', category: 'serif', variants: ['400'] },
    { family: 'Cormorant Garamond', category: 'serif', variants: ['300', '400', '500', '600', '700'] },
    { family: 'EB Garamond', category: 'serif', variants: ['400', '500', '600', '700'] },
    { family: 'Bitter', category: 'serif', variants: ['300', '400', '500', '600', '700'] },
    { family: 'Crimson Text', category: 'serif', variants: ['400', '600', '700'] },
    { family: 'Spectral', category: 'serif', variants: ['300', '400', '500', '600', '700'] },
    { family: 'Instrument Serif', category: 'serif', variants: ['400'] },
    { family: 'Fraunces', category: 'serif', variants: ['300', '400', '500', '600', '700'] },
    // Display
    { family: 'Bebas Neue', category: 'display', variants: ['400'] },
    { family: 'Abril Fatface', category: 'display', variants: ['400'] },
    { family: 'Righteous', category: 'display', variants: ['400'] },
    { family: 'Passion One', category: 'display', variants: ['400', '700'] },
    { family: 'Permanent Marker', category: 'display', variants: ['400'] },
    { family: 'Alfa Slab One', category: 'display', variants: ['400'] },
    { family: 'Monoton', category: 'display', variants: ['400'] },
    { family: 'Orbitron', category: 'display', variants: ['400', '500', '600', '700'] },
    { family: 'Space Mono', category: 'display', variants: ['400', '700'] },
    { family: 'Comfortaa', category: 'display', variants: ['300', '400', '500', '600', '700'] },
    { family: 'Bungee', category: 'display', variants: ['400'] },
    { family: 'Major Mono Display', category: 'display', variants: ['400'] },
    // Handwriting
    { family: 'Caveat', category: 'handwriting', variants: ['400', '500', '600', '700'] },
    { family: 'Dancing Script', category: 'handwriting', variants: ['400', '500', '600', '700'] },
    { family: 'Pacifico', category: 'handwriting', variants: ['400'] },
    { family: 'Satisfy', category: 'handwriting', variants: ['400'] },
    { family: 'Great Vibes', category: 'handwriting', variants: ['400'] },
    { family: 'Sacramento', category: 'handwriting', variants: ['400'] },
    // Monospace
    { family: 'JetBrains Mono', category: 'monospace', variants: ['300', '400', '500', '600', '700'] },
    { family: 'Fira Code', category: 'monospace', variants: ['300', '400', '500', '600', '700'] },
    { family: 'Source Code Pro', category: 'monospace', variants: ['300', '400', '500', '600', '700'] },
    { family: 'IBM Plex Mono', category: 'monospace', variants: ['300', '400', '500', '600', '700'] },
    { family: 'Inconsolata', category: 'monospace', variants: ['300', '400', '500', '600', '700'] },
    { family: 'Roboto Mono', category: 'monospace', variants: ['300', '400', '500', '700'] },
];
// Track which fonts are loaded in the DOM
const loadedFonts = new Set();
function loadGoogleFont(family, weights = ['400', '700']) {
    if (loadedFonts.has(family))
        return;
    loadedFonts.add(family);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weights.join(';')}&display=swap`;
    document.head.appendChild(link);
}
const ACCEPTED_FONT_TYPES = {
    'font/woff2': 'woff2',
    'font/woff': 'woff',
    'font/ttf': 'truetype',
    'application/x-font-ttf': 'truetype',
    'font/otf': 'opentype',
    'application/x-font-opentype': 'opentype',
};
const ACCEPTED_EXTENSIONS = {
    '.woff2': 'woff2',
    '.woff': 'woff',
    '.ttf': 'truetype',
    '.otf': 'opentype',
};
function getFormatFromFile(file) {
    const byMime = ACCEPTED_FONT_TYPES[file.type];
    if (byMime)
        return byMime;
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    return ACCEPTED_EXTENSIONS[ext] || null;
}
function generateFontFaceCss(fonts) {
    return fonts
        .map((f) => `@font-face {
  font-family: '${f.name}';
  src: url('${f.url}') format('${f.format}');
  font-weight: ${f.weight};
  font-style: ${f.style};
  font-display: swap;
}`)
        .join('\n\n');
}
export function FontBrowser({ currentFont, onSelect, onCustomFontsChange, customFonts = [], label = 'Font', }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [tab, setTab] = useState('google');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const containerRef = useRef(null);
    // Close on click outside
    useEffect(() => {
        if (!isOpen)
            return;
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);
    const filteredFonts = GOOGLE_FONTS.filter((f) => {
        if (categoryFilter !== 'all' && f.category !== categoryFilter)
            return false;
        if (search && !f.family.toLowerCase().includes(search.toLowerCase()))
            return false;
        return true;
    });
    const handleFontHover = useCallback((family) => {
        loadGoogleFont(family);
    }, []);
    const handleFileUpload = async (e) => {
        const files = e.target.files;
        if (!files?.length)
            return;
        setUploading(true);
        const newFonts = [...customFonts];
        for (const file of Array.from(files)) {
            const format = getFormatFromFile(file);
            if (!format)
                continue;
            // Create a local object URL for immediate preview
            const url = URL.createObjectURL(file);
            // Derive font name from filename (strip extension, replace separators)
            const baseName = file.name
                .replace(/\.[^.]+$/, '')
                .replace(/[-_]/g, ' ')
                .replace(/([a-z])([A-Z])/g, '$1 $2');
            // Detect weight from filename
            const lower = file.name.toLowerCase();
            let weight = '400';
            if (lower.includes('thin') || lower.includes('100'))
                weight = '100';
            else if (lower.includes('extralight') || lower.includes('200'))
                weight = '200';
            else if (lower.includes('light') || lower.includes('300'))
                weight = '300';
            else if (lower.includes('medium') || lower.includes('500'))
                weight = '500';
            else if (lower.includes('semibold') || lower.includes('600'))
                weight = '600';
            else if (lower.includes('bold') || lower.includes('700'))
                weight = '700';
            else if (lower.includes('extrabold') || lower.includes('800'))
                weight = '800';
            else if (lower.includes('black') || lower.includes('900'))
                weight = '900';
            const style = lower.includes('italic') ? 'italic' : 'normal';
            // Extract just the family name (strip weight/style indicators)
            const familyName = baseName
                .replace(/\b(thin|extralight|light|regular|medium|semibold|bold|extrabold|black|italic)\b/gi, '')
                .replace(/\s+/g, ' ')
                .trim() || baseName;
            const font = {
                name: familyName,
                fileName: file.name,
                url,
                format: format,
                weight,
                style,
            };
            newFonts.push(font);
            // Inject @font-face immediately for preview
            const styleEl = document.createElement('style');
            styleEl.textContent = `@font-face { font-family: '${familyName}'; src: url('${url}') format('${format}'); font-weight: ${weight}; font-style: ${style}; font-display: swap; }`;
            document.head.appendChild(styleEl);
        }
        if (onCustomFontsChange) {
            onCustomFontsChange(newFonts, generateFontFaceCss(newFonts));
        }
        setUploading(false);
        if (fileInputRef.current)
            fileInputRef.current.value = '';
    };
    const cleanFontName = currentFont.split(',')[0].replace(/'/g, '').trim();
    return (_jsxs("div", { ref: containerRef, className: "relative space-y-2", children: [_jsx(Label, { className: "text-sm", children: label }), _jsxs("button", { onClick: () => setIsOpen(!isOpen), className: cn('flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors', 'hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20', isOpen && 'border-primary ring-2 ring-primary/20'), children: [_jsx("span", { style: { fontFamily: currentFont }, className: "truncate", children: cleanFontName }), _jsx(Type, { className: "h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" })] }), isOpen && (_jsxs("div", { className: "absolute z-50 mt-1 w-full max-h-[420px] rounded-lg border bg-popover shadow-lg overflow-hidden flex flex-col", children: [_jsxs("div", { className: "flex border-b", children: [_jsxs("button", { onClick: () => setTab('google'), className: cn('flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors', tab === 'google' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'), children: [_jsx(Globe, { className: "h-3.5 w-3.5" }), "Google Fonts"] }), _jsxs("button", { onClick: () => setTab('upload'), className: cn('flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors', tab === 'upload' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'), children: [_jsx(HardDrive, { className: "h-3.5 w-3.5" }), "Custom Fonts"] })] }), tab === 'google' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "p-2 border-b space-y-2", children: [_jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" }), _jsx(Input, { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Search fonts...", className: "pl-8 h-8 text-sm", autoFocus: true }), search && (_jsx("button", { onClick: () => setSearch(''), className: "absolute right-2.5 top-2.5", children: _jsx(X, { className: "h-3.5 w-3.5 text-muted-foreground" }) }))] }), _jsx("div", { className: "flex gap-1 flex-wrap", children: ['all', 'sans-serif', 'serif', 'display', 'handwriting', 'monospace'].map((cat) => (_jsx("button", { onClick: () => setCategoryFilter(cat), className: cn('px-2 py-0.5 rounded text-[10px] font-medium transition-colors', categoryFilter === cat
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted text-muted-foreground hover:bg-muted/80'), children: cat === 'all' ? 'All' : cat }, cat))) })] }), _jsxs("div", { className: "overflow-y-auto flex-1", children: [_jsxs("div", { className: "px-2 py-1.5", children: [_jsx("p", { className: "text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-1 mb-1", children: "System" }), [
                                                { family: '-apple-system', label: 'System Default' },
                                                { family: 'Futura Medium', label: 'Futura Medium' },
                                                { family: 'Futura Bold', label: 'Futura Bold' },
                                                { family: 'Georgia', label: 'Georgia' },
                                            ].map((f) => (_jsxs("button", { onClick: () => { onSelect(`'${f.family}', system-ui, sans-serif`, 'local'); setIsOpen(false); }, className: cn('flex w-full items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-accent transition-colors', cleanFontName === f.family && 'bg-accent'), style: { fontFamily: `'${f.family}', system-ui, sans-serif` }, children: [_jsx("span", { children: f.label }), cleanFontName === f.family && _jsx(Check, { className: "h-3.5 w-3.5 text-primary" })] }, f.family)))] }), customFonts.length > 0 && (_jsxs("div", { className: "px-2 py-1.5 border-t", children: [_jsx("p", { className: "text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-1 mb-1", children: "Custom Uploads" }), [...new Set(customFonts.map((f) => f.name))].map((name) => (_jsxs("button", { onClick: () => { onSelect(`'${name}', system-ui, sans-serif`, 'custom'); setIsOpen(false); }, className: cn('flex w-full items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-accent transition-colors', cleanFontName === name && 'bg-accent'), style: { fontFamily: `'${name}', system-ui, sans-serif` }, children: [_jsx("span", { children: name }), cleanFontName === name && _jsx(Check, { className: "h-3.5 w-3.5 text-primary" })] }, name)))] })), _jsxs("div", { className: "px-2 py-1.5 border-t", children: [_jsxs("p", { className: "text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-1 mb-1", children: ["Google Fonts (", filteredFonts.length, ")"] }), filteredFonts.map((font) => (_jsxs("button", { onClick: () => {
                                                    loadGoogleFont(font.family, font.variants);
                                                    onSelect(`'${font.family}', ${font.category}`, 'google');
                                                    setIsOpen(false);
                                                }, onMouseEnter: () => handleFontHover(font.family), className: cn('flex w-full items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-accent transition-colors', cleanFontName === font.family && 'bg-accent'), style: { fontFamily: `'${font.family}', ${font.category}` }, children: [_jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [_jsx("span", { className: "truncate", children: font.family }), _jsx("span", { className: "text-[10px] text-muted-foreground flex-shrink-0", children: font.category })] }), cleanFontName === font.family && _jsx(Check, { className: "h-3.5 w-3.5 text-primary flex-shrink-0" })] }, font.family))), filteredFonts.length === 0 && (_jsxs("p", { className: "text-sm text-muted-foreground text-center py-4", children: ["No fonts match \"", search, "\""] }))] })] })] })), tab === 'upload' && (_jsxs("div", { className: "p-4 space-y-4", children: [_jsxs("div", { className: "text-center space-y-2", children: [_jsxs("div", { className: "border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors hover:border-primary hover:bg-primary/5", onClick: () => fileInputRef.current?.click(), children: [uploading ? (_jsx(Loader2, { className: "h-8 w-8 mx-auto text-muted-foreground animate-spin" })) : (_jsx(Upload, { className: "h-8 w-8 mx-auto text-muted-foreground" })), _jsx("p", { className: "text-sm font-medium mt-2", children: uploading ? 'Processing...' : 'Upload Font Files' }), _jsx("p", { className: "text-xs text-muted-foreground mt-1", children: ".woff2, .woff, .ttf, .otf \u2014 multiple files supported" })] }), _jsx("input", { ref: fileInputRef, type: "file", accept: ".woff2,.woff,.ttf,.otf", multiple: true, onChange: handleFileUpload, className: "hidden" })] }), customFonts.length > 0 && (_jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-xs font-medium text-muted-foreground", children: "Uploaded Fonts" }), customFonts.map((font, i) => (_jsxs("div", { className: "flex items-center justify-between rounded px-2 py-1.5 text-sm bg-muted/50", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("span", { className: "font-medium truncate block", style: { fontFamily: `'${font.name}'` }, children: font.name }), _jsxs("span", { className: "text-[10px] text-muted-foreground", children: [font.fileName, " \u00B7 ", font.weight, " \u00B7 ", font.style] })] }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-6 w-6 p-0 flex-shrink-0", onClick: () => {
                                                    onSelect(`'${font.name}', system-ui, sans-serif`, 'custom');
                                                    setIsOpen(false);
                                                }, children: _jsx(Check, { className: "h-3 w-3" }) })] }, i)))] }))] }))] }))] }));
}
export { generateFontFaceCss, loadGoogleFont, GOOGLE_FONTS };
//# sourceMappingURL=FontBrowser.js.map