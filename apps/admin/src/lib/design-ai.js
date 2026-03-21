/**
 * Design AI API client — Stitch generation + Charlotte advisor.
 */
import { api } from './api';
// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------
const basePath = (siteId) => `/sites/${siteId}/design`;
export const designAi = {
    /** Generate a new design from a text prompt. */
    generate(siteId, prompt, deviceType = 'DESKTOP', pageId) {
        return api.post(`${basePath(siteId)}/generate`, { prompt, deviceType, pageId });
    },
    /** Edit an existing Stitch screen with a follow-up prompt. */
    edit(siteId, screenId, prompt) {
        return api.post(`${basePath(siteId)}/edit`, { screenId, prompt });
    },
    /** Generate design variants from an existing screen. */
    variants(siteId, screenId, count = 3) {
        return api.post(`${basePath(siteId)}/variants`, { screenId, count });
    },
    /** Import a Stitch screen as Sigil content blocks. */
    importToPage(siteId, screenId, pageId) {
        return api.post(`${basePath(siteId)}/import`, { screenId, pageId });
    },
    /** Ask Charlotte for design advice. */
    advisor(siteId, question, context) {
        return api.post(`${basePath(siteId)}/advisor`, { question, context });
    },
};
//# sourceMappingURL=design-ai.js.map