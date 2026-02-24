import * as React from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface KeyValueEditorProps {
  label?: string;
  entries: Record<string, string>;
  onChange: (entries: Record<string, string>) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  description?: string;
  className?: string;
}

const KeyValueEditor = React.forwardRef<HTMLDivElement, KeyValueEditorProps>(
  (
    {
      label,
      entries,
      onChange,
      keyPlaceholder = 'Key',
      valuePlaceholder = 'Value',
      description,
      className,
    },
    ref
  ) => {
    const pairs = Object.entries(entries);

    const updateKey = (oldKey: string, newKey: string) => {
      const updated: Record<string, string> = {};
      for (const [k, v] of pairs) {
        updated[k === oldKey ? newKey : k] = v;
      }
      onChange(updated);
    };

    const updateValue = (key: string, value: string) => {
      onChange({ ...entries, [key]: value });
    };

    const addPair = () => {
      onChange({ ...entries, '': '' });
    };

    const removePair = (key: string) => {
      const { [key]: _, ...rest } = entries;
      onChange(rest);
    };

    return (
      <div ref={ref} className={cn('space-y-2', className)}>
        {label && <label className="text-sm font-medium">{label}</label>}
        <div className="space-y-2">
          {pairs.map(([key, val], i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={key}
                onChange={(e) => updateKey(key, e.target.value)}
                placeholder={keyPlaceholder}
                className="flex h-9 w-1/3 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <input
                value={val}
                onChange={(e) => updateValue(key, e.target.value)}
                placeholder={valuePlaceholder}
                className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <button
                type="button"
                onClick={() => removePair(key)}
                className="text-muted-foreground transition-colors hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addPair}
            className="flex items-center gap-1 text-sm text-primary transition-colors hover:text-primary/80"
          >
            <Plus className="h-3.5 w-3.5" /> Add entry
          </button>
        </div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    );
  }
);
KeyValueEditor.displayName = 'KeyValueEditor';

export { KeyValueEditor };
export type { KeyValueEditorProps };
