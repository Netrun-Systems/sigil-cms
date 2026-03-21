/**
 * Design Advisor Widget — Charlotte AI chat for the Design Playground sidebar.
 *
 * Chat-style interface pre-loaded with context (current theme tokens, active
 * page, block types). Responses include text advice and optionally generated
 * Stitch previews.
 */
import type { ThemeTokens } from '@netrun-cms/core';
interface Props {
    siteId: string;
    themeTokens?: ThemeTokens;
    siteName?: string;
    /** Called when the advisor generates a design the user wants to import. */
    onImportCode?: (code: string) => void;
}
export declare function DesignAdvisor({ siteId, themeTokens, siteName, onImportCode }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=DesignAdvisor.d.ts.map