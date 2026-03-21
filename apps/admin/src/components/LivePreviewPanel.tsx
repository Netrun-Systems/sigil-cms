import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
  ExternalLink,
  Maximize2,
  Minimize2,
  Eye,
  Columns2,
  PanelRightClose,
} from 'lucide-react';
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Separator,
  Badge,
  cn,
} from '@netrun-cms/ui';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ViewportSize = 'desktop' | 'tablet' | 'mobile';
export type PreviewMode = 'edit' | 'split' | 'preview';

interface LivePreviewPanelProps {
  /** Ref forwarded to the iframe element so the parent can postMessage */
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  /** Full preview URL (e.g. http://localhost:3000/preview/about?token=xxx) */
  previewUrl: string | null;
  /** Current viewport selection */
  viewport: ViewportSize;
  onViewportChange: (v: ViewportSize) => void;
  /** Whether the iframe has acknowledged a connection (future use) */
  isConnected?: boolean;
}

const VIEWPORT_WIDTHS: Record<ViewportSize, number> = {
  desktop: 1280,
  tablet: 768,
  mobile: 375,
};

const VIEWPORT_ICONS: Record<ViewportSize, typeof Monitor> = {
  desktop: Monitor,
  tablet: Tablet,
  mobile: Smartphone,
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function LivePreviewPanel({
  iframeRef,
  previewUrl,
  viewport,
  onViewportChange,
  isConnected = false,
}: LivePreviewPanelProps) {
  const [iframeKey, setIframeKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleRefresh = useCallback(() => {
    setIframeKey((k) => k + 1);
  }, []);

  const handleOpenExternal = useCallback(() => {
    if (previewUrl) window.open(previewUrl, '_blank');
  }, [previewUrl]);

  /* Scale the iframe to fit within the container while preserving the
     viewport width.  For desktop (1280px) in a 640px-wide panel we
     scale to 0.5, etc.  */
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!containerRef.current) return;
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
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-muted/30 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Eye className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Live Preview</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-[280px]">
            Configure a preview URL in your site settings to see a live preview
            of this page as you edit.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-left text-xs text-muted-foreground max-w-[320px]">
          <p className="font-medium text-foreground mb-2">Quick setup:</p>
          <p className="font-mono bg-muted px-2 py-1 rounded">
            VITE_PREVIEW_URL=http://localhost:3000
          </p>
          <p className="mt-2">
            Then wrap your Next.js layout with{' '}
            <code className="font-mono bg-muted px-1 rounded">
              {'<SigilPreviewProvider>'}
            </code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-1">
          <TooltipProvider delayDuration={200}>
            {(Object.keys(VIEWPORT_WIDTHS) as ViewportSize[]).map((vp) => {
              const Icon = VIEWPORT_ICONS[vp];
              return (
                <Tooltip key={vp}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewport === vp ? 'secondary' : 'ghost'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onViewportChange(vp)}
                    >
                      <Icon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {vp.charAt(0).toUpperCase() + vp.slice(1)} ({VIEWPORT_WIDTHS[vp]}px)
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>

          <Separator orientation="vertical" className="mx-1 h-5" />

          <Badge
            variant={isConnected ? 'default' : 'secondary'}
            className="text-[10px] px-1.5 py-0"
          >
            {isConnected ? 'Live' : 'Preview'}
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleRefresh}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh preview</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleOpenExternal}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open in new tab</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Iframe container */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden bg-muted/10"
      >
        <div
          className="origin-top-left"
          style={{
            width: targetWidth,
            height: `${100 / scale}%`,
            transform: `scale(${scale})`,
          }}
        >
          <iframe
            key={iframeKey}
            ref={iframeRef as React.RefObject<HTMLIFrameElement>}
            src={previewUrl}
            title="Page preview"
            className="h-full w-full border-0 bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mode toggle for the page header toolbar                            */
/* ------------------------------------------------------------------ */

interface PreviewModeToggleProps {
  mode: PreviewMode;
  onChange: (mode: PreviewMode) => void;
}

export function PreviewModeToggle({ mode, onChange }: PreviewModeToggleProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center rounded-lg border bg-muted/50 p-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className={cn(
                'rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                mode === 'edit'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => onChange('edit')}
            >
              Edit
            </button>
          </TooltipTrigger>
          <TooltipContent>Editor only</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className={cn(
                'rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                mode === 'split'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => onChange('split')}
            >
              <Columns2 className="mr-1 inline-block h-3.5 w-3.5" />
              Split
            </button>
          </TooltipTrigger>
          <TooltipContent>Side-by-side editor and preview</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className={cn(
                'rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                mode === 'preview'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => onChange('preview')}
            >
              <Eye className="mr-1 inline-block h-3.5 w-3.5" />
              Preview
            </button>
          </TooltipTrigger>
          <TooltipContent>Full-width preview</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
