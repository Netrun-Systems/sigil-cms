/**
 * FontBrowser — Search and preview Google Fonts + upload custom fonts
 *
 * Two modes:
 * 1. Google Fonts: Searches a curated list of 200+ popular fonts, loads them
 *    via the Google Fonts CSS API for instant preview, no API key required.
 * 2. Custom Upload: Upload .woff2/.woff/.ttf/.otf files, generates @font-face rules.
 */
interface GoogleFont {
    family: string;
    category: 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace';
    variants: string[];
}
declare const GOOGLE_FONTS: GoogleFont[];
declare function loadGoogleFont(family: string, weights?: string[]): void;
export interface CustomFont {
    name: string;
    fileName: string;
    url: string;
    format: 'woff2' | 'woff' | 'truetype' | 'opentype';
    weight: string;
    style: string;
}
declare function generateFontFaceCss(fonts: CustomFont[]): string;
interface FontBrowserProps {
    /** Currently selected font family */
    currentFont: string;
    /** Called when user selects a font */
    onSelect: (fontFamily: string, source: 'google' | 'local' | 'custom') => void;
    /** Called when custom fonts are uploaded (provides @font-face CSS) */
    onCustomFontsChange?: (fonts: CustomFont[], css: string) => void;
    /** Custom fonts already uploaded */
    customFonts?: CustomFont[];
    /** Label for the font role (e.g., "Body Font", "Heading Font") */
    label?: string;
}
export declare function FontBrowser({ currentFont, onSelect, onCustomFontsChange, customFonts, label, }: FontBrowserProps): import("react/jsx-runtime").JSX.Element;
export { generateFontFaceCss, loadGoogleFont, GOOGLE_FONTS };
//# sourceMappingURL=FontBrowser.d.ts.map