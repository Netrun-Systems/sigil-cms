/**
 * TextBlock - Rich text content block with markdown support
 *
 * Supports plain text, markdown, and HTML formats.
 * HTML content is sanitized using DOMPurify for XSS protection.
 * Includes edit mode with live preview.
 *
 * @module @netrun-cms/blocks
 * @author Netrun Systems
 */

import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import DOMPurify from 'dompurify';
import type { TextBlockContent } from '@netrun-cms/core';
import { cn, getBlockSettingsClasses, type BaseBlockProps } from '../utils';

export interface TextBlockProps extends BaseBlockProps<TextBlockContent> {
  /** Maximum width constraint */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

/**
 * TextBlock component - displays rich text content with markdown support
 */
export const TextBlock: React.FC<TextBlockProps> = ({
  content,
  settings,
  mode = 'view',
  className,
  onContentChange,
  maxWidth = 'lg',
}) => {
  const { body, format = 'markdown' } = content;
  const [showPreview, setShowPreview] = useState(false);

  const maxWidthClasses: Record<string, string> = {
    sm: 'max-w-2xl',
    md: 'max-w-3xl',
    lg: 'max-w-4xl',
    xl: 'max-w-5xl',
    full: 'max-w-none',
  };

  // Sanitize HTML content for XSS protection
  const sanitizedHtml = useMemo(() => {
    if (format === 'html') {
      return DOMPurify.sanitize(body, {
        ALLOWED_TAGS: [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'p', 'br', 'hr',
          'ul', 'ol', 'li',
          'a', 'strong', 'em', 'b', 'i', 'u', 's',
          'blockquote', 'pre', 'code',
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'img', 'figure', 'figcaption',
          'div', 'span',
        ],
        ALLOWED_ATTR: [
          'href', 'target', 'rel', 'src', 'alt', 'title',
          'class', 'id', 'style', 'width', 'height',
        ],
        ALLOW_DATA_ATTR: false,
      });
    }
    return '';
  }, [body, format]);

  const renderContent = () => {
    switch (format) {
      case 'html':
        return (
          <div
            className="prose prose-lg max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
        );
      case 'markdown':
        return (
          <ReactMarkdown
            className="prose prose-lg max-w-none dark:prose-invert
              prose-headings:font-[var(--netrun-font-family-heading)]
              prose-headings:text-[var(--netrun-text)]
              prose-p:text-[var(--netrun-text-secondary)]
              prose-a:text-[var(--netrun-primary)]
              prose-strong:text-[var(--netrun-text)]
              prose-code:text-[var(--netrun-primary)]
              prose-code:bg-[var(--netrun-surface)]
              prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-[var(--netrun-surface)]
              prose-blockquote:border-[var(--netrun-primary)]"
          >
            {body}
          </ReactMarkdown>
        );
      case 'plain':
      default:
        return (
          <div className="text-[var(--netrun-text)] whitespace-pre-wrap leading-relaxed">
            {body}
          </div>
        );
    }
  };

  if (mode === 'edit') {
    return (
      <section
        className={cn(
          getBlockSettingsClasses(settings),
          className
        )}
      >
        <div className={cn('mx-auto', maxWidthClasses[maxWidth])}>
          {/* Format selector */}
          <div className="flex items-center gap-4 mb-4">
            <label className="text-sm font-medium text-[var(--netrun-text-secondary)]">
              Format:
            </label>
            <select
              value={format}
              onChange={(e) =>
                onContentChange?.({
                  ...content,
                  format: e.target.value as TextBlockContent['format'],
                })
              }
              className="px-3 py-1.5 rounded-md bg-[var(--netrun-surface)] border border-[var(--netrun-primary)]/20 text-[var(--netrun-text)] text-sm"
            >
              <option value="plain">Plain Text</option>
              <option value="markdown">Markdown</option>
              <option value="html">HTML</option>
            </select>

            {format === 'markdown' && (
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm transition-colors',
                  showPreview
                    ? 'bg-[var(--netrun-primary)] text-[var(--netrun-background)]'
                    : 'bg-[var(--netrun-surface)] text-[var(--netrun-text)]'
                )}
              >
                {showPreview ? 'Edit' : 'Preview'}
              </button>
            )}
          </div>

          {/* Editor or Preview */}
          {showPreview && format === 'markdown' ? (
            <div className="min-h-[200px] p-4 rounded-lg bg-[var(--netrun-surface)] border border-[var(--netrun-primary)]/20">
              {renderContent()}
            </div>
          ) : (
            <textarea
              value={body}
              onChange={(e) =>
                onContentChange?.({ ...content, body: e.target.value })
              }
              className={cn(
                'w-full min-h-[200px] p-4 rounded-lg resize-y',
                'bg-[var(--netrun-surface)] border border-[var(--netrun-primary)]/20',
                'text-[var(--netrun-text)] placeholder:text-[var(--netrun-text-secondary)]/50',
                'focus:outline-none focus:border-[var(--netrun-primary)]',
                'font-mono text-sm leading-relaxed'
              )}
              placeholder={
                format === 'markdown'
                  ? '# Heading\n\nWrite your content using **Markdown** syntax...'
                  : format === 'html'
                  ? '<p>Write your HTML content here...</p>'
                  : 'Write your content here...'
              }
            />
          )}
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        getBlockSettingsClasses(settings),
        className
      )}
    >
      <div className={cn('mx-auto', maxWidthClasses[maxWidth])}>
        {renderContent()}
      </div>
    </section>
  );
};

export default TextBlock;
