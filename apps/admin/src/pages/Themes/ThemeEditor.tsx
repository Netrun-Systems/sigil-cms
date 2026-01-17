import { useParams, Link } from 'react-router-dom';
import {
  Palette,
  Save,
  Eye,
  ArrowLeft,
  Sun,
  Moon,
  Monitor,
  RotateCcw,
  Copy,
  Check,
  Type,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Separator,
  cn,
} from '@netrun-cms/ui';
import {
  useTheme,
  themePresets,
  type ThemePreset,
} from '@netrun-cms/theme';
import type { ThemeTokens, ColorTokens, TypographyTokens, EffectTokens } from '@netrun-cms/core';
import { useState, useEffect } from 'react';

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
}

function ColorInput({ label, value, onChange, description }: ColorInputProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm">{label}</Label>
        <button
          onClick={handleCopy}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {copied ? (
            <span className="flex items-center gap-1">
              <Check className="h-3 w-3" /> Copied
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Copy className="h-3 w-3" /> Copy
            </span>
          )}
        </button>
      </div>
      <div className="flex items-center gap-2">
        <div
          className="h-9 w-9 rounded-md border cursor-pointer"
          style={{ backgroundColor: value }}
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-full w-full opacity-0 cursor-pointer"
          />
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 font-mono text-sm"
          placeholder="#000000"
        />
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

function PresetCard({
  preset,
  isSelected,
  onSelect,
}: {
  preset: ThemePreset;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'group relative flex flex-col items-start rounded-lg border p-4 text-left transition-all hover:border-primary',
        isSelected && 'border-primary ring-2 ring-primary/20'
      )}
    >
      {isSelected && (
        <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-3 w-3" />
        </div>
      )}
      <div className="flex gap-1 mb-3">
        <div
          className="h-6 w-6 rounded-l-md"
          style={{ backgroundColor: preset.darkTokens.colors.primary }}
        />
        <div
          className="h-6 w-6"
          style={{ backgroundColor: preset.darkTokens.colors.background }}
        />
        <div
          className="h-6 w-6 rounded-r-md"
          style={{ backgroundColor: preset.darkTokens.colors.text }}
        />
      </div>
      <p className="font-medium">{preset.name}</p>
      <p className="text-sm text-muted-foreground">{preset.description}</p>
    </button>
  );
}

function LivePreview({ tokens }: { tokens: ThemeTokens }) {
  return (
    <div
      className="rounded-lg border p-6 space-y-4"
      style={{
        backgroundColor: tokens.colors.background,
        color: tokens.colors.text,
        fontFamily: tokens.typography.fontFamily,
      }}
    >
      <div className="space-y-2">
        <h3
          className="text-xl font-bold"
          style={{
            fontFamily: tokens.typography.fontFamilyHeading || tokens.typography.fontFamily,
          }}
        >
          Preview Heading
        </h3>
        <p style={{ color: tokens.colors.textSecondary }}>
          This is how your theme will look with the current settings.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          className="rounded-md px-4 py-2 text-sm font-medium transition-colors"
          style={{
            backgroundColor: tokens.colors.primary,
            color: '#000',
            borderRadius: tokens.effects?.borderRadius || '8px',
          }}
        >
          Primary Button
        </button>
        <button
          className="rounded-md border px-4 py-2 text-sm font-medium"
          style={{
            borderColor: tokens.colors.primary,
            color: tokens.colors.primary,
            borderRadius: tokens.effects?.borderRadius || '8px',
          }}
        >
          Secondary Button
        </button>
      </div>
      <div
        className="rounded-lg p-4"
        style={{
          backgroundColor: tokens.colors.surface || tokens.colors.backgroundSecondary,
          boxShadow: tokens.effects?.shadowMd,
          borderRadius: tokens.effects?.borderRadiusLg || '12px',
        }}
      >
        <p className="font-medium">Card Component</p>
        <p className="text-sm" style={{ color: tokens.colors.textSecondary }}>
          This demonstrates surface colors and shadows.
        </p>
      </div>
      <div className="flex gap-2">
        <span
          className="rounded px-2 py-1 text-xs"
          style={{ backgroundColor: tokens.colors.success, color: '#fff' }}
        >
          Success
        </span>
        <span
          className="rounded px-2 py-1 text-xs"
          style={{ backgroundColor: tokens.colors.warning, color: '#000' }}
        >
          Warning
        </span>
        <span
          className="rounded px-2 py-1 text-xs"
          style={{ backgroundColor: tokens.colors.error, color: '#fff' }}
        >
          Error
        </span>
        <span
          className="rounded px-2 py-1 text-xs"
          style={{ backgroundColor: tokens.colors.info, color: '#000' }}
        >
          Info
        </span>
      </div>
    </div>
  );
}

export function ThemeEditor() {
  const { siteId } = useParams();
  const { tokens, isDark, setMode, setSiteTheme, applyTokenOverrides } = useTheme();

  const [selectedPreset, setSelectedPreset] = useState<string>('netrun-dark');
  const [customTokens, setCustomTokens] = useState<ThemeTokens>(tokens);
  const [previewMode, setPreviewMode] = useState<'dark' | 'light'>('dark');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Update custom tokens when theme changes
  useEffect(() => {
    setCustomTokens(tokens);
  }, [tokens]);

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = themePresets.find((p) => p.id === presetId);
    if (preset) {
      const newTokens = previewMode === 'dark' ? preset.darkTokens : preset.lightTokens;
      setCustomTokens(newTokens);
      setSiteTheme({
        darkTokens: preset.darkTokens,
        lightTokens: preset.lightTokens,
      });
      setHasChanges(true);
    }
  };

  const handleColorChange = (key: keyof ColorTokens, value: string) => {
    setCustomTokens((prev) => ({
      ...prev,
      colors: { ...prev.colors, [key]: value },
    }));
    applyTokenOverrides({ colors: { ...customTokens.colors, [key]: value } });
    setHasChanges(true);
  };

  const handleTypographyChange = (key: keyof TypographyTokens, value: string | number) => {
    setCustomTokens((prev) => ({
      ...prev,
      typography: { ...prev.typography, [key]: value },
    }));
    applyTokenOverrides({ typography: { ...customTokens.typography, [key]: value } });
    setHasChanges(true);
  };

  const handleEffectChange = (key: keyof EffectTokens, value: string) => {
    setCustomTokens((prev) => ({
      ...prev,
      effects: { ...prev.effects, [key]: value },
    }));
    applyTokenOverrides({ effects: { ...customTokens.effects, [key]: value } });
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setHasChanges(false);
  };

  const handleReset = () => {
    const preset = themePresets.find((p) => p.id === selectedPreset);
    if (preset) {
      const newTokens = previewMode === 'dark' ? preset.darkTokens : preset.lightTokens;
      setCustomTokens(newTokens);
      setSiteTheme({
        darkTokens: preset.darkTokens,
        lightTokens: preset.lightTokens,
      });
      setHasChanges(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {siteId && (
            <Button variant="ghost" size="icon" asChild>
              <Link to={`/sites/${siteId}`}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Theme Editor</h1>
            <p className="text-muted-foreground">
              Customize the visual appearance of your site
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Theme'}
          </Button>
        </div>
      </div>

      {/* Preview Mode Toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Label>Preview Mode</Label>
              <div className="flex items-center gap-1 rounded-lg border p-1">
                <Button
                  variant={previewMode === 'dark' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setPreviewMode('dark');
                    setMode('dark');
                  }}
                >
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </Button>
                <Button
                  variant={previewMode === 'light' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setPreviewMode('light');
                    setMode('light');
                  }}
                >
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Currently editing: <strong className="capitalize">{previewMode}</strong> mode
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Editor Panel */}
        <div className="space-y-6">
          <Tabs defaultValue="presets">
            <TabsList className="w-full">
              <TabsTrigger value="presets" className="flex-1">
                <Sparkles className="mr-2 h-4 w-4" />
                Presets
              </TabsTrigger>
              <TabsTrigger value="colors" className="flex-1">
                <Palette className="mr-2 h-4 w-4" />
                Colors
              </TabsTrigger>
              <TabsTrigger value="typography" className="flex-1">
                <Type className="mr-2 h-4 w-4" />
                Typography
              </TabsTrigger>
              <TabsTrigger value="effects" className="flex-1">
                <Layers className="mr-2 h-4 w-4" />
                Effects
              </TabsTrigger>
            </TabsList>

            {/* Presets Tab */}
            <TabsContent value="presets" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Theme Presets</CardTitle>
                  <CardDescription>
                    Choose a preset to get started, then customize it
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  {themePresets.map((preset) => (
                    <PresetCard
                      key={preset.id}
                      preset={preset}
                      isSelected={selectedPreset === preset.id}
                      onSelect={() => handlePresetSelect(preset.id)}
                    />
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Colors Tab */}
            <TabsContent value="colors" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Brand Colors</CardTitle>
                  <CardDescription>Primary and secondary brand colors</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <ColorInput
                    label="Primary"
                    value={customTokens.colors.primary}
                    onChange={(v) => handleColorChange('primary', v)}
                    description="Main brand color"
                  />
                  <ColorInput
                    label="Primary Dark"
                    value={customTokens.colors.primaryDark || customTokens.colors.primary}
                    onChange={(v) => handleColorChange('primaryDark', v)}
                    description="Darker shade for hover states"
                  />
                  <ColorInput
                    label="Primary Light"
                    value={customTokens.colors.primaryLight || customTokens.colors.primary}
                    onChange={(v) => handleColorChange('primaryLight', v)}
                    description="Lighter shade for backgrounds"
                  />
                  <ColorInput
                    label="Secondary"
                    value={customTokens.colors.secondary || '#000000'}
                    onChange={(v) => handleColorChange('secondary', v)}
                    description="Secondary accent color"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Background Colors</CardTitle>
                  <CardDescription>Page and surface backgrounds</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <ColorInput
                    label="Background"
                    value={customTokens.colors.background}
                    onChange={(v) => handleColorChange('background', v)}
                    description="Main page background"
                  />
                  <ColorInput
                    label="Background Secondary"
                    value={customTokens.colors.backgroundSecondary || customTokens.colors.background}
                    onChange={(v) => handleColorChange('backgroundSecondary', v)}
                    description="Secondary background"
                  />
                  <ColorInput
                    label="Surface"
                    value={customTokens.colors.surface || customTokens.colors.background}
                    onChange={(v) => handleColorChange('surface', v)}
                    description="Card and component surfaces"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Text Colors</CardTitle>
                  <CardDescription>Primary and secondary text</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <ColorInput
                    label="Text"
                    value={customTokens.colors.text}
                    onChange={(v) => handleColorChange('text', v)}
                    description="Primary text color"
                  />
                  <ColorInput
                    label="Text Secondary"
                    value={customTokens.colors.textSecondary || customTokens.colors.text}
                    onChange={(v) => handleColorChange('textSecondary', v)}
                    description="Muted text color"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status Colors</CardTitle>
                  <CardDescription>Success, warning, error, and info</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <ColorInput
                    label="Success"
                    value={customTokens.colors.success || '#10b981'}
                    onChange={(v) => handleColorChange('success', v)}
                  />
                  <ColorInput
                    label="Warning"
                    value={customTokens.colors.warning || '#f59e0b'}
                    onChange={(v) => handleColorChange('warning', v)}
                  />
                  <ColorInput
                    label="Error"
                    value={customTokens.colors.error || '#ef4444'}
                    onChange={(v) => handleColorChange('error', v)}
                  />
                  <ColorInput
                    label="Info"
                    value={customTokens.colors.info || '#3b82f6'}
                    onChange={(v) => handleColorChange('info', v)}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Typography Tab */}
            <TabsContent value="typography" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Typography</CardTitle>
                  <CardDescription>Fonts and text settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Body Font Family</Label>
                    <Select
                      value={customTokens.typography.fontFamily.split(',')[0].replace(/'/g, '')}
                      onValueChange={(v) =>
                        handleTypographyChange('fontFamily', `'${v}', system-ui, sans-serif`)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Futura Medium">Futura Medium</SelectItem>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="-apple-system">System Font</SelectItem>
                        <SelectItem value="Georgia">Georgia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Heading Font Family</Label>
                    <Select
                      value={(customTokens.typography.fontFamilyHeading || customTokens.typography.fontFamily).split(',')[0].replace(/'/g, '')}
                      onValueChange={(v) =>
                        handleTypographyChange('fontFamilyHeading', `'${v}', system-ui, sans-serif`)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Futura Bold">Futura Bold</SelectItem>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="-apple-system">System Font</SelectItem>
                        <SelectItem value="Georgia">Georgia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Base Font Size</Label>
                      <Select
                        value={customTokens.typography.fontSizeBase || '1rem'}
                        onValueChange={(v) => handleTypographyChange('fontSizeBase', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.875rem">14px (0.875rem)</SelectItem>
                          <SelectItem value="0.9375rem">15px (0.9375rem)</SelectItem>
                          <SelectItem value="1rem">16px (1rem)</SelectItem>
                          <SelectItem value="1.125rem">18px (1.125rem)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Line Height</Label>
                      <Select
                        value={String(customTokens.typography.lineHeightBase || 1.5)}
                        onValueChange={(v) => handleTypographyChange('lineHeightBase', parseFloat(v))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1.25">Tight (1.25)</SelectItem>
                          <SelectItem value="1.4">Snug (1.4)</SelectItem>
                          <SelectItem value="1.5">Normal (1.5)</SelectItem>
                          <SelectItem value="1.75">Relaxed (1.75)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Effects Tab */}
            <TabsContent value="effects" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Effects & Styling</CardTitle>
                  <CardDescription>Border radius, shadows, and more</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Border Radius</Label>
                    <Select
                      value={customTokens.effects?.borderRadius || '8px'}
                      onValueChange={(v) => handleEffectChange('borderRadius', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0px">None (0px)</SelectItem>
                        <SelectItem value="4px">Small (4px)</SelectItem>
                        <SelectItem value="6px">Medium (6px)</SelectItem>
                        <SelectItem value="8px">Default (8px)</SelectItem>
                        <SelectItem value="12px">Large (12px)</SelectItem>
                        <SelectItem value="16px">Extra Large (16px)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Glass Effect Blur</Label>
                    <Select
                      value={customTokens.effects?.glassBlur || '12px'}
                      onValueChange={(v) => handleEffectChange('glassBlur', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4px">Light (4px)</SelectItem>
                        <SelectItem value="8px">Medium (8px)</SelectItem>
                        <SelectItem value="12px">Default (12px)</SelectItem>
                        <SelectItem value="16px">Heavy (16px)</SelectItem>
                        <SelectItem value="24px">Extra Heavy (24px)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Preview Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Live Preview</CardTitle>
                  <CardDescription>
                    See changes in real-time
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Eye className="mr-2 h-4 w-4" />
                  Full Preview
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <LivePreview tokens={customTokens} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CSS Variables</CardTitle>
              <CardDescription>
                Copy and paste into your custom CSS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="rounded-lg bg-muted p-4 text-xs overflow-auto max-h-64">
                {`:root {
  --primary: ${customTokens.colors.primary};
  --primary-dark: ${customTokens.colors.primaryDark || customTokens.colors.primary};
  --primary-light: ${customTokens.colors.primaryLight || customTokens.colors.primary};
  --background: ${customTokens.colors.background};
  --surface: ${customTokens.colors.surface || customTokens.colors.background};
  --text: ${customTokens.colors.text};
  --text-secondary: ${customTokens.colors.textSecondary || customTokens.colors.text};
  --font-family: ${customTokens.typography.fontFamily};
  --font-family-heading: ${customTokens.typography.fontFamilyHeading || customTokens.typography.fontFamily};
  --border-radius: ${customTokens.effects?.borderRadius || '8px'};
}`}
              </pre>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  navigator.clipboard.writeText(`:root {
  --primary: ${customTokens.colors.primary};
  --primary-dark: ${customTokens.colors.primaryDark || customTokens.colors.primary};
  --background: ${customTokens.colors.background};
  --text: ${customTokens.colors.text};
}`);
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy CSS
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
