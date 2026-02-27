import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { MessageSquare } from 'lucide-react';
export function ChatPanel({ messages, onSpeak }) {
    const bottomRef = useRef(null);
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, messages[messages.length - 1]?.content]);
    if (messages.length === 0) {
        return (_jsxs("div", { className: "flex flex-1 flex-col items-center justify-center gap-4 text-muted-foreground", children: [_jsx(MessageSquare, { className: "h-12 w-12 opacity-30" }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-lg font-medium text-foreground", children: "AI Advisor" }), _jsx("p", { className: "mt-1 text-sm", children: "Get criticism and advice on your content, marketing plans, and business documents." }), _jsx("p", { className: "mt-3 text-xs", children: "Upload documents for grounded feedback, or just start chatting." })] })] }));
    }
    return (_jsxs("div", { className: "flex flex-1 flex-col gap-4 overflow-y-auto p-4", children: [messages.map((msg) => (_jsx(MessageBubble, { message: msg, onSpeak: onSpeak }, msg.id))), _jsx("div", { ref: bottomRef })] }));
}
//# sourceMappingURL=ChatPanel.js.map