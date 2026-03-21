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
export declare function usePreviewChannel(): {
    iframeRef: import("react").MutableRefObject<HTMLIFrameElement | null>;
    sendUpdate: (page: PreviewMessage["payload"]["page"], blocks: PreviewMessage["payload"]["blocks"]) => void;
};
/**
 * Hook that debounces a callback by the given delay.
 * Used to avoid flooding the iframe with messages on every keystroke.
 */
export declare function useDebouncedCallback<T extends (...args: any[]) => void>(callback: T, delay: number): T;
//# sourceMappingURL=usePreviewChannel.d.ts.map