import * as React from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '../lib/utils';

interface ColorInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
  className?: string;
}

const ColorInput = React.forwardRef<HTMLDivElement, ColorInputProps>(
  ({ label, value, onChange, description, className }, ref) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    };

    return (
      <div ref={ref} className={cn('space-y-2', className)}>
        <div className="flex items-center justify-between">
          {label && <label className="text-sm font-medium">{label}</label>}
          <button
            type="button"
            onClick={handleCopy}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {copied ? (
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3" /> Copied
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Copy className="h-3 w-3" /> Copy
              </span>
            )}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="relative h-9 w-9 cursor-pointer overflow-hidden rounded-md border border-input"
            style={{ backgroundColor: value }}
          >
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </div>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 font-mono text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="#000000"
          />
        </div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    );
  }
);
ColorInput.displayName = 'ColorInput';

export { ColorInput };
export type { ColorInputProps };
