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
import { Plus, Trash2, X, Image, Star, Check } from 'lucide-react';
import { ImagePicker } from './ImagePicker';
import type { StockImage } from './ImagePicker';

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

/**
 * ImageUrlInput — a labeled URL input with a "Browse Stock Images" button.
 * Replaces bare FieldInput for image URL fields.
 */
function ImageUrlInput({
  label,
  value,
  onChange,
  placeholder,
  defaultQuery,
  vertical,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  defaultQuery?: string;
  vertical?: string;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleSelect = (image: StockImage) => {
    onChange(image.url);
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          title="Browse stock images"
          onClick={() => setPickerOpen(true)}
          type="button"
        >
          <Image className="h-4 w-4" />
        </Button>
      </div>
      <ImagePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleSelect}
        defaultQuery={defaultQuery}
        vertical={vertical}
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
      <ImageUrlInput
        label="Background Image URL"
        value={(content.backgroundImage as string) || ''}
        onChange={(v) => updateField(content, 'backgroundImage', v, onChange)}
        placeholder="https://example.com/image.jpg"
        defaultQuery="hero background"
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
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);

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
      {pickerIndex !== null && (
        <ImagePicker
          open
          onOpenChange={(o) => !o && setPickerIndex(null)}
          onSelect={(img) => {
            updateImage(pickerIndex, img.url);
            setPickerIndex(null);
          }}
          defaultQuery="gallery"
        />
      )}
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
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              title="Browse stock images"
              onClick={() => setPickerIndex(index)}
              type="button"
            >
              <Image className="h-4 w-4" />
            </Button>
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

  const columns = (content.columns as number) || 3;

  return (
    <div className="space-y-3">
      <FieldInput
        label="Section Title"
        value={(content.title as string) || ''}
        onChange={(v) => updateField(content, 'title', v, onChange)}
        placeholder="Our Features"
      />
      <div className="space-y-1.5">
        <Label className="text-sm">Columns</Label>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => updateField(content, 'columns', n, onChange)}
              className={`flex h-9 w-9 items-center justify-center rounded-md border text-sm font-medium transition-colors ${
                columns === n
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
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
      <ImageUrlInput
        label="Image URL"
        value={(content.src as string) || (content.url as string) || ''}
        onChange={(v) => {
          const key = 'url' in content ? 'url' : 'src';
          updateField(content, key, v, onChange);
        }}
        placeholder="https://example.com/image.jpg"
        defaultQuery="image"
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

/** Bento Grid block editor — visual layout presets + grid items */
function BentoGridEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const layout = (content.layout as string) || '2-col';
  const items = (content.items as Array<{ title?: string; description?: string; span?: number }>) || [];

  const LAYOUT_PRESETS: Array<{ id: string; label: string; grid: number[][] }> = [
    { id: '2-col', label: '2 Column', grid: [[1, 1], [1, 1]] },
    { id: '3-col', label: '3 Column', grid: [[1, 1, 1], [1, 1, 1]] },
    { id: 'featured-left', label: 'Featured Left', grid: [[2, 1], [1, 1]] },
    { id: 'featured-right', label: 'Featured Right', grid: [[1, 2], [1, 1]] },
  ];

  const addItem = () => {
    onChange({ ...content, items: [...items, { title: '', description: '', span: 1 }] });
  };

  const removeItem = (index: number) => {
    onChange({ ...content, items: items.filter((_, i) => i !== index) });
  };

  const updateItem = (index: number, field: string, value: unknown) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...content, items: updated });
  };

  return (
    <div className="space-y-3">
      <FieldInput
        label="Section Title"
        value={(content.title as string) || ''}
        onChange={(v) => updateField(content, 'title', v, onChange)}
        placeholder="Bento Grid Title"
      />

      <div className="space-y-1.5">
        <Label className="text-sm">Layout Preset</Label>
        <div className="grid grid-cols-4 gap-2">
          {LAYOUT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => updateField(content, 'layout', preset.id, onChange)}
              className={`flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-colors ${
                layout === preset.id
                  ? 'border-primary bg-primary/10'
                  : 'border-input hover:border-primary/50'
              }`}
            >
              {/* Visual thumbnail of grid layout */}
              <div className="flex w-full flex-col gap-0.5">
                {preset.grid.map((row, ri) => (
                  <div key={ri} className="flex gap-0.5">
                    {row.map((span, ci) => (
                      <div
                        key={ci}
                        className={`h-3 rounded-sm ${
                          layout === preset.id ? 'bg-primary/60' : 'bg-muted-foreground/30'
                        }`}
                        style={{ flex: span }}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      <Separator />
      <Label className="text-sm">Grid Items</Label>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="rounded-md border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Item {index + 1}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={() => removeItem(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <Input
              value={item.title || ''}
              onChange={(e) => updateItem(index, 'title', e.target.value)}
              placeholder="Item title"
              className="text-sm"
            />
            <Textarea
              value={item.description || ''}
              onChange={(e) => updateItem(index, 'description', e.target.value)}
              placeholder="Item description"
              rows={2}
              className="text-sm"
            />
            <div className="space-y-1">
              <Label className="text-xs">Column Span</Label>
              <div className="flex gap-2">
                {[1, 2].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => updateItem(index, 'span', n)}
                    className={`flex h-7 w-7 items-center justify-center rounded border text-xs font-medium transition-colors ${
                      (item.span || 1) === n
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-background hover:bg-accent'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={addItem}>
        <Plus className="mr-1 h-4 w-4" />
        Add Item
      </Button>
    </div>
  );
}

/** Pricing Table block editor — horizontal tier cards */
function PricingTableEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const tiers = (content.tiers as Array<{
    name?: string;
    price?: string;
    interval?: string;
    features?: string[];
    ctaText?: string;
    isPopular?: boolean;
  }>) || [];

  const addTier = () => {
    onChange({
      ...content,
      tiers: [...tiers, { name: '', price: '', interval: '/mo', features: [], ctaText: 'Get Started', isPopular: false }],
    });
  };

  const removeTier = (index: number) => {
    onChange({ ...content, tiers: tiers.filter((_, i) => i !== index) });
  };

  const updateTier = (index: number, field: string, value: unknown) => {
    const updated = [...tiers];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...content, tiers: updated });
  };

  const addFeature = (tierIndex: number) => {
    const updated = [...tiers];
    const features = [...(updated[tierIndex].features || []), ''];
    updated[tierIndex] = { ...updated[tierIndex], features };
    onChange({ ...content, tiers: updated });
  };

  const removeFeature = (tierIndex: number, featureIndex: number) => {
    const updated = [...tiers];
    const features = (updated[tierIndex].features || []).filter((_, i) => i !== featureIndex);
    updated[tierIndex] = { ...updated[tierIndex], features };
    onChange({ ...content, tiers: updated });
  };

  const updateFeature = (tierIndex: number, featureIndex: number, value: string) => {
    const updated = [...tiers];
    const features = [...(updated[tierIndex].features || [])];
    features[featureIndex] = value;
    updated[tierIndex] = { ...updated[tierIndex], features };
    onChange({ ...content, tiers: updated });
  };

  return (
    <div className="space-y-3">
      <FieldInput
        label="Section Title"
        value={(content.title as string) || ''}
        onChange={(v) => updateField(content, 'title', v, onChange)}
        placeholder="Pricing"
      />
      <FieldTextarea
        label="Subtitle"
        value={(content.subtitle as string) || ''}
        onChange={(v) => updateField(content, 'subtitle', v, onChange)}
        placeholder="Choose the plan that works for you"
        rows={2}
      />

      <Separator />
      <Label className="text-sm">Tiers</Label>

      {/* Horizontal scrollable tier cards */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {tiers.map((tier, index) => (
          <div
            key={index}
            className={`min-w-[240px] max-w-[280px] flex-shrink-0 rounded-lg border-2 p-4 space-y-3 ${
              tier.isPopular ? 'border-primary bg-primary/5' : 'border-input'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Tier {index + 1}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => updateTier(index, 'isPopular', !tier.isPopular)}
                  title={tier.isPopular ? 'Remove popular badge' : 'Mark as popular'}
                  className={`flex h-6 w-6 items-center justify-center rounded transition-colors ${
                    tier.isPopular ? 'text-yellow-500' : 'text-muted-foreground/40 hover:text-yellow-500'
                  }`}
                >
                  <Star className="h-3.5 w-3.5" fill={tier.isPopular ? 'currentColor' : 'none'} />
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={() => removeTier(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <Input
              value={tier.name || ''}
              onChange={(e) => updateTier(index, 'name', e.target.value)}
              placeholder="Plan name"
              className="text-sm font-medium"
            />

            <div className="flex gap-2">
              <Input
                value={tier.price || ''}
                onChange={(e) => updateTier(index, 'price', e.target.value)}
                placeholder="$29"
                className="flex-1 text-sm"
              />
              <Input
                value={tier.interval || ''}
                onChange={(e) => updateTier(index, 'interval', e.target.value)}
                placeholder="/mo"
                className="w-16 text-sm"
              />
            </div>

            <Input
              value={tier.ctaText || ''}
              onChange={(e) => updateTier(index, 'ctaText', e.target.value)}
              placeholder="CTA text"
              className="text-sm"
            />

            <div className="space-y-1.5">
              <Label className="text-xs">Features</Label>
              {(tier.features || []).map((feat, fi) => (
                <div key={fi} className="flex items-center gap-1">
                  <Check className="h-3 w-3 shrink-0 text-green-500" />
                  <Input
                    value={feat}
                    onChange={(e) => updateFeature(index, fi, e.target.value)}
                    placeholder="Feature..."
                    className="h-7 text-xs"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0 text-destructive hover:text-destructive"
                    onClick={() => removeFeature(index, fi)}
                  >
                    <X className="h-2.5 w-2.5" />
                  </Button>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => addFeature(index)}
              >
                <Plus className="mr-1 h-3 w-3" />
                Feature
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={addTier}>
        <Plus className="mr-1 h-4 w-4" />
        Add Tier
      </Button>
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
  bento_grid: BentoGridEditor,
  pricing_table: PricingTableEditor,
  image: ImageEditor,
  video: VideoEditor,
  code_block: CodeBlockEditor,
};

export function BlockContentEditor({ blockType, content, onChange }: BlockContentEditorProps) {
  const Editor = editorMap[blockType] || JsonEditor;
  return <Editor content={content} onChange={onChange} />;
}

export default BlockContentEditor;
