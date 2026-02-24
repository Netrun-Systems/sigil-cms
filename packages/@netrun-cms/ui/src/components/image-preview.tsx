import * as React from 'react';
import { cn } from '../lib/utils';

interface ImagePreviewProps {
  label?: string;
  url: string;
  onChange: (url: string) => void;
  placeholder?: string;
  description?: string;
  className?: string;
}

const ImagePreview = React.forwardRef<HTMLDivElement, ImagePreviewProps>(
  ({ label, url, onChange, placeholder = 'https://...', description, className }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-2', className)}>
        {label && <label className="text-sm font-medium">{label}</label>}
        <input
          type="url"
          value={url}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        {url && (
          <div className="mt-2 overflow-hidden rounded-lg border border-border">
            <img
              src={url}
              alt={label ?? 'Preview'}
              className="h-32 w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    );
  }
);
ImagePreview.displayName = 'ImagePreview';

export { ImagePreview };
export type { ImagePreviewProps };
