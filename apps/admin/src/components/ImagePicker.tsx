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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  ScrollArea,
  Skeleton,
  cn,
} from '@netrun-cms/ui';
import {
  Search,
  Camera,
  ExternalLink,
  ImageOff,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { useStockImages, type StockImageSource } from '../hooks/useStockImages';
import {
  verticalSuggestions,
  isSourceConfigured,
  type StockImage,
} from '../lib/stock-image-api';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ImagePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (image: StockImage) => void;
  /** Pre-fill the search box — use block context, e.g. 'hero background' */
  defaultQuery?: string;
  /** Vertical key for curated suggestions (e.g. 'restaurant', 'saas') */
  vertical?: string;
}

// Re-export so consumers don't need to import from the lib file.
export type { StockImage };

// ---------------------------------------------------------------------------
// Source labels
// ---------------------------------------------------------------------------

const SOURCE_LABELS: Record<StockImageSource, string> = {
  all: 'All',
  unsplash: 'Unsplash',
  pexels: 'Pexels',
  pixabay: 'Pixabay',
};

// ---------------------------------------------------------------------------
// Skeleton grid shown while loading
// ---------------------------------------------------------------------------

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-1">
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton key={i} className="aspect-video rounded-lg" />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Individual image card
// ---------------------------------------------------------------------------

function ImageCard({
  image,
  isSelected,
  onSelect,
  onPreview,
}: {
  image: StockImage;
  isSelected: boolean;
  onSelect: () => void;
  onPreview: () => void;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-lg border bg-muted transition-all hover:border-primary',
        isSelected && 'border-primary ring-2 ring-primary/30'
      )}
      onClick={onSelect}
    >
      {/* Aspect ratio wrapper */}
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
        {/* Source badge */}
        <div className="flex justify-between items-start">
          <span className="rounded bg-white/20 px-1.5 py-0.5 text-xs font-medium text-white capitalize">
            {image.source}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className="rounded bg-white/20 p-1 text-white hover:bg-white/30"
            title="Preview"
          >
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>

        {/* Photographer credit */}
        <p className="truncate text-xs text-white/90">
          {image.photographer}
        </p>
      </div>

      {/* Selected checkmark */}
      {isSelected && (
        <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
          ✓
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview modal shown when user clicks the external link icon
// ---------------------------------------------------------------------------

function PreviewModal({
  image,
  onClose,
  onSelect,
}: {
  image: StockImage;
  onClose: () => void;
  onSelect: () => void;
}) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="truncate">{image.alt || 'Image preview'}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center rounded-lg bg-muted p-4">
          <img
            src={image.thumbnailUrl}
            alt={image.alt}
            className="max-h-[55vh] max-w-full object-contain rounded"
          />
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Photo by{' '}
            <a
              href={image.photographerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              {image.photographer}
            </a>{' '}
            on{' '}
            <a
              href={image.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground capitalize"
              onClick={(e) => e.stopPropagation()}
            >
              {image.source}
            </a>
          </span>
          {image.width > 0 && image.height > 0 && (
            <span>{image.width} × {image.height}</span>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onSelect(); onClose(); }}>
            Insert Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// "Source not configured" notice
// ---------------------------------------------------------------------------

function UnconfiguredNotice({ source }: { source: 'pexels' | 'pixabay' }) {
  const envVar = source === 'pexels' ? 'VITE_PEXELS_KEY' : 'VITE_PIXABAY_KEY';
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <AlertCircle className="h-10 w-10 text-muted-foreground" />
      <div>
        <p className="font-medium capitalize">{source} API key not configured</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add <code className="rounded bg-muted px-1 text-xs">{envVar}</code> to
          your <code className="rounded bg-muted px-1 text-xs">.env</code> file to
          enable {source} search.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Image grid + load-more for a single source tab
// ---------------------------------------------------------------------------

function ImageGrid({
  query,
  source,
  selected,
  onSelect,
  onPreview,
}: {
  query: string;
  source: StockImageSource;
  selected: StockImage | null;
  onSelect: (img: StockImage) => void;
  onPreview: (img: StockImage) => void;
}) {
  const { images, isLoading, error, hasMore, loadMore } = useStockImages(query, source);

  if (!query.trim()) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
        <Search className="h-10 w-10 opacity-30" />
        <p className="text-sm">Enter a search term above to find images</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <ImageOff className="h-10 w-10 text-destructive/60" />
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!isLoading && images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
        <ImageOff className="h-10 w-10 opacity-30" />
        <p className="text-sm">No images found for &quot;{query}&quot;</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-1">
        {images.map((img, i) => (
          <ImageCard
            key={`${img.source}-${img.sourceUrl}-${i}`}
            image={img}
            isSelected={selected?.sourceUrl === img.sourceUrl}
            onSelect={() => onSelect(img)}
            onPreview={() => onPreview(img)}
          />
        ))}
        {isLoading && images.length > 0 && (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={`skel-${i}`} className="aspect-video rounded-lg" />
          ))
        )}
      </div>

      {!isLoading && hasMore && (
        <div className="flex justify-center pb-2">
          <Button variant="outline" size="sm" onClick={loadMore}>
            <ChevronDown className="mr-2 h-4 w-4" />
            Load More
          </Button>
        </div>
      )}

      {isLoading && images.length === 0 && <SkeletonGrid />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main ImagePicker component
// ---------------------------------------------------------------------------

export function ImagePicker({
  open,
  onOpenChange,
  onSelect,
  defaultQuery = '',
  vertical,
}: ImagePickerProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [activeSource, setActiveSource] = useState<StockImageSource>('all');
  const [selected, setSelected] = useState<StockImage | null>(null);
  const [previewing, setPreviewing] = useState<StockImage | null>(null);

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

  const suggestions =
    vertical && verticalSuggestions[vertical]
      ? verticalSuggestions[vertical]
      : null;

  const handleConfirm = () => {
    if (selected) {
      onSelect(selected);
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0">
          {/* Header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-muted-foreground" />
              Browse Stock Images
            </DialogTitle>

            {/* Search bar */}
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search images..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>

            {/* Curated suggestion chips */}
            {suggestions && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {suggestions.map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className={cn(
                      'rounded-full border px-2.5 py-0.5 text-xs transition-colors hover:bg-accent',
                      query === term
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground'
                    )}
                  >
                    {term}
                  </button>
                ))}
              </div>
            )}
          </DialogHeader>

          {/* Source tabs + scrollable grid */}
          <Tabs
            value={activeSource}
            onValueChange={(v) => setActiveSource(v as StockImageSource)}
            className="flex flex-col flex-1 min-h-0"
          >
            <TabsList className="shrink-0 mx-6 mt-3 w-fit">
              {(Object.keys(SOURCE_LABELS) as StockImageSource[]).map((src) => (
                <TabsTrigger key={src} value={src}>
                  {SOURCE_LABELS[src]}
                  {src !== 'all' && !isSourceConfigured(src) && (
                    <span
                      className="ml-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/50"
                      title="API key not configured"
                    />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {(Object.keys(SOURCE_LABELS) as StockImageSource[]).map((src) => (
              <TabsContent
                key={src}
                value={src}
                className="flex-1 min-h-0 mt-0 data-[state=active]:flex data-[state=active]:flex-col"
              >
                <ScrollArea className="flex-1 px-6 py-3">
                  {/* Show unconfigured notice for pexels/pixabay when no key */}
                  {(src === 'pexels' || src === 'pixabay') &&
                  !isSourceConfigured(src) ? (
                    <UnconfiguredNotice source={src} />
                  ) : (
                    <ImageGrid
                      query={query}
                      source={src}
                      selected={selected}
                      onSelect={setSelected}
                      onPreview={setPreviewing}
                    />
                  )}
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>

          {/* Footer with selection info + insert button */}
          <DialogFooter className="px-6 py-4 border-t shrink-0">
            <div className="flex w-full items-center justify-between gap-4">
              {selected ? (
                <div className="flex items-center gap-2 text-sm min-w-0">
                  <Camera className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-muted-foreground">
                    {selected.photographer} on{' '}
                    <span className="capitalize">{selected.source}</span>
                  </span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Select an image to insert
                </span>
              )}
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleConfirm} disabled={!selected}>
                  Insert Image
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inline preview modal (rendered outside the main dialog) */}
      {previewing && (
        <PreviewModal
          image={previewing}
          onClose={() => setPreviewing(null)}
          onSelect={() => {
            setSelected(previewing);
            setPreviewing(null);
          }}
        />
      )}
    </>
  );
}

export default ImagePicker;
