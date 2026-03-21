/**
 * FontBrowser — Search and preview Google Fonts + upload custom fonts
 *
 * Two modes:
 * 1. Google Fonts: Searches a curated list of 200+ popular fonts, loads them
 *    via the Google Fonts CSS API for instant preview, no API key required.
 * 2. Custom Upload: Upload .woff2/.woff/.ttf/.otf files, generates @font-face rules.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Button,
  Input,
  Label,
  cn,
} from '@netrun-cms/ui';
import {
  Search,
  Upload,
  Check,
  X,
  Globe,
  HardDrive,
  Loader2,
  Type,
} from 'lucide-react';

// ============================================================================
// CURATED GOOGLE FONTS LIST (no API key needed for CSS loading)
// ============================================================================

interface GoogleFont {
  family: string;
  category: 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace';
  variants: string[];
}

const GOOGLE_FONTS: GoogleFont[] = [
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
const loadedFonts = new Set<string>();

function loadGoogleFont(family: string, weights: string[] = ['400', '700']): void {
  if (loadedFonts.has(family)) return;
  loadedFonts.add(family);

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weights.join(';')}&display=swap`;
  document.head.appendChild(link);
}

// ============================================================================
// CUSTOM FONT UPLOAD
// ============================================================================

export interface CustomFont {
  name: string;
  fileName: string;
  url: string;
  format: 'woff2' | 'woff' | 'truetype' | 'opentype';
  weight: string;
  style: string;
}

const ACCEPTED_FONT_TYPES: Record<string, string> = {
  'font/woff2': 'woff2',
  'font/woff': 'woff',
  'font/ttf': 'truetype',
  'application/x-font-ttf': 'truetype',
  'font/otf': 'opentype',
  'application/x-font-opentype': 'opentype',
};

const ACCEPTED_EXTENSIONS: Record<string, string> = {
  '.woff2': 'woff2',
  '.woff': 'woff',
  '.ttf': 'truetype',
  '.otf': 'opentype',
};

function getFormatFromFile(file: File): string | null {
  const byMime = ACCEPTED_FONT_TYPES[file.type];
  if (byMime) return byMime;
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  return ACCEPTED_EXTENSIONS[ext] || null;
}

function generateFontFaceCss(fonts: CustomFont[]): string {
  return fonts
    .map(
      (f) => `@font-face {
  font-family: '${f.name}';
  src: url('${f.url}') format('${f.format}');
  font-weight: ${f.weight};
  font-style: ${f.style};
  font-display: swap;
}`
    )
    .join('\n\n');
}

// ============================================================================
// FONT BROWSER COMPONENT
// ============================================================================

interface FontBrowserProps {
  /** Currently selected font family */
  currentFont: string;
  /** Called when user selects a font */
  onSelect: (fontFamily: string, source: 'google' | 'local' | 'custom') => void;
  /** Called when custom fonts are uploaded (provides @font-face CSS) */
  onCustomFontsChange?: (fonts: CustomFont[], css: string) => void;
  /** Custom fonts already uploaded */
  customFonts?: CustomFont[];
  /** Label for the font role (e.g., "Body Font", "Heading Font") */
  label?: string;
}

export function FontBrowser({
  currentFont,
  onSelect,
  onCustomFontsChange,
  customFonts = [],
  label = 'Font',
}: FontBrowserProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [tab, setTab] = useState<'google' | 'upload'>('google');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const filteredFonts = GOOGLE_FONTS.filter((f) => {
    if (categoryFilter !== 'all' && f.category !== categoryFilter) return false;
    if (search && !f.family.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleFontHover = useCallback((family: string) => {
    loadGoogleFont(family);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    const newFonts: CustomFont[] = [...customFonts];

    for (const file of Array.from(files)) {
      const format = getFormatFromFile(file);
      if (!format) continue;

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
      if (lower.includes('thin') || lower.includes('100')) weight = '100';
      else if (lower.includes('extralight') || lower.includes('200')) weight = '200';
      else if (lower.includes('light') || lower.includes('300')) weight = '300';
      else if (lower.includes('medium') || lower.includes('500')) weight = '500';
      else if (lower.includes('semibold') || lower.includes('600')) weight = '600';
      else if (lower.includes('bold') || lower.includes('700')) weight = '700';
      else if (lower.includes('extrabold') || lower.includes('800')) weight = '800';
      else if (lower.includes('black') || lower.includes('900')) weight = '900';

      const style = lower.includes('italic') ? 'italic' : 'normal';

      // Extract just the family name (strip weight/style indicators)
      const familyName = baseName
        .replace(/\b(thin|extralight|light|regular|medium|semibold|bold|extrabold|black|italic)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim() || baseName;

      const font: CustomFont = {
        name: familyName,
        fileName: file.name,
        url,
        format: format as CustomFont['format'],
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const cleanFontName = currentFont.split(',')[0].replace(/'/g, '').trim();

  return (
    <div ref={containerRef} className="relative space-y-2">
      <Label className="text-sm">{label}</Label>

      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors',
          'hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
          isOpen && 'border-primary ring-2 ring-primary/20'
        )}
      >
        <span style={{ fontFamily: currentFont }} className="truncate">
          {cleanFontName}
        </span>
        <Type className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-[420px] rounded-lg border bg-popover shadow-lg overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setTab('google')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors',
                tab === 'google' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Globe className="h-3.5 w-3.5" />
              Google Fonts
            </button>
            <button
              onClick={() => setTab('upload')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors',
                tab === 'upload' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <HardDrive className="h-3.5 w-3.5" />
              Custom Fonts
            </button>
          </div>

          {tab === 'google' && (
            <>
              {/* Search */}
              <div className="p-2 border-b space-y-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search fonts..."
                    className="pl-8 h-8 text-sm"
                    autoFocus
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-2.5 top-2.5">
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  )}
                </div>
                {/* Category filter */}
                <div className="flex gap-1 flex-wrap">
                  {['all', 'sans-serif', 'serif', 'display', 'handwriting', 'monospace'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-medium transition-colors',
                        categoryFilter === cat
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      )}
                    >
                      {cat === 'all' ? 'All' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font list */}
              <div className="overflow-y-auto flex-1">
                {/* Local/system fonts */}
                <div className="px-2 py-1.5">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-1 mb-1">System</p>
                  {[
                    { family: '-apple-system', label: 'System Default' },
                    { family: 'Futura Medium', label: 'Futura Medium' },
                    { family: 'Futura Bold', label: 'Futura Bold' },
                    { family: 'Georgia', label: 'Georgia' },
                  ].map((f) => (
                    <button
                      key={f.family}
                      onClick={() => { onSelect(`'${f.family}', system-ui, sans-serif`, 'local'); setIsOpen(false); }}
                      className={cn(
                        'flex w-full items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-accent transition-colors',
                        cleanFontName === f.family && 'bg-accent'
                      )}
                      style={{ fontFamily: `'${f.family}', system-ui, sans-serif` }}
                    >
                      <span>{f.label}</span>
                      {cleanFontName === f.family && <Check className="h-3.5 w-3.5 text-primary" />}
                    </button>
                  ))}
                </div>

                {/* Custom uploaded fonts */}
                {customFonts.length > 0 && (
                  <div className="px-2 py-1.5 border-t">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-1 mb-1">Custom Uploads</p>
                    {[...new Set(customFonts.map((f) => f.name))].map((name) => (
                      <button
                        key={name}
                        onClick={() => { onSelect(`'${name}', system-ui, sans-serif`, 'custom'); setIsOpen(false); }}
                        className={cn(
                          'flex w-full items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-accent transition-colors',
                          cleanFontName === name && 'bg-accent'
                        )}
                        style={{ fontFamily: `'${name}', system-ui, sans-serif` }}
                      >
                        <span>{name}</span>
                        {cleanFontName === name && <Check className="h-3.5 w-3.5 text-primary" />}
                      </button>
                    ))}
                  </div>
                )}

                {/* Google Fonts */}
                <div className="px-2 py-1.5 border-t">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-1 mb-1">
                    Google Fonts ({filteredFonts.length})
                  </p>
                  {filteredFonts.map((font) => (
                    <button
                      key={font.family}
                      onClick={() => {
                        loadGoogleFont(font.family, font.variants);
                        onSelect(`'${font.family}', ${font.category}`, 'google');
                        setIsOpen(false);
                      }}
                      onMouseEnter={() => handleFontHover(font.family)}
                      className={cn(
                        'flex w-full items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-accent transition-colors',
                        cleanFontName === font.family && 'bg-accent'
                      )}
                      style={{ fontFamily: `'${font.family}', ${font.category}` }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="truncate">{font.family}</span>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">{font.category}</span>
                      </div>
                      {cleanFontName === font.family && <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                    </button>
                  ))}
                  {filteredFonts.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No fonts match "{search}"</p>
                  )}
                </div>
              </div>
            </>
          )}

          {tab === 'upload' && (
            <div className="p-4 space-y-4">
              <div className="text-center space-y-2">
                <div
                  className="border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors hover:border-primary hover:bg-primary/5"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2 className="h-8 w-8 mx-auto text-muted-foreground animate-spin" />
                  ) : (
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  )}
                  <p className="text-sm font-medium mt-2">
                    {uploading ? 'Processing...' : 'Upload Font Files'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    .woff2, .woff, .ttf, .otf — multiple files supported
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".woff2,.woff,.ttf,.otf"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* List of uploaded custom fonts */}
              {customFonts.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Uploaded Fonts</p>
                  {customFonts.map((font, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded px-2 py-1.5 text-sm bg-muted/50"
                    >
                      <div className="min-w-0">
                        <span className="font-medium truncate block" style={{ fontFamily: `'${font.name}'` }}>
                          {font.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {font.fileName} · {font.weight} · {font.style}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 flex-shrink-0"
                        onClick={() => {
                          onSelect(`'${font.name}', system-ui, sans-serif`, 'custom');
                          setIsOpen(false);
                        }}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { generateFontFaceCss, loadGoogleFont, GOOGLE_FONTS };
