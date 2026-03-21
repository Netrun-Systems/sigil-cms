import { useCallback, useRef, useEffect } from 'react';
/**
 * Hook that manages the postMessage channel between the admin editor
 * and an iframe running the consumer frontend.
 */
export function usePreviewChannel() {
    const iframeRef = useRef(null);
    const lastMessageRef = useRef('');
    const sendUpdate = useCallback((page, blocks) => {
        const iframe = iframeRef.current;
        if (!iframe?.contentWindow)
            return;
        const message = {
            type: 'sigil-cms:content-update',
            payload: {
                page,
                blocks,
                timestamp: new Date().toISOString(),
            },
        };
        // Deduplicate — don't send if content hasn't changed
        const serialized = JSON.stringify(message.payload);
        if (serialized === lastMessageRef.current)
            return;
        lastMessageRef.current = serialized;
        iframe.contentWindow.postMessage(message, '*');
    }, []);
    return { iframeRef, sendUpdate };
}
/**
 * Hook that debounces a callback by the given delay.
 * Used to avoid flooding the iframe with messages on every keystroke.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebouncedCallback(callback, delay) {
    const timeoutRef = useRef(null);
    useEffect(() => {
        return () => {
            if (timeoutRef.current)
                clearTimeout(timeoutRef.current);
        };
    }, []);
    const debounced = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (...args) => {
        if (timeoutRef.current)
            clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => callback(...args), delay);
    }, [callback, delay]);
    return debounced;
}
//# sourceMappingURL=usePreviewChannel.js.map