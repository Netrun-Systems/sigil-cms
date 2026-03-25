/**
 * StockImageBrowser — full-page stock image search embedded inside the
 * Media Library's "Stock Images" tab.
 *
 * Unlike ImagePicker (which is a modal), this renders inline so users can
 * browse, copy URLs, or download images directly from the Media Library
 * without needing to be inside a block editor context.
 */

import { useState } from 'react';
import {
  Input,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  cn,
} from '@netrun-cms/ui';
import {
  Search,
  Copy,
  ExternalLink,
  ImageOff,
  AlertCircle,
  ChevronDown,
  Check,
} from 'lucide-react';
import { useStockImages, type StockImageSource } from '../../hooks/useStockImages';
import {
  verticalSuggestions,
  isSourceConfigured,
  type StockImage,
} from '../../lib/stock-image-api';

// ---------------------------------------------------------------------------
// Source options for the select dropdown
// ---------------------------------------------------------------------------

const SOURCE_OPTIONS: { value: StockImageSource; label: string }[] = [
  { value: 'all', label: 'All Sources' },
  { value: 'unsplash', label: 'Unsplash' },
  { value: 'pexels', label: 'Pexels' },
  { value: 'pixabay', label: 'Pixabay' },
];

// ---------------------------------------------------------------------------
// Individual image card
// ---------------------------------------------------------------------------

function BrowserImageCard({
  image,
  copied,
  onCopy,
}: {
  image: StockImage;
  copied: boolean;
  onCopy: () => void;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-muted transition-all hover:border-primary">
      <div className="aspect-video w-full">
        {!loaded && <Skeleton className="absolute inset-0" />}
        <img
          src={image.thumbnailUrl}
          alt={image.alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={cn(
            'h-full w-full object-cover transition-opacity duration-200',
            loaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 flex flex-col justify-between bg-black/60 p-2 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex justify-between items-start">
          <span className="rounded bg-white/20 px-1.5 py-0.5 text-xs font-medium text-white capitalize">
            {image.source}
          </span>
          <a
            href={image.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded bg-white/20 p-1 text-white hover:bg-white/30"
            title="View on source site"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <div className="space-y-1">
          <p className="truncate text-xs text-white/90">
            {image.photographer}
          </p>
          <Button
            size="sm"
            variant="secondary"
            className="h-7 w-full text-xs"
            onClick={onCopy}
          >
            {copied ? (
              <>
                <Check className="mr-1.5 h-3 w-3" /> Copied
              </>
            ) : (
              <>
                <Copy className="mr-1.5 h-3 w-3" /> Copy URL
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main browser component
// ---------------------------------------------------------------------------

export function StockImageBrowser() {
  const [query, setQuery] = useState('');
  const [source, setSource] = useState<StockImageSource>('all');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const { images, isLoading, error, hasMore, loadMore } = useStockImages(query, source);

  const handleCopy = (url: string) => {
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

  return (
    <div className="space-y-4">
      {/* Search + source filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search stock images..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={source}
          onValueChange={(v) => setSource(v as StockImageSource)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SOURCE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
                {opt.value !== 'all' && !isSourceConfigured(opt.value) && (
                  <span className="ml-2 text-xs text-muted-foreground">(not configured)</span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quick suggestion chips */}
      {!query && (
        <div className="flex flex-wrap gap-1.5">
          {allSuggestions.map((term) => (
            <button
              key={term}
              onClick={() => setQuery(term)}
              className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {term}
            </button>
          ))}
        </div>
      )}

      {/* Vertical suggestion chips per vertical */}
      {!query && (
        <div className="space-y-2">
          {Object.entries(verticalSuggestions).slice(0, 3).map(([vertical, terms]) => (
            <div key={vertical} className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium capitalize text-muted-foreground w-24 shrink-0">
                {vertical.replace('_', ' ')}
              </span>
              {terms.map((term) => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {term}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!query.trim() ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
          <Search className="h-10 w-10 opacity-30" />
          <p className="text-sm">Enter a search term or click a suggestion above</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <AlertCircle className="h-10 w-10 text-destructive/60" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : isLoading && images.length === 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-video rounded-lg" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <ImageOff className="h-10 w-10 opacity-30" />
          <p className="text-sm">No images found for &quot;{query}&quot;</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((img, i) => (
              <BrowserImageCard
                key={`${img.source}-${img.sourceUrl}-${i}`}
                image={img}
                copied={copiedUrl === img.url}
                onCopy={() => handleCopy(img.url)}
              />
            ))}
            {isLoading && images.length > 0 &&
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={`sk-${i}`} className="aspect-video rounded-lg" />
              ))
            }
          </div>

          {!isLoading && hasMore && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={loadMore}>
                <ChevronDown className="mr-2 h-4 w-4" />
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StockImageBrowser;
