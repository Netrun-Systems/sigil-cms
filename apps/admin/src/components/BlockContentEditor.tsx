/**
 * BlockContentEditor - Type-specific form fields for editing block content
 *
 * Renders appropriate inputs based on block type (hero, text, cta, etc.)
 * with a JSON fallback editor for unknown/custom block types.
 */

import { useState } from 'react';
import {
  Input,
  Label,
  Textarea,
  Button,
  Separator,
} from '@netrun-cms/ui';
import { Plus, Trash2, X } from 'lucide-react';

export interface BlockContentEditorProps {
  blockType: string;
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
}

/** Helper: update a single field in content */
function updateField(
  content: Record<string, unknown>,
  field: string,
  value: unknown,
  onChange: (c: Record<string, unknown>) => void
) {
  onChange({ ...content, [field]: value });
}

/** Reusable labeled input */
function FieldInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

/** Reusable labeled textarea */
function FieldTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
      />
    </div>
  );
}

/** Hero block editor */
function HeroEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <FieldInput
        label="Headline"
        value={(content.headline as string) || ''}
        onChange={(v) => updateField(content, 'headline', v, onChange)}
        placeholder="Main heading text"
      />
      <FieldInput
        label="Subheadline"
        value={(content.subheadline as string) || ''}
        onChange={(v) => updateField(content, 'subheadline', v, onChange)}
        placeholder="Supporting text"
      />
      <FieldInput
        label="Background Image URL"
        value={(content.backgroundImage as string) || ''}
        onChange={(v) => updateField(content, 'backgroundImage', v, onChange)}
        placeholder="https://example.com/image.jpg"
      />
      <Separator />
      <FieldInput
        label="CTA Text"
        value={(content.ctaText as string) || ''}
        onChange={(v) => updateField(content, 'ctaText', v, onChange)}
        placeholder="Get Started"
      />
      <FieldInput
        label="CTA Link"
        value={(content.ctaLink as string) || ''}
        onChange={(v) => updateField(content, 'ctaLink', v, onChange)}
        placeholder="/contact"
      />
    </div>
  );
}

/** Text / Rich Text block editor */
function TextEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <FieldTextarea
        label="Content"
        value={(content.body as string) || (content.content as string) || ''}
        onChange={(v) => {
          // Use whichever key already exists, default to 'body'
          const key = 'content' in content ? 'content' : 'body';
          updateField(content, key, v, onChange);
        }}
        placeholder="Enter text or markdown content..."
        rows={8}
      />
    </div>
  );
}

/** CTA block editor */
function CtaEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <FieldInput
        label="Heading"
        value={(content.headline as string) || (content.heading as string) || ''}
        onChange={(v) => {
          const key = 'heading' in content ? 'heading' : 'headline';
          updateField(content, key, v, onChange);
        }}
        placeholder="Ready to get started?"
      />
      <FieldTextarea
        label="Description"
        value={(content.description as string) || ''}
        onChange={(v) => updateField(content, 'description', v, onChange)}
        placeholder="Supporting description text"
        rows={3}
      />
      <Separator />
      <FieldInput
        label="Button Text"
        value={(content.buttonText as string) || ''}
        onChange={(v) => updateField(content, 'buttonText', v, onChange)}
        placeholder="Contact Us"
      />
      <FieldInput
        label="Button Link"
        value={(content.buttonLink as string) || ''}
        onChange={(v) => updateField(content, 'buttonLink', v, onChange)}
        placeholder="/contact"
      />
    </div>
  );
}

/** Gallery block editor - list of image URLs */
function GalleryEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const images = (content.images as string[]) || [];

  const addImage = () => {
    onChange({ ...content, images: [...images, ''] });
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange({ ...content, images: updated });
  };

  const updateImage = (index: number, value: string) => {
    const updated = [...images];
    updated[index] = value;
    onChange({ ...content, images: updated });
  };

  return (
    <div className="space-y-3">
      <FieldInput
        label="Gallery Title"
        value={(content.title as string) || ''}
        onChange={(v) => updateField(content, 'title', v, onChange)}
        placeholder="Gallery title (optional)"
      />
      <Separator />
      <Label className="text-sm">Images</Label>
      <div className="space-y-2">
        {images.map((url, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={url}
              onChange={(e) => updateImage(index, e.target.value)}
              placeholder={`Image URL ${index + 1}`}
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => removeImage(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={addImage}>
        <Plus className="mr-1 h-4 w-4" />
        Add Image
      </Button>
    </div>
  );
}

/** Feature Grid block editor */
function FeatureGridEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const features = (content.features as Array<{ icon?: string; title?: string; description?: string }>) || [];

  const addFeature = () => {
    onChange({
      ...content,
      features: [...features, { icon: '', title: '', description: '' }],
    });
  };

  const removeFeature = (index: number) => {
    const updated = features.filter((_, i) => i !== index);
    onChange({ ...content, features: updated });
  };

  const updateFeature = (index: number, field: string, value: string) => {
    const updated = [...features];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...content, features: updated });
  };

  return (
    <div className="space-y-3">
      <FieldInput
        label="Section Title"
        value={(content.title as string) || ''}
        onChange={(v) => updateField(content, 'title', v, onChange)}
        placeholder="Our Features"
      />
      <Separator />
      <Label className="text-sm">Features</Label>
      <div className="space-y-4">
        {features.map((feature, index) => (
          <div key={index} className="rounded-md border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Feature {index + 1}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={() => removeFeature(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <Input
              value={feature.icon || ''}
              onChange={(e) => updateFeature(index, 'icon', e.target.value)}
              placeholder="Icon name (e.g., Shield, Zap)"
              className="text-sm"
            />
            <Input
              value={feature.title || ''}
              onChange={(e) => updateFeature(index, 'title', e.target.value)}
              placeholder="Feature title"
              className="text-sm"
            />
            <Textarea
              value={feature.description || ''}
              onChange={(e) => updateFeature(index, 'description', e.target.value)}
              placeholder="Feature description"
              rows={2}
              className="text-sm"
            />
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={addFeature}>
        <Plus className="mr-1 h-4 w-4" />
        Add Feature
      </Button>
    </div>
  );
}

/** Image block editor */
function ImageEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <FieldInput
        label="Image URL"
        value={(content.src as string) || (content.url as string) || ''}
        onChange={(v) => {
          const key = 'url' in content ? 'url' : 'src';
          updateField(content, key, v, onChange);
        }}
        placeholder="https://example.com/image.jpg"
      />
      <FieldInput
        label="Alt Text"
        value={(content.alt as string) || ''}
        onChange={(v) => updateField(content, 'alt', v, onChange)}
        placeholder="Descriptive alt text"
      />
      <FieldInput
        label="Caption"
        value={(content.caption as string) || ''}
        onChange={(v) => updateField(content, 'caption', v, onChange)}
        placeholder="Image caption (optional)"
      />
    </div>
  );
}

/** Video block editor */
function VideoEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <FieldInput
        label="Video URL"
        value={(content.url as string) || ''}
        onChange={(v) => updateField(content, 'url', v, onChange)}
        placeholder="https://youtube.com/watch?v=..."
      />
      <FieldInput
        label="Title"
        value={(content.title as string) || ''}
        onChange={(v) => updateField(content, 'title', v, onChange)}
        placeholder="Video title"
      />
    </div>
  );
}

/** Code block editor */
function CodeBlockEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <FieldInput
        label="Language"
        value={(content.language as string) || ''}
        onChange={(v) => updateField(content, 'language', v, onChange)}
        placeholder="typescript, python, bash..."
      />
      <FieldTextarea
        label="Code"
        value={(content.code as string) || ''}
        onChange={(v) => updateField(content, 'code', v, onChange)}
        placeholder="Paste code here..."
        rows={10}
      />
    </div>
  );
}

/** JSON fallback editor for unknown block types */
function JsonEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const [jsonText, setJsonText] = useState(JSON.stringify(content, null, 2));
  const [error, setError] = useState<string | null>(null);

  const handleJsonChange = (value: string) => {
    setJsonText(value);
    try {
      const parsed = JSON.parse(value);
      setError(null);
      onChange(parsed);
    } catch {
      setError('Invalid JSON');
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm">Content (JSON)</Label>
      <Textarea
        value={jsonText}
        onChange={(e) => handleJsonChange(e.target.value)}
        rows={12}
        className="font-mono text-sm"
        placeholder="{}"
      />
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}

/** Map of block types to their editor components */
const editorMap: Record<string, React.FC<{ content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }>> = {
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

export function BlockContentEditor({ blockType, content, onChange }: BlockContentEditorProps) {
  const Editor = editorMap[blockType] || JsonEditor;
  return <Editor content={content} onChange={onChange} />;
}

export default BlockContentEditor;
