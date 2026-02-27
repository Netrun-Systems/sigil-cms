import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@netrun-cms/ui';

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
  transcript?: string;
}

export function ChatInput({ onSend, disabled, transcript }: Props) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (transcript) {
      setValue(transcript);
      inputRef.current?.focus();
    }
  }, [transcript]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 p-4">
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask for advice, upload a document, or speak..."
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none rounded-xl border border-border bg-sidebar px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
        style={{ maxHeight: '120px', minHeight: '44px' }}
        onInput={(e) => {
          const el = e.currentTarget;
          el.style.height = 'auto';
          el.style.height = Math.min(el.scrollHeight, 120) + 'px';
        }}
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors',
          'hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      </button>
    </form>
  );
}
