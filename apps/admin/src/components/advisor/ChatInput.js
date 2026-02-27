import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@netrun-cms/ui';
export function ChatInput({ onSend, disabled, transcript }) {
    const [value, setValue] = useState('');
    const inputRef = useRef(null);
    useEffect(() => {
        if (transcript) {
            setValue(transcript);
            inputRef.current?.focus();
        }
    }, [transcript]);
    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmed = value.trim();
        if (!trimmed || disabled)
            return;
        onSend(trimmed);
        setValue('');
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };
    return (_jsxs("form", { onSubmit: handleSubmit, className: "flex items-end gap-2 p-4", children: [_jsx("textarea", { ref: inputRef, value: value, onChange: (e) => setValue(e.target.value), onKeyDown: handleKeyDown, placeholder: "Ask for advice, upload a document, or speak...", disabled: disabled, rows: 1, className: "flex-1 resize-none rounded-xl border border-border bg-sidebar px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50", style: { maxHeight: '120px', minHeight: '44px' }, onInput: (e) => {
                    const el = e.currentTarget;
                    el.style.height = 'auto';
                    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
                } }), _jsx("button", { type: "submit", disabled: disabled || !value.trim(), className: cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors', 'hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed'), children: disabled ? _jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : _jsx(Send, { className: "h-4 w-4" }) })] }));
}
//# sourceMappingURL=ChatInput.js.map