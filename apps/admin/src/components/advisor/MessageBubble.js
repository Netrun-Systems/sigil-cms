import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import Markdown from 'react-markdown';
import { Copy, Check, Volume2 } from 'lucide-react';
import { cn } from '@netrun-cms/ui';
export function MessageBubble({ message, onSpeak }) {
    const [copied, setCopied] = useState(false);
    const isUser = message.role === 'user';
    const handleCopy = async () => {
        await navigator.clipboard.writeText(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (_jsx("div", { className: cn('flex', isUser ? 'justify-end' : 'justify-start'), children: _jsxs("div", { className: cn('group relative max-w-[80%] rounded-2xl px-4 py-3', isUser
                ? 'bg-primary text-primary-foreground'
                : 'bg-sidebar border border-border text-sidebar-foreground'), children: [isUser ? (_jsx("p", { className: "whitespace-pre-wrap text-sm", children: message.content })) : (_jsxs("div", { className: "prose prose-sm prose-invert max-w-none text-sm [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_code]:bg-black/20 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-black/20 [&_pre]:rounded-lg", children: [_jsx(Markdown, { children: message.content }), message.isStreaming && (_jsx("span", { className: "inline-block w-1.5 h-4 bg-primary animate-pulse ml-0.5 align-text-bottom" }))] })), !isUser && !message.isStreaming && message.content && (_jsxs("div", { className: "absolute -bottom-3 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity", children: [_jsx("button", { onClick: handleCopy, className: "rounded-md bg-muted p-1 text-muted-foreground hover:text-foreground transition-colors", title: "Copy", children: copied ? _jsx(Check, { className: "h-3 w-3" }) : _jsx(Copy, { className: "h-3 w-3" }) }), onSpeak && (_jsx("button", { onClick: () => onSpeak(message.content), className: "rounded-md bg-muted p-1 text-muted-foreground hover:text-foreground transition-colors", title: "Read aloud", children: _jsx(Volume2, { className: "h-3 w-3" }) }))] }))] }) }));
}
//# sourceMappingURL=MessageBubble.js.map