import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * BlockContentEditor - Type-specific form fields for editing block content
 *
 * Renders appropriate inputs based on block type (hero, text, cta, etc.)
 * with a JSON fallback editor for unknown/custom block types.
 */
import { useState } from 'react';
import { Input, Label, Textarea, Button, Separator, } from '@netrun-cms/ui';
import { Plus, Trash2, X, Image, Star, Check } from 'lucide-react';
import { ImagePicker } from './ImagePicker';
/** Helper: update a single field in content */
function updateField(content, field, value, onChange) {
    onChange({ ...content, [field]: value });
}
/** Reusable labeled input */
function FieldInput({ label, value, onChange, placeholder, type = 'text', }) {
    return (_jsxs("div", { className: "space-y-1.5", children: [_jsx(Label, { className: "text-sm", children: label }), _jsx(Input, { type: type, value: value, onChange: (e) => onChange(e.target.value), placeholder: placeholder })] }));
}
/** Reusable labeled textarea */
function FieldTextarea({ label, value, onChange, placeholder, rows = 4, }) {
    return (_jsxs("div", { className: "space-y-1.5", children: [_jsx(Label, { className: "text-sm", children: label }), _jsx(Textarea, { value: value, onChange: (e) => onChange(e.target.value), placeholder: placeholder, rows: rows })] }));
}
/**
 * ImageUrlInput — a labeled URL input with a "Browse Stock Images" button.
 * Replaces bare FieldInput for image URL fields.
 */
function ImageUrlInput({ label, value, onChange, placeholder, defaultQuery, vertical, }) {
    const [pickerOpen, setPickerOpen] = useState(false);
    const handleSelect = (image) => {
        onChange(image.url);
    };
    return (_jsxs("div", { className: "space-y-1.5", children: [_jsx(Label, { className: "text-sm", children: label }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Input, { type: "text", value: value, onChange: (e) => onChange(e.target.value), placeholder: placeholder, className: "flex-1" }), _jsx(Button, { variant: "outline", size: "icon", className: "h-9 w-9 shrink-0", title: "Browse stock images", onClick: () => setPickerOpen(true), type: "button", children: _jsx(Image, { className: "h-4 w-4" }) })] }), _jsx(ImagePicker, { open: pickerOpen, onOpenChange: setPickerOpen, onSelect: handleSelect, defaultQuery: defaultQuery, vertical: vertical })] }));
}
/** Hero block editor */
function HeroEditor({ content, onChange }) {
    return (_jsxs("div", { className: "space-y-3", children: [_jsx(FieldInput, { label: "Headline", value: content.headline || '', onChange: (v) => updateField(content, 'headline', v, onChange), placeholder: "Main heading text" }), _jsx(FieldInput, { label: "Subheadline", value: content.subheadline || '', onChange: (v) => updateField(content, 'subheadline', v, onChange), placeholder: "Supporting text" }), _jsx(ImageUrlInput, { label: "Background Image URL", value: content.backgroundImage || '', onChange: (v) => updateField(content, 'backgroundImage', v, onChange), placeholder: "https://example.com/image.jpg", defaultQuery: "hero background" }), _jsx(Separator, {}), _jsx(FieldInput, { label: "CTA Text", value: content.ctaText || '', onChange: (v) => updateField(content, 'ctaText', v, onChange), placeholder: "Get Started" }), _jsx(FieldInput, { label: "CTA Link", value: content.ctaLink || '', onChange: (v) => updateField(content, 'ctaLink', v, onChange), placeholder: "/contact" })] }));
}
/** Text / Rich Text block editor */
function TextEditor({ content, onChange }) {
    return (_jsx("div", { className: "space-y-3", children: _jsx(FieldTextarea, { label: "Content", value: content.body || content.content || '', onChange: (v) => {
                // Use whichever key already exists, default to 'body'
                const key = 'content' in content ? 'content' : 'body';
                updateField(content, key, v, onChange);
            }, placeholder: "Enter text or markdown content...", rows: 8 }) }));
}
/** CTA block editor */
function CtaEditor({ content, onChange }) {
    return (_jsxs("div", { className: "space-y-3", children: [_jsx(FieldInput, { label: "Heading", value: content.headline || content.heading || '', onChange: (v) => {
                    const key = 'heading' in content ? 'heading' : 'headline';
                    updateField(content, key, v, onChange);
                }, placeholder: "Ready to get started?" }), _jsx(FieldTextarea, { label: "Description", value: content.description || '', onChange: (v) => updateField(content, 'description', v, onChange), placeholder: "Supporting description text", rows: 3 }), _jsx(Separator, {}), _jsx(FieldInput, { label: "Button Text", value: content.buttonText || '', onChange: (v) => updateField(content, 'buttonText', v, onChange), placeholder: "Contact Us" }), _jsx(FieldInput, { label: "Button Link", value: content.buttonLink || '', onChange: (v) => updateField(content, 'buttonLink', v, onChange), placeholder: "/contact" })] }));
}
/** Gallery block editor - list of image URLs */
function GalleryEditor({ content, onChange }) {
    const images = content.images || [];
    const [pickerIndex, setPickerIndex] = useState(null);
    const addImage = () => {
        onChange({ ...content, images: [...images, ''] });
    };
    const removeImage = (index) => {
        const updated = images.filter((_, i) => i !== index);
        onChange({ ...content, images: updated });
    };
    const updateImage = (index, value) => {
        const updated = [...images];
        updated[index] = value;
        onChange({ ...content, images: updated });
    };
    return (_jsxs("div", { className: "space-y-3", children: [_jsx(FieldInput, { label: "Gallery Title", value: content.title || '', onChange: (v) => updateField(content, 'title', v, onChange), placeholder: "Gallery title (optional)" }), _jsx(Separator, {}), _jsx(Label, { className: "text-sm", children: "Images" }), pickerIndex !== null && (_jsx(ImagePicker, { open: true, onOpenChange: (o) => !o && setPickerIndex(null), onSelect: (img) => {
                    updateImage(pickerIndex, img.url);
                    setPickerIndex(null);
                }, defaultQuery: "gallery" })), _jsx("div", { className: "space-y-2", children: images.map((url, index) => (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Input, { value: url, onChange: (e) => updateImage(index, e.target.value), placeholder: `Image URL ${index + 1}`, className: "flex-1" }), _jsx(Button, { variant: "outline", size: "icon", className: "h-8 w-8 shrink-0", title: "Browse stock images", onClick: () => setPickerIndex(index), type: "button", children: _jsx(Image, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 text-destructive hover:text-destructive", onClick: () => removeImage(index), children: _jsx(Trash2, { className: "h-4 w-4" }) })] }, index))) }), _jsxs(Button, { variant: "outline", size: "sm", onClick: addImage, children: [_jsx(Plus, { className: "mr-1 h-4 w-4" }), "Add Image"] })] }));
}
/** Feature Grid block editor */
function FeatureGridEditor({ content, onChange }) {
    const features = content.features || [];
    const addFeature = () => {
        onChange({
            ...content,
            features: [...features, { icon: '', title: '', description: '' }],
        });
    };
    const removeFeature = (index) => {
        const updated = features.filter((_, i) => i !== index);
        onChange({ ...content, features: updated });
    };
    const updateFeature = (index, field, value) => {
        const updated = [...features];
        updated[index] = { ...updated[index], [field]: value };
        onChange({ ...content, features: updated });
    };
    const columns = content.columns || 3;
    return (_jsxs("div", { className: "space-y-3", children: [_jsx(FieldInput, { label: "Section Title", value: content.title || '', onChange: (v) => updateField(content, 'title', v, onChange), placeholder: "Our Features" }), _jsxs("div", { className: "space-y-1.5", children: [_jsx(Label, { className: "text-sm", children: "Columns" }), _jsx("div", { className: "flex gap-2", children: [1, 2, 3, 4].map((n) => (_jsx("button", { type: "button", onClick: () => updateField(content, 'columns', n, onChange), className: `flex h-9 w-9 items-center justify-center rounded-md border text-sm font-medium transition-colors ${columns === n
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'}`, children: n }, n))) })] }), _jsx(Separator, {}), _jsx(Label, { className: "text-sm", children: "Features" }), _jsx("div", { className: "space-y-4", children: features.map((feature, index) => (_jsxs("div", { className: "rounded-md border p-3 space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { className: "text-xs font-medium text-muted-foreground", children: ["Feature ", index + 1] }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-6 w-6 text-destructive hover:text-destructive", onClick: () => removeFeature(index), children: _jsx(X, { className: "h-3 w-3" }) })] }), _jsx(Input, { value: feature.icon || '', onChange: (e) => updateFeature(index, 'icon', e.target.value), placeholder: "Icon name (e.g., Shield, Zap)", className: "text-sm" }), _jsx(Input, { value: feature.title || '', onChange: (e) => updateFeature(index, 'title', e.target.value), placeholder: "Feature title", className: "text-sm" }), _jsx(Textarea, { value: feature.description || '', onChange: (e) => updateFeature(index, 'description', e.target.value), placeholder: "Feature description", rows: 2, className: "text-sm" })] }, index))) }), _jsxs(Button, { variant: "outline", size: "sm", onClick: addFeature, children: [_jsx(Plus, { className: "mr-1 h-4 w-4" }), "Add Feature"] })] }));
}
/** Image block editor */
function ImageEditor({ content, onChange }) {
    return (_jsxs("div", { className: "space-y-3", children: [_jsx(ImageUrlInput, { label: "Image URL", value: content.src || content.url || '', onChange: (v) => {
                    const key = 'url' in content ? 'url' : 'src';
                    updateField(content, key, v, onChange);
                }, placeholder: "https://example.com/image.jpg", defaultQuery: "image" }), _jsx(FieldInput, { label: "Alt Text", value: content.alt || '', onChange: (v) => updateField(content, 'alt', v, onChange), placeholder: "Descriptive alt text" }), _jsx(FieldInput, { label: "Caption", value: content.caption || '', onChange: (v) => updateField(content, 'caption', v, onChange), placeholder: "Image caption (optional)" })] }));
}
/** Video block editor */
function VideoEditor({ content, onChange }) {
    return (_jsxs("div", { className: "space-y-3", children: [_jsx(FieldInput, { label: "Video URL", value: content.url || '', onChange: (v) => updateField(content, 'url', v, onChange), placeholder: "https://youtube.com/watch?v=..." }), _jsx(FieldInput, { label: "Title", value: content.title || '', onChange: (v) => updateField(content, 'title', v, onChange), placeholder: "Video title" })] }));
}
/** Code block editor */
function CodeBlockEditor({ content, onChange }) {
    return (_jsxs("div", { className: "space-y-3", children: [_jsx(FieldInput, { label: "Language", value: content.language || '', onChange: (v) => updateField(content, 'language', v, onChange), placeholder: "typescript, python, bash..." }), _jsx(FieldTextarea, { label: "Code", value: content.code || '', onChange: (v) => updateField(content, 'code', v, onChange), placeholder: "Paste code here...", rows: 10 })] }));
}
/** JSON fallback editor for unknown block types */
function JsonEditor({ content, onChange }) {
    const [jsonText, setJsonText] = useState(JSON.stringify(content, null, 2));
    const [error, setError] = useState(null);
    const handleJsonChange = (value) => {
        setJsonText(value);
        try {
            const parsed = JSON.parse(value);
            setError(null);
            onChange(parsed);
        }
        catch {
            setError('Invalid JSON');
        }
    };
    return (_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { className: "text-sm", children: "Content (JSON)" }), _jsx(Textarea, { value: jsonText, onChange: (e) => handleJsonChange(e.target.value), rows: 12, className: "font-mono text-sm", placeholder: "{}" }), error && (_jsx("p", { className: "text-xs text-destructive", children: error }))] }));
}
/** Bento Grid block editor — visual layout presets + grid items */
function BentoGridEditor({ content, onChange }) {
    const layout = content.layout || '2-col';
    const items = content.items || [];
    const LAYOUT_PRESETS = [
        { id: '2-col', label: '2 Column', grid: [[1, 1], [1, 1]] },
        { id: '3-col', label: '3 Column', grid: [[1, 1, 1], [1, 1, 1]] },
        { id: 'featured-left', label: 'Featured Left', grid: [[2, 1], [1, 1]] },
        { id: 'featured-right', label: 'Featured Right', grid: [[1, 2], [1, 1]] },
    ];
    const addItem = () => {
        onChange({ ...content, items: [...items, { title: '', description: '', span: 1 }] });
    };
    const removeItem = (index) => {
        onChange({ ...content, items: items.filter((_, i) => i !== index) });
    };
    const updateItem = (index, field, value) => {
        const updated = [...items];
        updated[index] = { ...updated[index], [field]: value };
        onChange({ ...content, items: updated });
    };
    return (_jsxs("div", { className: "space-y-3", children: [_jsx(FieldInput, { label: "Section Title", value: content.title || '', onChange: (v) => updateField(content, 'title', v, onChange), placeholder: "Bento Grid Title" }), _jsxs("div", { className: "space-y-1.5", children: [_jsx(Label, { className: "text-sm", children: "Layout Preset" }), _jsx("div", { className: "grid grid-cols-4 gap-2", children: LAYOUT_PRESETS.map((preset) => (_jsxs("button", { type: "button", onClick: () => updateField(content, 'layout', preset.id, onChange), className: `flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-colors ${layout === preset.id
                                ? 'border-primary bg-primary/10'
                                : 'border-input hover:border-primary/50'}`, children: [_jsx("div", { className: "flex w-full flex-col gap-0.5", children: preset.grid.map((row, ri) => (_jsx("div", { className: "flex gap-0.5", children: row.map((span, ci) => (_jsx("div", { className: `h-3 rounded-sm ${layout === preset.id ? 'bg-primary/60' : 'bg-muted-foreground/30'}`, style: { flex: span } }, ci))) }, ri))) }), _jsx("span", { className: "text-[10px] font-medium text-muted-foreground", children: preset.label })] }, preset.id))) })] }), _jsx(Separator, {}), _jsx(Label, { className: "text-sm", children: "Grid Items" }), _jsx("div", { className: "space-y-4", children: items.map((item, index) => (_jsxs("div", { className: "rounded-md border p-3 space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { className: "text-xs font-medium text-muted-foreground", children: ["Item ", index + 1] }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-6 w-6 text-destructive hover:text-destructive", onClick: () => removeItem(index), children: _jsx(X, { className: "h-3 w-3" }) })] }), _jsx(Input, { value: item.title || '', onChange: (e) => updateItem(index, 'title', e.target.value), placeholder: "Item title", className: "text-sm" }), _jsx(Textarea, { value: item.description || '', onChange: (e) => updateItem(index, 'description', e.target.value), placeholder: "Item description", rows: 2, className: "text-sm" }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { className: "text-xs", children: "Column Span" }), _jsx("div", { className: "flex gap-2", children: [1, 2].map((n) => (_jsx("button", { type: "button", onClick: () => updateItem(index, 'span', n), className: `flex h-7 w-7 items-center justify-center rounded border text-xs font-medium transition-colors ${(item.span || 1) === n
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'border-input bg-background hover:bg-accent'}`, children: n }, n))) })] })] }, index))) }), _jsxs(Button, { variant: "outline", size: "sm", onClick: addItem, children: [_jsx(Plus, { className: "mr-1 h-4 w-4" }), "Add Item"] })] }));
}
/** Pricing Table block editor — horizontal tier cards */
function PricingTableEditor({ content, onChange }) {
    const tiers = content.tiers || [];
    const addTier = () => {
        onChange({
            ...content,
            tiers: [...tiers, { name: '', price: '', interval: '/mo', features: [], ctaText: 'Get Started', isPopular: false }],
        });
    };
    const removeTier = (index) => {
        onChange({ ...content, tiers: tiers.filter((_, i) => i !== index) });
    };
    const updateTier = (index, field, value) => {
        const updated = [...tiers];
        updated[index] = { ...updated[index], [field]: value };
        onChange({ ...content, tiers: updated });
    };
    const addFeature = (tierIndex) => {
        const updated = [...tiers];
        const features = [...(updated[tierIndex].features || []), ''];
        updated[tierIndex] = { ...updated[tierIndex], features };
        onChange({ ...content, tiers: updated });
    };
    const removeFeature = (tierIndex, featureIndex) => {
        const updated = [...tiers];
        const features = (updated[tierIndex].features || []).filter((_, i) => i !== featureIndex);
        updated[tierIndex] = { ...updated[tierIndex], features };
        onChange({ ...content, tiers: updated });
    };
    const updateFeature = (tierIndex, featureIndex, value) => {
        const updated = [...tiers];
        const features = [...(updated[tierIndex].features || [])];
        features[featureIndex] = value;
        updated[tierIndex] = { ...updated[tierIndex], features };
        onChange({ ...content, tiers: updated });
    };
    return (_jsxs("div", { className: "space-y-3", children: [_jsx(FieldInput, { label: "Section Title", value: content.title || '', onChange: (v) => updateField(content, 'title', v, onChange), placeholder: "Pricing" }), _jsx(FieldTextarea, { label: "Subtitle", value: content.subtitle || '', onChange: (v) => updateField(content, 'subtitle', v, onChange), placeholder: "Choose the plan that works for you", rows: 2 }), _jsx(Separator, {}), _jsx(Label, { className: "text-sm", children: "Tiers" }), _jsx("div", { className: "flex gap-4 overflow-x-auto pb-2", children: tiers.map((tier, index) => (_jsxs("div", { className: `min-w-[240px] max-w-[280px] flex-shrink-0 rounded-lg border-2 p-4 space-y-3 ${tier.isPopular ? 'border-primary bg-primary/5' : 'border-input'}`, children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { className: "text-xs font-medium text-muted-foreground", children: ["Tier ", index + 1] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("button", { type: "button", onClick: () => updateTier(index, 'isPopular', !tier.isPopular), title: tier.isPopular ? 'Remove popular badge' : 'Mark as popular', className: `flex h-6 w-6 items-center justify-center rounded transition-colors ${tier.isPopular ? 'text-yellow-500' : 'text-muted-foreground/40 hover:text-yellow-500'}`, children: _jsx(Star, { className: "h-3.5 w-3.5", fill: tier.isPopular ? 'currentColor' : 'none' }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-6 w-6 text-destructive hover:text-destructive", onClick: () => removeTier(index), children: _jsx(X, { className: "h-3 w-3" }) })] })] }), _jsx(Input, { value: tier.name || '', onChange: (e) => updateTier(index, 'name', e.target.value), placeholder: "Plan name", className: "text-sm font-medium" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { value: tier.price || '', onChange: (e) => updateTier(index, 'price', e.target.value), placeholder: "$29", className: "flex-1 text-sm" }), _jsx(Input, { value: tier.interval || '', onChange: (e) => updateTier(index, 'interval', e.target.value), placeholder: "/mo", className: "w-16 text-sm" })] }), _jsx(Input, { value: tier.ctaText || '', onChange: (e) => updateTier(index, 'ctaText', e.target.value), placeholder: "CTA text", className: "text-sm" }), _jsxs("div", { className: "space-y-1.5", children: [_jsx(Label, { className: "text-xs", children: "Features" }), (tier.features || []).map((feat, fi) => (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Check, { className: "h-3 w-3 shrink-0 text-green-500" }), _jsx(Input, { value: feat, onChange: (e) => updateFeature(index, fi, e.target.value), placeholder: "Feature...", className: "h-7 text-xs" }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-5 w-5 shrink-0 text-destructive hover:text-destructive", onClick: () => removeFeature(index, fi), children: _jsx(X, { className: "h-2.5 w-2.5" }) })] }, fi))), _jsxs(Button, { variant: "ghost", size: "sm", className: "h-6 text-xs", onClick: () => addFeature(index), children: [_jsx(Plus, { className: "mr-1 h-3 w-3" }), "Feature"] })] })] }, index))) }), _jsxs(Button, { variant: "outline", size: "sm", onClick: addTier, children: [_jsx(Plus, { className: "mr-1 h-4 w-4" }), "Add Tier"] })] }));
}
/** Map of block types to their editor components */
const editorMap = {
    hero: HeroEditor,
    text: TextEditor,
    rich_text: TextEditor,
    cta: CtaEditor,
    gallery: GalleryEditor,
    feature_grid: FeatureGridEditor,
    bento_grid: BentoGridEditor,
    pricing_table: PricingTableEditor,
    image: ImageEditor,
    video: VideoEditor,
    code_block: CodeBlockEditor,
};
export function BlockContentEditor({ blockType, content, onChange }) {
    const Editor = editorMap[blockType] || JsonEditor;
    return _jsx(Editor, { content: content, onChange: onChange });
}
export default BlockContentEditor;
//# sourceMappingURL=BlockContentEditor.js.map