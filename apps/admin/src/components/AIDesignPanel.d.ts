/**
 * AI Design Panel — Stitch-powered design generation for the Design Playground.
 *
 * Provides a text prompt input, device selector, preview area, edit/variant
 * generation, and import-to-page flow. Rendered as a collapsible panel
 * inside the Theme Editor.
 */
interface Props {
    siteId: string;
    /** Called when blocks are imported — parent can add them to the page. */
    onImport?: (blocks: Array<{
        blockType: string;
        content: Record<string, unknown>;
        sortOrder: number;
    }>) => void;
}
export declare function AIDesignPanel({ siteId, onImport }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=AIDesignPanel.d.ts.map