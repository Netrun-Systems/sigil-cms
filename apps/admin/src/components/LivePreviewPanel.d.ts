export type ViewportSize = 'desktop' | 'tablet' | 'mobile';
export type PreviewMode = 'edit' | 'split' | 'preview';
interface LivePreviewPanelProps {
    /** Ref forwarded to the iframe element so the parent can postMessage */
    iframeRef: React.RefObject<HTMLIFrameElement | null>;
    /** Full preview URL (e.g. http://localhost:3000/preview/about?token=xxx) */
    previewUrl: string | null;
    /** Current viewport selection */
    viewport: ViewportSize;
    onViewportChange: (v: ViewportSize) => void;
    /** Whether the iframe has acknowledged a connection (future use) */
    isConnected?: boolean;
}
export declare function LivePreviewPanel({ iframeRef, previewUrl, viewport, onViewportChange, isConnected, }: LivePreviewPanelProps): import("react/jsx-runtime").JSX.Element;
interface PreviewModeToggleProps {
    mode: PreviewMode;
    onChange: (mode: PreviewMode) => void;
}
export declare function PreviewModeToggle({ mode, onChange }: PreviewModeToggleProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=LivePreviewPanel.d.ts.map