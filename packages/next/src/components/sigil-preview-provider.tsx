'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { ContentBlock } from '@sigil-cms/client';

/* ------------------------------------------------------------------ */
/*  postMessage protocol (must match admin's usePreviewChannel.ts)    */
/* ------------------------------------------------------------------ */

interface PreviewMessage {
  type: 'sigil-cms:content-update';
  payload: {
    page: {
      title: string;
      slug: string;
      template: string;
      status: string;
    };
    blocks: Array<{
      id: string;
      type: string;
      content: Record<string, unknown>;
      isVisible: boolean;
    }>;
    timestamp: string;
  };
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

interface PreviewContextValue {
  /** Whether live preview mode is active (URL has ?preview=true) */
  isPreview: boolean;
  /** Live page metadata from the admin editor (null if no update received yet) */
  page: PreviewMessage['payload']['page'] | null;
  /** Live block list from the admin editor (null if no update received yet) */
  blocks: ContentBlock[] | null;
  /** ISO-8601 timestamp of the last received update */
  lastUpdate: string | null;
}

const PreviewContext = createContext<PreviewContextValue>({
  isPreview: false,
  page: null,
  blocks: null,
  lastUpdate: null,
});

/**
 * Hook to consume live preview data inside block components.
 *
 * @example
 * ```tsx
 * const { isPreview, blocks } = useSigilPreview();
 * const renderBlocks = isPreview && blocks ? blocks : serverBlocks;
 * ```
 */
export function useSigilPreview() {
  return useContext(PreviewContext);
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export interface SigilPreviewProviderProps {
  children: ReactNode;
  /**
   * Allowed origin(s) for postMessage.  Defaults to `'*'` during
   * development but should be set to the admin panel's origin in
   * production for security.
   */
  allowedOrigins?: string[];
}

/**
 * Wrap your Next.js layout with `<SigilPreviewProvider>` to enable
 * live preview from the Sigil CMS admin panel.
 *
 * When the page is loaded inside the admin's preview iframe (URL
 * contains `?preview=true`), this provider listens for `postMessage`
 * events from the admin editor and exposes the latest draft content
 * via the `useSigilPreview()` hook.
 *
 * @example
 * ```tsx
 * // app/layout.tsx
 * import { SigilPreviewProvider } from '@sigil-cms/next';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <SigilPreviewProvider>
 *           {children}
 *         </SigilPreviewProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function SigilPreviewProvider({
  children,
  allowedOrigins,
}: SigilPreviewProviderProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [page, setPage] = useState<PreviewMessage['payload']['page'] | null>(null);
  const [blocks, setBlocks] = useState<ContentBlock[] | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  // Detect preview mode from URL on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setIsPreview(params.get('preview') === 'true');
  }, []);

  // Listen for postMessage from the admin iframe parent
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      // Origin check
      if (
        allowedOrigins &&
        allowedOrigins.length > 0 &&
        !allowedOrigins.includes(event.origin)
      ) {
        return;
      }

      const data = event.data as PreviewMessage;
      if (data?.type !== 'sigil-cms:content-update') return;

      const { payload } = data;
      setPage(payload.page);
      setBlocks(
        payload.blocks
          .filter((b) => b.isVisible)
          .map((b) => ({
            id: b.id,
            blockType: b.type,
            content: b.content,
            sortOrder: 0,
            isVisible: true,
          })) as unknown as ContentBlock[],
      );
      setLastUpdate(payload.timestamp);
    },
    [allowedOrigins],
  );

  useEffect(() => {
    if (!isPreview) return;
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isPreview, handleMessage]);

  return (
    <PreviewContext.Provider value={{ isPreview, page, blocks, lastUpdate }}>
      {children}
    </PreviewContext.Provider>
  );
}
