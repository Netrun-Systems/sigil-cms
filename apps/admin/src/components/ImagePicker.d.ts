/**
 * ImagePicker — Modal dialog for browsing and selecting stock images from
 * Unsplash, Pexels, and Pixabay.
 *
 * Usage:
 *   <ImagePicker
 *     open={open}
 *     onOpenChange={setOpen}
 *     onSelect={(image) => handleImageSelected(image)}
 *     defaultQuery="restaurant interior"
 *     vertical="restaurant"
 *   />
 */
import { type StockImage } from '../lib/stock-image-api';
export interface ImagePickerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (image: StockImage) => void;
    /** Pre-fill the search box — use block context, e.g. 'hero background' */
    defaultQuery?: string;
    /** Vertical key for curated suggestions (e.g. 'restaurant', 'saas') */
    vertical?: string;
}
export type { StockImage };
export declare function ImagePicker({ open, onOpenChange, onSelect, defaultQuery, vertical, }: ImagePickerProps): import("react/jsx-runtime").JSX.Element;
export default ImagePicker;
//# sourceMappingURL=ImagePicker.d.ts.map