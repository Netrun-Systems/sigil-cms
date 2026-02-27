import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback, useRef } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button, Card } from '@netrun-cms/ui';
import { ChatPanel } from '../components/advisor/ChatPanel';
import { ChatInput } from '../components/advisor/ChatInput';
import { VoiceControls } from '../components/advisor/VoiceControls';
import { DocumentManager } from '../components/advisor/DocumentManager';
import { streamChat, generateSpeech } from '../lib/advisor';
let messageCounter = 0;
function nextId() {
    return `msg-${++messageCounter}-${Date.now()}`;
}
export function AdvisorPage() {
    const [messages, setMessages] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [transcript, setTranscript] = useState();
    const [autoPlay, setAutoPlay] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const sessionIdRef = useRef(`session-${Date.now()}`);
    const handleSend = useCallback(async (text) => {
        if (isStreaming)
            return;
        const userMsg = { id: nextId(), role: 'user', content: text };
        const assistantMsg = { id: nextId(), role: 'assistant', content: '', isStreaming: true };
        setMessages((prev) => [...prev, userMsg, assistantMsg]);
        setIsStreaming(true);
        setTranscript(undefined);
        try {
            const docIds = documents.map((d) => d.name);
            let fullText = '';
            for await (const chunk of streamChat(text, sessionIdRef.current, docIds)) {
                fullText += chunk;
                setMessages((prev) => prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: fullText } : m)));
            }
            setMessages((prev) => prev.map((m) => m.id === assistantMsg.id ? { ...m, content: fullText, isStreaming: false } : m));
            if (autoPlay && fullText) {
                try {
                    const blob = await generateSpeech(fullText.slice(0, 4000));
                    setAudioBlob(blob);
                }
                catch {
                    // TTS failure is non-critical
                }
            }
        }
        catch (err) {
            const errorText = err instanceof Error ? err.message : 'Something went wrong';
            setMessages((prev) => prev.map((m) => m.id === assistantMsg.id
                ? { ...m, content: `**Error:** ${errorText}`, isStreaming: false }
                : m));
        }
        finally {
            setIsStreaming(false);
        }
    }, [isStreaming, documents, autoPlay]);
    const handleSpeak = useCallback(async (text) => {
        try {
            const blob = await generateSpeech(text.slice(0, 4000));
            setAudioBlob(blob);
        }
        catch {
            // TTS failure is non-critical
        }
    }, []);
    const handleNewChat = () => {
        setMessages([]);
        setDocuments([]);
        setAudioBlob(null);
        sessionIdRef.current = `session-${Date.now()}`;
        messageCounter = 0;
    };
    return (_jsxs("div", { className: "flex h-[calc(100vh-7rem)] flex-col", children: [_jsxs("div", { className: "flex items-center justify-between pb-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-foreground", children: "AI Advisor" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Upload documents and get expert content & business advice" })] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: handleNewChat, children: [_jsx(RotateCcw, { className: "mr-2 h-4 w-4" }), "New Chat"] })] }), _jsxs(Card, { className: "flex flex-1 flex-col overflow-hidden", children: [_jsx(DocumentManager, { documents: documents, sessionId: sessionIdRef.current, onDocumentsChange: setDocuments }), _jsx(ChatPanel, { messages: messages, onSpeak: handleSpeak }), _jsxs("div", { className: "flex items-end gap-2 border-t border-border bg-background", children: [_jsx("div", { className: "flex-1", children: _jsx(ChatInput, { onSend: handleSend, disabled: isStreaming, transcript: transcript }) }), _jsx("div", { className: "pb-4 pr-4", children: _jsx(VoiceControls, { onTranscript: setTranscript, audioBlob: audioBlob, autoPlay: autoPlay, onAutoPlayToggle: setAutoPlay }) })] })] })] }));
}
//# sourceMappingURL=AdvisorPage.js.map