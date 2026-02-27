import { useEffect, useRef } from 'react';
import { MessageBubble, type ChatMessage } from './MessageBubble';
import { MessageSquare } from 'lucide-react';

interface Props {
  messages: ChatMessage[];
  onSpeak?: (text: string) => void;
}

export function ChatPanel({ messages, onSpeak }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, messages[messages.length - 1]?.content]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-muted-foreground">
        <MessageSquare className="h-12 w-12 opacity-30" />
        <div className="text-center">
          <p className="text-lg font-medium text-foreground">AI Advisor</p>
          <p className="mt-1 text-sm">
            Get criticism and advice on your content, marketing plans, and business documents.
          </p>
          <p className="mt-3 text-xs">
            Upload documents for grounded feedback, or just start chatting.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} onSpeak={onSpeak} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
