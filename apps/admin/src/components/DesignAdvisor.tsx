/**
 * Design Advisor Widget — Charlotte AI chat for the Design Playground sidebar.
 *
 * Chat-style interface pre-loaded with context (current theme tokens, active
 * page, block types). Responses include text advice and optionally generated
 * Stitch previews.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Send,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Code,
  Download,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  cn,
} from '@netrun-cms/ui';
import type { ThemeTokens } from '@netrun-cms/core';
import { designAi, type AdvisorContext, type AdvisorResult } from '../lib/design-ai';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  siteId: string;
  themeTokens?: ThemeTokens;
  siteName?: string;
  /** Called when the advisor generates a design the user wants to import. */
  onImportCode?: (code: string) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
  generatedCode?: string;
  generatedPreviewUrl?: string;
  timestamp: number;
}

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

export function DesignAdvisor({ siteId, themeTokens, siteName, onImportCode }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send message ────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text.trim(),
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsLoading(true);

      try {
        const context: AdvisorContext = {
          themeTokens: themeTokens as unknown as Record<string, unknown>,
          siteName,
        };

        const res = await designAi.advisor(siteId, text.trim(), context);
        const data: AdvisorResult = res.data;

        const assistantMsg: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.answer,
          suggestions: data.suggestions,
          generatedCode: data.generatedCode,
          generatedPreviewUrl: data.generatedPreviewUrl,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        const errorMsg: Message = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [siteId, themeTokens, siteName, isLoading]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            <div>
              <CardTitle className="text-base">Charlotte Design Advisor</CardTitle>
              <CardDescription>AI-powered design advice for your site</CardDescription>
            </div>
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-3">
          {/* Messages area */}
          <div className="flex h-[360px] flex-col overflow-y-auto rounded-lg border bg-muted/30 p-3">
            {messages.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                <Sparkles className="h-8 w-8 opacity-40" />
                <div>
                  <p className="text-sm font-medium text-foreground">Design Advisor</p>
                  <p className="mt-1 text-xs">
                    Ask Charlotte for design advice, layout suggestions, or accessibility improvements.
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                  {SUGGESTED_PROMPTS.map((s) => (
                    <button
                      key={s}
                      className="rounded-full border bg-background px-2.5 py-1 text-xs transition-colors hover:bg-accent"
                      onClick={() => sendMessage(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    <div
                      className={cn(
                        'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background border'
                      )}
                    >
                      {/* Message text */}
                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {/* Generated preview */}
                      {msg.generatedCode && (
                        <div className="mt-2 space-y-2">
                          <div className="overflow-hidden rounded border bg-white">
                            {msg.generatedPreviewUrl ? (
                              <img src={msg.generatedPreviewUrl} alt="Preview" className="w-full" />
                            ) : (
                              <iframe
                                srcDoc={msg.generatedCode}
                                title="Preview"
                                className="h-40 w-full border-0"
                                sandbox="allow-scripts"
                              />
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => onImportCode?.(msg.generatedCode!)}
                            >
                              <Download className="mr-1 h-3 w-3" />
                              Import
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => navigator.clipboard.writeText(msg.generatedCode!)}
                            >
                              <Code className="mr-1 h-3 w-3" />
                              Copy
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Suggestions */}
                      {msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {msg.suggestions.map((s, i) => (
                            <button
                              key={i}
                              className="rounded-full border bg-muted/50 px-2 py-0.5 text-xs transition-colors hover:bg-accent"
                              onClick={() => sendMessage(s)}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Charlotte is thinking...
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              placeholder="Ask Charlotte for design advice..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  );
}
