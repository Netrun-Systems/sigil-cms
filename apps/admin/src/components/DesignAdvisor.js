import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Design Advisor Widget — Charlotte AI chat for the Design Playground sidebar.
 *
 * Chat-style interface pre-loaded with context (current theme tokens, active
 * page, block types). Responses include text advice and optionally generated
 * Stitch previews.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, Send, Loader2, Sparkles, ChevronDown, ChevronUp, Code, Download, } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, cn, } from '@netrun-cms/ui';
import { designAi } from '../lib/design-ai';
// ---------------------------------------------------------------------------
// Suggested prompts
// ---------------------------------------------------------------------------
const SUGGESTED_PROMPTS = [
    'Improve my color contrast',
    'Make this more modern',
    'Add a CTA section',
    'Suggest a better font pairing',
    'Review my page layout',
    'Make it more accessible',
];
// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function DesignAdvisor({ siteId, themeTokens, siteName, onImportCode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    // Auto-scroll on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    // ── Send message ────────────────────────────────────────────────────
    const sendMessage = useCallback(async (text) => {
        if (!text.trim() || isLoading)
            return;
        const userMsg = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: text.trim(),
            timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);
        try {
            const context = {
                themeTokens: themeTokens,
                siteName,
            };
            const res = await designAi.advisor(siteId, text.trim(), context);
            const data = res.data;
            const assistantMsg = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: data.answer,
                suggestions: data.suggestions,
                generatedCode: data.generatedCode,
                generatedPreviewUrl: data.generatedPreviewUrl,
                timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, assistantMsg]);
        }
        catch (err) {
            const errorMsg = {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
                timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, errorMsg]);
        }
        finally {
            setIsLoading(false);
        }
    }, [siteId, themeTokens, siteName, isLoading]);
    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessage(input);
    };
    // ── Render ──────────────────────────────────────────────────────────
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "cursor-pointer select-none", onClick: () => setIsOpen(!isOpen), children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(MessageSquare, { className: "h-5 w-5 text-blue-500" }), _jsxs("div", { children: [_jsx(CardTitle, { className: "text-base", children: "Charlotte Design Advisor" }), _jsx(CardDescription, { children: "AI-powered design advice for your site" })] })] }), isOpen ? _jsx(ChevronUp, { className: "h-4 w-4" }) : _jsx(ChevronDown, { className: "h-4 w-4" })] }) }), isOpen && (_jsxs(CardContent, { className: "space-y-3", children: [_jsx("div", { className: "flex h-[360px] flex-col overflow-y-auto rounded-lg border bg-muted/30 p-3", children: messages.length === 0 ? (_jsxs("div", { className: "flex flex-1 flex-col items-center justify-center gap-3 text-center text-muted-foreground", children: [_jsx(Sparkles, { className: "h-8 w-8 opacity-40" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-foreground", children: "Design Advisor" }), _jsx("p", { className: "mt-1 text-xs", children: "Ask Charlotte for design advice, layout suggestions, or accessibility improvements." })] }), _jsx("div", { className: "mt-2 flex flex-wrap justify-center gap-1.5", children: SUGGESTED_PROMPTS.map((s) => (_jsx("button", { className: "rounded-full border bg-background px-2.5 py-1 text-xs transition-colors hover:bg-accent", onClick: () => sendMessage(s), children: s }, s))) })] })) : (_jsxs("div", { className: "flex flex-col gap-3", children: [messages.map((msg) => (_jsx("div", { className: cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start'), children: _jsxs("div", { className: cn('max-w-[85%] rounded-lg px-3 py-2 text-sm', msg.role === 'user'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-background border'), children: [_jsx("div", { className: "whitespace-pre-wrap", children: msg.content }), msg.generatedCode && (_jsxs("div", { className: "mt-2 space-y-2", children: [_jsx("div", { className: "overflow-hidden rounded border bg-white", children: msg.generatedPreviewUrl ? (_jsx("img", { src: msg.generatedPreviewUrl, alt: "Preview", className: "w-full" })) : (_jsx("iframe", { srcDoc: msg.generatedCode, title: "Preview", className: "h-40 w-full border-0", sandbox: "allow-scripts" })) }), _jsxs("div", { className: "flex gap-1", children: [_jsxs(Button, { variant: "ghost", size: "sm", className: "h-6 text-xs", onClick: () => onImportCode?.(msg.generatedCode), children: [_jsx(Download, { className: "mr-1 h-3 w-3" }), "Import"] }), _jsxs(Button, { variant: "ghost", size: "sm", className: "h-6 text-xs", onClick: () => navigator.clipboard.writeText(msg.generatedCode), children: [_jsx(Code, { className: "mr-1 h-3 w-3" }), "Copy"] })] })] })), msg.suggestions && msg.suggestions.length > 0 && (_jsx("div", { className: "mt-2 flex flex-wrap gap-1", children: msg.suggestions.map((s, i) => (_jsx("button", { className: "rounded-full border bg-muted/50 px-2 py-0.5 text-xs transition-colors hover:bg-accent", onClick: () => sendMessage(s), children: s }, i))) }))] }) }, msg.id))), isLoading && (_jsx("div", { className: "flex justify-start", children: _jsxs("div", { className: "flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground", children: [_jsx(Loader2, { className: "h-3.5 w-3.5 animate-spin" }), "Charlotte is thinking..."] }) })), _jsx("div", { ref: messagesEndRef })] })) }), _jsxs("form", { onSubmit: handleSubmit, className: "flex gap-2", children: [_jsx(Input, { placeholder: "Ask Charlotte for design advice...", value: input, onChange: (e) => setInput(e.target.value), disabled: isLoading, className: "flex-1" }), _jsx(Button, { type: "submit", size: "icon", disabled: isLoading || !input.trim(), children: isLoading ? (_jsx(Loader2, { className: "h-4 w-4 animate-spin" })) : (_jsx(Send, { className: "h-4 w-4" })) })] })] }))] }));
}
//# sourceMappingURL=DesignAdvisor.js.map