import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * BlockContentEditor - Type-specific form fields for editing block content
 *
 * Renders appropriate inputs based on block type (hero, text, cta, etc.)
 * with a JSON fallback editor for unknown/custom block types.
 */
import { useState } from 'react';
import { Input, Label, Textarea, Button, Separator, } from '@netrun-cms/ui';
import { Plus, Trash2, X } from 'lucide-react';
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
/** Hero block editor */
function HeroEditor({ content, onChange }) {
    return (_jsxs("div", { className: "space-y-3", children: [_jsx(FieldInput, { label: "Headline", value: content.headline || '', onChange: (v) => updateField(content, 'headline', v, onChange), placeholder: "Main heading text" }), _jsx(FieldInput, { label: "Subheadline", value: content.subheadline || '', onChange: (v) => updateField(content, 'subheadline', v, onChange), placeholder: "Supporting text" }), _jsx(FieldInput, { label: "Background Image URL", value: content.backgroundImage || '', onChange: (v) => updateField(content, 'backgroundImage', v, onChange), placeholder: "https://example.com/image.jpg" }), _jsx(Separator, {}), _jsx(FieldInput, { label: "CTA Text", value: content.ctaText || '', onChange: (v) => updateField(content, 'ctaText', v, onChange), placeholder: "Get Started" }), _jsx(FieldInput, { label: "CTA Link", value: content.ctaLink || '', onChange: (v) => updateField(content, 'ctaLink', v, onChange), placeholder: "/contact" })] }));
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
    return (_jsxs("div", { className: "space-y-3", children: [_jsx(FieldInput, { label: "Gallery Title", value: content.title || '', onChange: (v) => updateField(content, 'title', v, onChange), placeholder: "Gallery title (optional)" }), _jsx(Separator, {}), _jsx(Label, { className: "text-sm", children: "Images" }), _jsx("div", { className: "space-y-2", children: images.map((url, index) => (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Input, { value: url, onChange: (e) => updateImage(index, e.target.value), placeholder: `Image URL ${index + 1}`, className: "flex-1" }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 text-destructive hover:text-destructive", onClick: () => removeImage(index), children: _jsx(Trash2, { className: "h-4 w-4" }) })] }, index))) }), _jsxs(Button, { variant: "outline", size: "sm", onClick: addImage, children: [_jsx(Plus, { className: "mr-1 h-4 w-4" }), "Add Image"] })] }));
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
    return (_jsxs("div", { className: "space-y-3", children: [_jsx(FieldInput, { label: "Section Title", value: content.title || '', onChange: (v) => updateField(content, 'title', v, onChange), placeholder: "Our Features" }), _jsx(Separator, {}), _jsx(Label, { className: "text-sm", children: "Features" }), _jsx("div", { className: "space-y-4", children: features.map((feature, index) => (_jsxs("div", { className: "rounded-md border p-3 space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { className: "text-xs font-medium text-muted-foreground", children: ["Feature ", index + 1] }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-6 w-6 text-destructive hover:text-destructive", onClick: () => removeFeature(index), children: _jsx(X, { className: "h-3 w-3" }) })] }), _jsx(Input, { value: feature.icon || '', onChange: (e) => updateFeature(index, 'icon', e.target.value), placeholder: "Icon name (e.g., Shield, Zap)", className: "text-sm" }), _jsx(Input, { value: feature.title || '', onChange: (e) => updateFeature(index, 'title', e.target.value), placeholder: "Feature title", className: "text-sm" }), _jsx(Textarea, { value: feature.description || '', onChange: (e) => updateFeature(index, 'description', e.target.value), placeholder: "Feature description", rows: 2, className: "text-sm" })] }, index))) }), _jsxs(Button, { variant: "outline", size: "sm", onClick: addFeature, children: [_jsx(Plus, { className: "mr-1 h-4 w-4" }), "Add Feature"] })] }));
}
/** Image block editor */
function ImageEditor({ content, onChange }) {
    return (_jsxs("div", { className: "space-y-3", children: [_jsx(FieldInput, { label: "Image URL", value: content.src || content.url || '', onChange: (v) => {
                    const key = 'url' in content ? 'url' : 'src';
                    updateField(content, key, v, onChange);
                }, placeholder: "https://example.com/image.jpg" }), _jsx(FieldInput, { label: "Alt Text", value: content.alt || '', onChange: (v) => updateField(content, 'alt', v, onChange), placeholder: "Descriptive alt text" }), _jsx(FieldInput, { label: "Caption", value: content.caption || '', onChange: (v) => updateField(content, 'caption', v, onChange), placeholder: "Image caption (optional)" })] }));
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
/** Map of block types to their editor components */
const editorMap = {
    hero: HeroEditor,
    text: TextEditor,
    rich_text: TextEditor,
    cta: CtaEditor,
    gallery: GalleryEditor,
    feature_grid: FeatureGridEditor,
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