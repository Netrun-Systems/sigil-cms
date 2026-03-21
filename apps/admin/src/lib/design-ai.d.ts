/**
 * Design AI API client — Stitch generation + Charlotte advisor.
 */
export type DeviceType = 'DESKTOP' | 'MOBILE' | 'TABLET';
export interface GenerateResult {
    screenId: string;
    previewUrl: string;
    code: string;
    suggestions: string[];
    mock: boolean;
}
export interface EditResult {
    screenId: string;
    previewUrl: string;
    code: string;
}
export interface VariantResult {
    variants: Array<{
        screenId: string;
        previewUrl: string;
        code: string;
    }>;
}
export interface ImportResult {
    blocks: Array<{
        blockType: string;
        content: Record<string, unknown>;
        sortOrder: number;
    }>;
    pageId: string;
    totalBlocks: number;
}
export interface AdvisorContext {
    pageId?: string;
    blockId?: string;
    themeTokens?: Record<string, unknown>;
    pageBlocks?: Array<{
        blockType: string;
        content: Record<string, unknown>;
    }>;
    siteName?: string;
}
export interface AdvisorResult {
    answer: string;
    suggestions?: string[];
    generatedScreenId?: string;
    generatedPreviewUrl?: string;
    generatedCode?: string;
}
export declare const designAi: {
    /** Generate a new design from a text prompt. */
    generate(siteId: string, prompt: string, deviceType?: DeviceType, pageId?: string): Promise<{
        data: GenerateResult;
    }>;
    /** Edit an existing Stitch screen with a follow-up prompt. */
    edit(siteId: string, screenId: string, prompt: string): Promise<{
        data: EditResult;
    }>;
    /** Generate design variants from an existing screen. */
    variants(siteId: string, screenId: string, count?: number): Promise<{
        data: VariantResult;
    }>;
    /** Import a Stitch screen as Sigil content blocks. */
    importToPage(siteId: string, screenId: string, pageId: string): Promise<{
        data: ImportResult;
    }>;
    /** Ask Charlotte for design advice. */
    advisor(siteId: string, question: string, context?: AdvisorContext): Promise<{
        data: AdvisorResult;
    }>;
};
//# sourceMappingURL=design-ai.d.ts.map