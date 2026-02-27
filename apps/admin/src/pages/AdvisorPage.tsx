import { useState, useCallback, useRef } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button, Card } from '@netrun-cms/ui';
import { ChatPanel } from '../components/advisor/ChatPanel';
import { ChatInput } from '../components/advisor/ChatInput';
import { VoiceControls } from '../components/advisor/VoiceControls';
import { DocumentManager } from '../components/advisor/DocumentManager';
import { type ChatMessage } from '../components/advisor/MessageBubble';
import { streamChat, generateSpeech, type DocumentInfo } from '../lib/advisor';

let messageCounter = 0;
function nextId() {
  return `msg-${++messageCounter}-${Date.now()}`;
}

export function AdvisorPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [transcript, setTranscript] = useState<string>();
  const [autoPlay, setAutoPlay] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const sessionIdRef = useRef(`session-${Date.now()}`);

  const handleSend = useCallback(async (text: string) => {
    if (isStreaming) return;

    const userMsg: ChatMessage = { id: nextId(), role: 'user', content: text };
    const assistantMsg: ChatMessage = { id: nextId(), role: 'assistant', content: '', isStreaming: true };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);
    setTranscript(undefined);

    try {
      const docIds = documents.map((d) => d.name);
      let fullText = '';

      for await (const chunk of streamChat(text, sessionIdRef.current, docIds)) {
        fullText += chunk;
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: fullText } : m)),
        );
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id ? { ...m, content: fullText, isStreaming: false } : m,
        ),
      );

      if (autoPlay && fullText) {
        try {
          const blob = await generateSpeech(fullText.slice(0, 4000));
          setAudioBlob(blob);
        } catch {
          // TTS failure is non-critical
        }
      }
    } catch (err) {
      const errorText = err instanceof Error ? err.message : 'Something went wrong';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, content: `**Error:** ${errorText}`, isStreaming: false }
            : m,
        ),
      );
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming, documents, autoPlay]);

  const handleSpeak = useCallback(async (text: string) => {
    try {
      const blob = await generateSpeech(text.slice(0, 4000));
      setAudioBlob(blob);
    } catch {
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

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Advisor</h1>
          <p className="text-sm text-muted-foreground">
            Upload documents and get expert content &amp; business advice
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleNewChat}>
          <RotateCcw className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Chat card */}
      <Card className="flex flex-1 flex-col overflow-hidden">
        {/* Document Manager */}
        <DocumentManager
          documents={documents}
          sessionId={sessionIdRef.current}
          onDocumentsChange={setDocuments}
        />

        {/* Chat area */}
        <ChatPanel messages={messages} onSpeak={handleSpeak} />

        {/* Input bar with voice controls */}
        <div className="flex items-end gap-2 border-t border-border bg-background">
          <div className="flex-1">
            <ChatInput onSend={handleSend} disabled={isStreaming} transcript={transcript} />
          </div>
          <div className="pb-4 pr-4">
            <VoiceControls
              onTranscript={setTranscript}
              audioBlob={audioBlob}
              autoPlay={autoPlay}
              onAutoPlayToggle={setAutoPlay}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
