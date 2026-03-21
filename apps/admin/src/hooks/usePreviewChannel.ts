import { useCallback, useRef, useEffect } from 'react';

/**
 * postMessage protocol for Sigil CMS live preview.
 *
 * The admin sends messages of type "sigil-cms:content-update" to the
 * iframe.  The iframe's SigilPreviewProvider listens for these and
 * re-renders blocks without a full page reload.
 */

export interface PreviewMessage {
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
    /** ISO-8601 timestamp of when the update was sent */
    timestamp: string;
  };
}

/**
 * Hook that manages the postMessage channel between the admin editor
 * and an iframe running the consumer frontend.
 */
export function usePreviewChannel() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const lastMessageRef = useRef<string>('');

  const sendUpdate = useCallback(
    (
      page: PreviewMessage['payload']['page'],
      blocks: PreviewMessage['payload']['blocks'],
    ) => {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) return;

      const message: PreviewMessage = {
        type: 'sigil-cms:content-update',
        payload: {
          page,
          blocks,
          timestamp: new Date().toISOString(),
        },
      };

      // Deduplicate — don't send if content hasn't changed
      const serialized = JSON.stringify(message.payload);
      if (serialized === lastMessageRef.current) return;
      lastMessageRef.current = serialized;

      iframe.contentWindow.postMessage(message, '*');
    },
    [],
  );

  return { iframeRef, sendUpdate };
}

/**
 * Hook that debounces a callback by the given delay.
 * Used to avoid flooding the iframe with messages on every keystroke.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number,
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const debounced = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (...args: any[]) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    },
    [callback, delay],
  ) as T;

  return debounced;
}
