import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

interface TagInputProps {
  label?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  description?: string;
  className?: string;
}

const TagInput = React.forwardRef<HTMLDivElement, TagInputProps>(
  ({ label, tags, onChange, placeholder = 'Add tag...', description, className }, ref) => {
    const [input, setInput] = React.useState('');

    const addTag = () => {
      const trimmed = input.trim();
      if (trimmed && !tags.includes(trimmed)) {
        onChange([...tags, trimmed]);
      }
      setInput('');
    };

    return (
      <div ref={ref} className={cn('space-y-2', className)}>
        {label && <label className="text-sm font-medium">{label}</label>}
        <div className="flex flex-wrap gap-2 rounded-md border border-input bg-background p-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(tags.filter((t) => t !== tag))}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder={placeholder}
            className="min-w-[120px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    );
  }
);
TagInput.displayName = 'TagInput';

export { TagInput };
export type { TagInputProps };
