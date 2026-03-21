import { useParams, Link } from 'react-router-dom';
import {
  Palette,
  Save,
  Eye,
  ArrowLeft,
  Sun,
  Moon,
  RotateCcw,
  Copy,
  Check,
  Type,
  Layers,
  Sparkles,
  Space,
  MousePointer2,
  Wand2,
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
  Separator,
  cn,
} from '@netrun-cms/ui';
import {
  useTheme,
  themePresets,
  type ThemePreset,
} from '@netrun-cms/theme';
import type { ThemeTokens, ColorTokens, TypographyTokens, EffectTokens, SpacingTokens } from '@netrun-cms/core';
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { FontBrowser, type CustomFont, generateFontFaceCss } from '../../components/FontBrowser';
import { AIDesignPanel } from '../../components/AIDesignPanel';
import { DesignAdvisor } from '../../components/DesignAdvisor';
import { usePermissions } from '../../hooks/usePermissions';

// ============================================================================
// CONTROLS
// ============================================================================

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
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-sm">{label}</Label>
        <button
          onClick={handleCopy}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {copied ? (
            <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Copied</span>
          ) : (
            <span className="flex items-center gap-1"><Copy className="h-3 w-3" /> Copy</span>
          )}
        </button>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-md border cursor-pointer flex-shrink-0" style={{ backgroundColor: value }}>
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
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  description?: string;
}

function SliderControl({ label, value, min, max, step = 1, unit = '', onChange, description }: SliderControlProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm">{label}</Label>
        <span className="text-sm font-mono text-muted-foreground">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-primary h-2 rounded-lg appearance-none cursor-pointer bg-muted"
      />
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}

interface ButtonShapePickerProps {
  value: string;
  onChange: (value: string) => void;
}

function ButtonShapePicker({ value, onChange }: ButtonShapePickerProps) {
  const shapes = [
    { id: '0px', label: 'Square', preview: '0px' },
    { id: '4px', label: 'Subtle', preview: '4px' },
    { id: '8px', label: 'Rounded', preview: '8px' },
    { id: '12px', label: 'Soft', preview: '12px' },
    { id: '9999px', label: 'Pill', preview: '9999px' },
  ];

  return (
    <div className="space-y-2">
      <Label className="text-sm">Button Shape</Label>
      <div className="flex gap-2">
        {shapes.map((shape) => (
          <button
            key={shape.id}
            onClick={() => onChange(shape.id)}
            className={cn(
              'flex-1 px-3 py-2 text-xs font-medium border transition-all',
              value === shape.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-muted-foreground/20 hover:border-primary/50'
            )}
            style={{ borderRadius: shape.preview }}
          >
            {shape.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface ShadowIntensityPickerProps {
  valueSm: string;
  valueMd: string;
  valueLg: string;
  shadowColor: string;
  onChange: (key: 'shadowSm' | 'shadowMd' | 'shadowLg' | 'shadowColor', value: string) => void;
}

function ShadowIntensityPicker({ valueSm, valueMd, valueLg, shadowColor, onChange }: ShadowIntensityPickerProps) {
  const presets = [
    { id: 'none', label: 'Flat', sm: 'none', md: 'none', lg: 'none' },
    { id: 'subtle', label: 'Subtle', sm: '0 1px 2px', md: '0 2px 8px', lg: '0 4px 16px' },
    { id: 'medium', label: 'Medium', sm: '0 1px 3px', md: '0 4px 12px', lg: '0 8px 24px' },
    { id: 'dramatic', label: 'Dramatic', sm: '0 2px 4px', md: '0 8px 24px', lg: '0 16px 48px' },
    { id: 'lifted', label: 'Lifted', sm: '0 4px 6px -1px', md: '0 10px 30px -5px', lg: '0 20px 60px -10px' },
  ];

  const current = presets.find((p) =>
    p.sm === valueSm?.replace(/ rgba?\([^)]+\)$/, '').replace(/ #[0-9a-f]+$/i, '')
  ) || presets[2];

  return (
    <div className="space-y-3">
      <Label className="text-sm">Shadow Intensity</Label>
      <div className="grid grid-cols-5 gap-2">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => {
              const color = shadowColor || 'rgba(0,0,0,0.15)';
              onChange('shadowSm', preset.sm === 'none' ? 'none' : `${preset.sm} ${color}`);
              onChange('shadowMd', preset.md === 'none' ? 'none' : `${preset.md} ${color}`);
              onChange('shadowLg', preset.lg === 'none' ? 'none' : `${preset.lg} ${color}`);
            }}
            className={cn(
              'p-3 rounded-lg border text-xs font-medium transition-all',
              current.id === preset.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-muted-foreground/20 hover:border-primary/50'
            )}
          >
            <div
              className="h-6 w-full rounded bg-background mb-1"
              style={{ boxShadow: preset.md === 'none' ? 'none' : `${preset.md} rgba(0,0,0,0.2)` }}
            />
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// PRESET CARD
// ============================================================================

function PresetCard({ preset, isSelected, onSelect }: { preset: ThemePreset; isSelected: boolean; onSelect: () => void }) {
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
        <div className="h-6 w-6 rounded-l-md" style={{ backgroundColor: preset.darkTokens.colors.primary }} />
        <div className="h-6 w-6" style={{ backgroundColor: preset.darkTokens.colors.background }} />
        <div className="h-6 w-6 rounded-r-md" style={{ backgroundColor: preset.darkTokens.colors.text }} />
      </div>
      <p className="font-medium">{preset.name}</p>
      <p className="text-sm text-muted-foreground">{preset.description}</p>
    </button>
  );
}

// ============================================================================
// LIVE PREVIEW — Full-page website mockup
// ============================================================================

function LivePreview({ tokens }: { tokens: ThemeTokens }) {
  const btnRadius = tokens.effects?.buttonRadius || tokens.effects?.borderRadius || '8px';
  const cardRadius = tokens.effects?.cardRadius || tokens.effects?.borderRadiusLg || '12px';
  const inputRadius = tokens.effects?.inputRadius || tokens.effects?.borderRadius || '8px';
  const shadowMd = tokens.effects?.shadowMd || '0 4px 12px rgba(0,0,0,0.15)';
  const transition = tokens.effects?.transitionSpeed || '150ms';
  const hoverScale = tokens.effects?.hoverScale || '1';
  const headingFont = tokens.typography.fontFamilyHeading || tokens.typography.fontFamily;
  const headingWeight = tokens.typography.fontWeightBold || 700;
  const headingLetterSpacing = tokens.typography.letterSpacingHeading || '0';
  const headingTransform = tokens.typography.textTransformHeading || 'none';
  const baseFontSize = tokens.typography.fontSizeBase || '1rem';
  const lineHeight = tokens.typography.lineHeightBase || 1.5;
  const sectionPad = tokens.spacing?.sectionPadding || '2rem';

  return (
    <div
      className="rounded-lg border overflow-hidden text-sm"
      style={{
        backgroundColor: tokens.colors.background,
        color: tokens.colors.text,
        fontFamily: tokens.typography.fontFamily,
        fontSize: baseFontSize,
        lineHeight,
      }}
    >
      {/* Navigation Bar */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{
          backgroundColor: tokens.colors.surface || tokens.colors.backgroundSecondary || tokens.colors.background,
          borderColor: tokens.colors.border || 'rgba(128,128,128,0.2)',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md" style={{ backgroundColor: tokens.colors.primary }} />
          <span
            className="font-bold text-sm"
            style={{
              fontFamily: headingFont,
              letterSpacing: headingLetterSpacing,
              textTransform: headingTransform as React.CSSProperties['textTransform'],
            }}
          >
            Brand Name
          </span>
        </div>
        <div className="flex gap-3 text-xs" style={{ color: tokens.colors.textSecondary || tokens.colors.text }}>
          <span>Home</span>
          <span>About</span>
          <span style={{ color: tokens.colors.link || tokens.colors.primary }}>Contact</span>
        </div>
      </div>

      {/* Hero Section */}
      <div style={{ padding: sectionPad }} className="space-y-3">
        <h1
          style={{
            fontFamily: headingFont,
            fontWeight: headingWeight,
            fontSize: tokens.typography.fontSizeH1 || '1.75rem',
            lineHeight: tokens.typography.lineHeightHeading || 1.2,
            letterSpacing: headingLetterSpacing,
            textTransform: headingTransform as React.CSSProperties['textTransform'],
          }}
        >
          Design Playground
        </h1>
        <h2
          style={{
            fontFamily: headingFont,
            fontWeight: tokens.typography.fontWeightMedium || 500,
            fontSize: tokens.typography.fontSizeH2 || '1.25rem',
            lineHeight: tokens.typography.lineHeightHeading || 1.2,
            color: tokens.colors.textSecondary || tokens.colors.text,
            letterSpacing: headingLetterSpacing,
          }}
        >
          See your changes in real-time
        </h2>
        <p style={{ color: tokens.colors.textMuted || tokens.colors.textSecondary || tokens.colors.text, fontSize: tokens.typography.fontSizeSm || '0.875rem' }}>
          Adjust typography, colors, button shapes, shadows, spacing, and effects to dramatically transform the look and feel.
        </p>

        {/* Buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            className="px-4 py-2 text-xs font-medium"
            style={{
              backgroundColor: tokens.colors.primary,
              color: tokens.colors.background,
              borderRadius: btnRadius,
              transition: `all ${transition}`,
              boxShadow: tokens.effects?.shadowSm || 'none',
            }}
          >
            Primary Action
          </button>
          <button
            className="px-4 py-2 text-xs font-medium border"
            style={{
              borderColor: tokens.colors.primary,
              color: tokens.colors.primary,
              borderRadius: btnRadius,
              backgroundColor: 'transparent',
              transition: `all ${transition}`,
            }}
          >
            Secondary
          </button>
          <button
            className="px-4 py-2 text-xs font-medium"
            style={{
              backgroundColor: tokens.colors.accent || tokens.colors.secondary || tokens.colors.primary,
              color: tokens.colors.background,
              borderRadius: btnRadius,
              transition: `all ${transition}`,
            }}
          >
            Accent
          </button>
          <button
            className="px-3 py-2 text-xs"
            style={{
              color: tokens.colors.textSecondary || tokens.colors.text,
              borderRadius: btnRadius,
              textDecoration: 'underline',
              backgroundColor: 'transparent',
            }}
          >
            Text Link
          </button>
        </div>
      </div>

      {/* Cards Row */}
      <div className="grid grid-cols-2 gap-3 px-4 pb-4" style={{ padding: `0 ${sectionPad} ${sectionPad}` }}>
        <div
          className="p-3 space-y-1"
          style={{
            backgroundColor: tokens.colors.surface || tokens.colors.backgroundSecondary || tokens.colors.background,
            borderRadius: cardRadius,
            boxShadow: shadowMd,
            transition: `all ${transition}`,
            transform: `scale(${hoverScale === '1' ? '1' : '1'})`,
          }}
        >
          <h3 className="font-semibold text-xs" style={{ fontFamily: headingFont, letterSpacing: headingLetterSpacing, textTransform: headingTransform as React.CSSProperties['textTransform'] }}>Feature Card</h3>
          <p className="text-xs" style={{ color: tokens.colors.textSecondary || tokens.colors.text }}>
            Cards with surface colors, shadows, and rounded corners.
          </p>
          <span className="inline-block text-xs mt-1" style={{ color: tokens.colors.link || tokens.colors.primary }}>
            Learn more →
          </span>
        </div>
        <div
          className="p-3 space-y-1"
          style={{
            backgroundColor: tokens.colors.surface || tokens.colors.backgroundSecondary || tokens.colors.background,
            borderRadius: cardRadius,
            boxShadow: shadowMd,
          }}
        >
          <h3 className="font-semibold text-xs" style={{ fontFamily: headingFont, letterSpacing: headingLetterSpacing, textTransform: headingTransform as React.CSSProperties['textTransform'] }}>Another Card</h3>
          <p className="text-xs" style={{ color: tokens.colors.textSecondary || tokens.colors.text }}>
            Consistent styling across the entire component library.
          </p>
          <div className="flex gap-1 mt-1">
            <span className="px-1.5 py-0.5 text-[10px] rounded" style={{ backgroundColor: tokens.colors.success, color: '#fff', borderRadius: tokens.effects?.borderRadiusSm || '4px' }}>Active</span>
            <span className="px-1.5 py-0.5 text-[10px] rounded" style={{ backgroundColor: tokens.colors.info, color: '#fff', borderRadius: tokens.effects?.borderRadiusSm || '4px' }}>New</span>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div
        className="mx-4 mb-4 p-3 space-y-2"
        style={{
          backgroundColor: tokens.colors.surface || tokens.colors.backgroundSecondary || tokens.colors.background,
          borderRadius: cardRadius,
          border: `1px solid ${tokens.colors.border || 'rgba(128,128,128,0.2)'}`,
        }}
      >
        <h3 className="text-xs font-semibold" style={{ fontFamily: headingFont }}>Contact Form</h3>
        <div className="grid grid-cols-2 gap-2">
          <input
            placeholder="Name"
            className="px-2 py-1.5 text-xs border bg-transparent"
            style={{
              borderColor: tokens.colors.border || 'rgba(128,128,128,0.3)',
              borderRadius: inputRadius,
              color: tokens.colors.text,
            }}
            readOnly
          />
          <input
            placeholder="Email"
            className="px-2 py-1.5 text-xs border bg-transparent"
            style={{
              borderColor: tokens.colors.border || 'rgba(128,128,128,0.3)',
              borderRadius: inputRadius,
              color: tokens.colors.text,
            }}
            readOnly
          />
        </div>
        <button
          className="w-full px-3 py-1.5 text-xs font-medium"
          style={{
            backgroundColor: tokens.colors.primary,
            color: tokens.colors.background,
            borderRadius: btnRadius,
          }}
        >
          Send Message
        </button>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-1.5 px-4 pb-4">
        <span className="px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: tokens.colors.success, color: '#fff', borderRadius: tokens.effects?.borderRadiusFull || '9999px' }}>Success</span>
        <span className="px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: tokens.colors.warning, color: '#000', borderRadius: tokens.effects?.borderRadiusFull || '9999px' }}>Warning</span>
        <span className="px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: tokens.colors.error, color: '#fff', borderRadius: tokens.effects?.borderRadiusFull || '9999px' }}>Error</span>
        <span className="px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: tokens.colors.info, color: '#fff', borderRadius: tokens.effects?.borderRadiusFull || '9999px' }}>Info</span>
      </div>

      {/* Glass Effect Demo */}
      {tokens.effects?.glassBlur && tokens.effects.glassBlur !== '0px' && (
        <div
          className="mx-4 mb-4 p-3"
          style={{
            backdropFilter: `blur(${tokens.effects.glassBlur})`,
            backgroundColor: tokens.effects.glassBg || 'rgba(255,255,255,0.05)',
            borderRadius: cardRadius,
            border: `1px solid ${tokens.colors.border || 'rgba(255,255,255,0.1)'}`,
          }}
        >
          <p className="text-xs font-medium">Glass Effect Panel</p>
          <p className="text-xs" style={{ color: tokens.colors.textMuted || tokens.colors.textSecondary }}>Frosted glass with backdrop blur</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// THEME EDITOR
// ============================================================================

export function ThemeEditor() {
  const { siteId } = useParams();
  const { tokens, setMode, setSiteTheme, applyTokenOverrides } = useTheme();
  const { canEdit } = usePermissions();

  const [selectedPreset, setSelectedPreset] = useState<string>('netrun-dark');
  const [customTokens, setCustomTokens] = useState<ThemeTokens>(tokens);
  const [previewMode, setPreviewMode] = useState<'dark' | 'light'>('dark');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);
  const [activeThemeId, setActiveThemeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCustomTokens(tokens);
  }, [tokens]);

  // Load active theme from API
  useEffect(() => {
    if (!siteId) return;
    api.get<{ data: Record<string, unknown> }>('/sites/' + siteId + '/themes/active').then((res) => {
      const theme = res.data;
      if (theme && theme.id) {
        setActiveThemeId(theme.id as string);
        if (theme.baseTheme) {
          setSelectedPreset(theme.baseTheme as string);
        }
        if (theme.tokens) {
          const savedTokens = theme.tokens as ThemeTokens;
          setCustomTokens(savedTokens);
          setSiteTheme({ darkTokens: savedTokens, lightTokens: savedTokens });
        }
      }
    }).catch(() => {
      // No active theme yet — that's fine, use defaults
    });
  }, [siteId, setSiteTheme]);

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = themePresets.find((p) => p.id === presetId);
    if (preset) {
      const newTokens = previewMode === 'dark' ? preset.darkTokens : preset.lightTokens;
      setCustomTokens(newTokens);
      setSiteTheme({ darkTokens: preset.darkTokens, lightTokens: preset.lightTokens });
      setHasChanges(true);
    }
  };

  const updateTokens = useCallback((path: string, key: string, value: string | number) => {
    setCustomTokens((prev) => {
      const section = prev[path as keyof ThemeTokens];
      const updated = { ...prev, [path]: { ...(section as object), [key]: value } };
      return updated;
    });
    applyTokenOverrides({ [path]: { [key]: value } });
    setHasChanges(true);
  }, [applyTokenOverrides]);

  const handleColorChange = (key: keyof ColorTokens, value: string) => updateTokens('colors', key, value);
  const handleTypographyChange = (key: keyof TypographyTokens, value: string | number) => updateTokens('typography', key, value);
  const handleEffectChange = (key: keyof EffectTokens, value: string) => updateTokens('effects', key, value);
  const handleSpacingChange = (key: keyof SpacingTokens, value: string) => updateTokens('spacing', key, value);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        name: selectedPreset.charAt(0).toUpperCase() + selectedPreset.slice(1).replace(/-/g, ' '),
        baseTheme: selectedPreset,
        isActive: true,
        tokens: customTokens,
      };
      if (activeThemeId) {
        await api.put('/sites/' + siteId + '/themes/' + activeThemeId, payload);
      } else {
        const res = await api.post<{ data: { id: string } }>('/sites/' + siteId + '/themes', payload);
        setActiveThemeId(res.data.id);
      }
      setHasChanges(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const preset = themePresets.find((p) => p.id === selectedPreset);
    if (preset) {
      const newTokens = previewMode === 'dark' ? preset.darkTokens : preset.lightTokens;
      setCustomTokens(newTokens);
      setSiteTheme({ darkTokens: preset.darkTokens, lightTokens: preset.lightTokens });
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
            <h1 className="text-3xl font-bold tracking-tight">Design Playground</h1>
            <p className="text-muted-foreground">
              Dramatically transform every visual aspect of your site
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!canEdit && (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              View Only
            </span>
          )}
          {hasChanges && canEdit && (
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          )}
          {canEdit && (
            <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Theme'}
            </Button>
          )}
        </div>
      </div>

      {!canEdit && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          You are viewing this theme in read-only mode. Only admins and editors can save changes.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

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
                  onClick={() => { setPreviewMode('dark'); setMode('dark'); }}
                >
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </Button>
                <Button
                  variant={previewMode === 'light' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => { setPreviewMode('light'); setMode('light'); }}
                >
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Editing: <strong className="capitalize">{previewMode}</strong> mode
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Design Tools — collapsible panels above the editor */}
      {siteId && canEdit && (
        <div className="grid gap-4 lg:grid-cols-2">
          <AIDesignPanel siteId={siteId} />
          <DesignAdvisor
            siteId={siteId}
            themeTokens={customTokens}
            siteName={siteId}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Editor Panel */}
        <div className="space-y-6">
          <Tabs defaultValue="presets">
            <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="presets" className="flex-1 min-w-0">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Presets
              </TabsTrigger>
              <TabsTrigger value="colors" className="flex-1 min-w-0">
                <Palette className="mr-1.5 h-3.5 w-3.5" />
                Colors
              </TabsTrigger>
              <TabsTrigger value="typography" className="flex-1 min-w-0">
                <Type className="mr-1.5 h-3.5 w-3.5" />
                Type
              </TabsTrigger>
              <TabsTrigger value="shapes" className="flex-1 min-w-0">
                <MousePointer2 className="mr-1.5 h-3.5 w-3.5" />
                Shapes
              </TabsTrigger>
              <TabsTrigger value="effects" className="flex-1 min-w-0">
                <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                Effects
              </TabsTrigger>
              <TabsTrigger value="spacing" className="flex-1 min-w-0">
                <Space className="mr-1.5 h-3.5 w-3.5" />
                Spacing
              </TabsTrigger>
            </TabsList>

            {/* Presets Tab */}
            <TabsContent value="presets" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Theme Presets</CardTitle>
                  <CardDescription>Start from a preset, then make it yours</CardDescription>
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
                  <CardDescription>Primary, secondary, and accent</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <ColorInput label="Primary" value={customTokens.colors.primary} onChange={(v) => handleColorChange('primary', v)} description="Main brand color" />
                  <ColorInput label="Primary Dark" value={customTokens.colors.primaryDark || customTokens.colors.primary} onChange={(v) => handleColorChange('primaryDark', v)} description="Hover & active states" />
                  <ColorInput label="Primary Light" value={customTokens.colors.primaryLight || customTokens.colors.primary} onChange={(v) => handleColorChange('primaryLight', v)} description="Tints & highlights" />
                  <ColorInput label="Secondary" value={customTokens.colors.secondary || '#000000'} onChange={(v) => handleColorChange('secondary', v)} />
                  <ColorInput label="Accent" value={customTokens.colors.accent || customTokens.colors.primary} onChange={(v) => handleColorChange('accent', v)} description="Eye-catching highlights" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Backgrounds & Surfaces</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <ColorInput label="Background" value={customTokens.colors.background} onChange={(v) => handleColorChange('background', v)} description="Page background" />
                  <ColorInput label="Background Alt" value={customTokens.colors.backgroundSecondary || customTokens.colors.background} onChange={(v) => handleColorChange('backgroundSecondary', v)} />
                  <ColorInput label="Surface" value={customTokens.colors.surface || customTokens.colors.background} onChange={(v) => handleColorChange('surface', v)} description="Cards & panels" />
                  <ColorInput label="Border" value={customTokens.colors.border || '#333333'} onChange={(v) => handleColorChange('border', v)} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Text & Links</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <ColorInput label="Text" value={customTokens.colors.text} onChange={(v) => handleColorChange('text', v)} />
                  <ColorInput label="Text Secondary" value={customTokens.colors.textSecondary || customTokens.colors.text} onChange={(v) => handleColorChange('textSecondary', v)} />
                  <ColorInput label="Text Muted" value={customTokens.colors.textMuted || '#666666'} onChange={(v) => handleColorChange('textMuted', v)} description="Captions & placeholders" />
                  <ColorInput label="Link" value={customTokens.colors.link || customTokens.colors.primary} onChange={(v) => handleColorChange('link', v)} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Status Colors</CardTitle></CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <ColorInput label="Success" value={customTokens.colors.success || '#10b981'} onChange={(v) => handleColorChange('success', v)} />
                  <ColorInput label="Warning" value={customTokens.colors.warning || '#f59e0b'} onChange={(v) => handleColorChange('warning', v)} />
                  <ColorInput label="Error" value={customTokens.colors.error || '#ef4444'} onChange={(v) => handleColorChange('error', v)} />
                  <ColorInput label="Info" value={customTokens.colors.info || '#3b82f6'} onChange={(v) => handleColorChange('info', v)} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Typography Tab */}
            <TabsContent value="typography" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Font Families</CardTitle>
                  <CardDescription>Browse 70+ Google Fonts or upload your own .woff2/.ttf/.otf files</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FontBrowser
                    label="Body Font"
                    currentFont={customTokens.typography.fontFamily}
                    customFonts={customFonts}
                    onSelect={(family) => handleTypographyChange('fontFamily', family)}
                    onCustomFontsChange={(fonts, css) => {
                      setCustomFonts(fonts);
                      // Inject @font-face rules so custom fonts render everywhere
                      let el = document.getElementById('netrun-cms-custom-fonts');
                      if (!el) { el = document.createElement('style'); el.id = 'netrun-cms-custom-fonts'; document.head.appendChild(el); }
                      el.textContent = css;
                    }}
                  />
                  <FontBrowser
                    label="Heading Font"
                    currentFont={customTokens.typography.fontFamilyHeading || customTokens.typography.fontFamily}
                    customFonts={customFonts}
                    onSelect={(family) => handleTypographyChange('fontFamilyHeading', family)}
                    onCustomFontsChange={(fonts, css) => {
                      setCustomFonts(fonts);
                      let el = document.getElementById('netrun-cms-custom-fonts');
                      if (!el) { el = document.createElement('style'); el.id = 'netrun-cms-custom-fonts'; document.head.appendChild(el); }
                      el.textContent = css;
                    }}
                  />
                  <FontBrowser
                    label="Monospace Font"
                    currentFont={customTokens.typography.fontFamilyMono || "'JetBrains Mono', monospace"}
                    customFonts={customFonts}
                    onSelect={(family) => handleTypographyChange('fontFamilyMono', family)}
                    onCustomFontsChange={(fonts, css) => {
                      setCustomFonts(fonts);
                      let el = document.getElementById('netrun-cms-custom-fonts');
                      if (!el) { el = document.createElement('style'); el.id = 'netrun-cms-custom-fonts'; document.head.appendChild(el); }
                      el.textContent = css;
                    }}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Heading Scale</CardTitle><CardDescription>Control the visual hierarchy</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <SliderControl label="H1 Size" value={parseFloat(customTokens.typography.fontSizeH1 || '2.25')} min={1.5} max={4} step={0.125} unit="rem" onChange={(v) => handleTypographyChange('fontSizeH1', `${v}rem`)} />
                  <SliderControl label="H2 Size" value={parseFloat(customTokens.typography.fontSizeH2 || '1.5')} min={1} max={3} step={0.125} unit="rem" onChange={(v) => handleTypographyChange('fontSizeH2', `${v}rem`)} />
                  <SliderControl label="H3 Size" value={parseFloat(customTokens.typography.fontSizeH3 || '1.25')} min={0.875} max={2} step={0.125} unit="rem" onChange={(v) => handleTypographyChange('fontSizeH3', `${v}rem`)} />
                  <Separator />
                  <SliderControl label="Base Font Size" value={parseFloat(customTokens.typography.fontSizeBase || '1')} min={0.75} max={1.25} step={0.0625} unit="rem" onChange={(v) => handleTypographyChange('fontSizeBase', `${v}rem`)} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Weight, Spacing & Transform</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <SliderControl label="Body Weight" value={customTokens.typography.fontWeightNormal || 400} min={300} max={500} step={100} onChange={(v) => handleTypographyChange('fontWeightNormal', v)} />
                  <SliderControl label="Bold Weight" value={customTokens.typography.fontWeightBold || 700} min={500} max={900} step={100} onChange={(v) => handleTypographyChange('fontWeightBold', v)} />
                  <SliderControl label="Line Height" value={customTokens.typography.lineHeightBase || 1.5} min={1.1} max={2} step={0.05} onChange={(v) => handleTypographyChange('lineHeightBase', v)} />
                  <SliderControl label="Heading Line Height" value={customTokens.typography.lineHeightHeading || 1.2} min={0.9} max={1.6} step={0.05} onChange={(v) => handleTypographyChange('lineHeightHeading', v)} />
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-sm">Letter Spacing (Headings)</Label>
                    <Select
                      value={customTokens.typography.letterSpacingHeading || '0'}
                      onValueChange={(v) => handleTypographyChange('letterSpacingHeading', v)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="-0.03em">Tight (-0.03em)</SelectItem>
                        <SelectItem value="-0.01em">Snug (-0.01em)</SelectItem>
                        <SelectItem value="0">Normal</SelectItem>
                        <SelectItem value="0.025em">Wide (0.025em)</SelectItem>
                        <SelectItem value="0.05em">Wider (0.05em)</SelectItem>
                        <SelectItem value="0.1em">Widest (0.1em)</SelectItem>
                        <SelectItem value="0.2em">Ultra Wide (0.2em)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Heading Text Transform</Label>
                    <Select
                      value={customTokens.typography.textTransformHeading || 'none'}
                      onValueChange={(v) => handleTypographyChange('textTransformHeading', v)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="uppercase">UPPERCASE</SelectItem>
                        <SelectItem value="lowercase">lowercase</SelectItem>
                        <SelectItem value="capitalize">Capitalize</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Shapes Tab */}
            <TabsContent value="shapes" className="mt-4 space-y-4">
              <Card>
                <CardHeader><CardTitle>Button Shape</CardTitle><CardDescription>Dramatically changes the feel — square is corporate, pill is playful</CardDescription></CardHeader>
                <CardContent>
                  <ButtonShapePicker
                    value={customTokens.effects?.buttonRadius || customTokens.effects?.borderRadius || '8px'}
                    onChange={(v) => handleEffectChange('buttonRadius', v)}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Component Radii</CardTitle><CardDescription>Fine-tune each element independently</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <SliderControl label="Cards" value={parseInt(customTokens.effects?.cardRadius || customTokens.effects?.borderRadiusLg || '12')} min={0} max={24} unit="px" onChange={(v) => handleEffectChange('cardRadius', `${v}px`)} />
                  <SliderControl label="Inputs" value={parseInt(customTokens.effects?.inputRadius || customTokens.effects?.borderRadius || '8')} min={0} max={16} unit="px" onChange={(v) => handleEffectChange('inputRadius', `${v}px`)} />
                  <SliderControl label="Badges / Tags" value={parseInt(customTokens.effects?.borderRadiusSm || '4')} min={0} max={16} unit="px" onChange={(v) => handleEffectChange('borderRadiusSm', `${v}px`)} />
                  <SliderControl label="Default Radius" value={parseInt(customTokens.effects?.borderRadius || '8')} min={0} max={24} unit="px" onChange={(v) => handleEffectChange('borderRadius', `${v}px`)} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Effects Tab */}
            <TabsContent value="effects" className="mt-4 space-y-4">
              <Card>
                <CardHeader><CardTitle>Shadows</CardTitle></CardHeader>
                <CardContent>
                  <ShadowIntensityPicker
                    valueSm={customTokens.effects?.shadowSm || '0 1px 3px rgba(0,0,0,0.15)'}
                    valueMd={customTokens.effects?.shadowMd || '0 4px 12px rgba(0,0,0,0.15)'}
                    valueLg={customTokens.effects?.shadowLg || '0 8px 24px rgba(0,0,0,0.15)'}
                    shadowColor={customTokens.effects?.shadowColor || 'rgba(0,0,0,0.15)'}
                    onChange={(k, v) => handleEffectChange(k, v)}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Glass Effect</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <SliderControl label="Backdrop Blur" value={parseInt(customTokens.effects?.glassBlur || '12')} min={0} max={32} unit="px" onChange={(v) => handleEffectChange('glassBlur', `${v}px`)} />
                  <ColorInput label="Glass Background" value={customTokens.effects?.glassBg || 'rgba(255,255,255,0.05)'} onChange={(v) => handleEffectChange('glassBg', v)} description="Semi-transparent overlay" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Interactions</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Transition Speed</Label>
                    <Select
                      value={customTokens.effects?.transitionSpeed || '150ms'}
                      onValueChange={(v) => handleEffectChange('transitionSpeed', v)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0ms">Instant (0ms)</SelectItem>
                        <SelectItem value="100ms">Fast (100ms)</SelectItem>
                        <SelectItem value="150ms">Normal (150ms)</SelectItem>
                        <SelectItem value="250ms">Smooth (250ms)</SelectItem>
                        <SelectItem value="400ms">Slow (400ms)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Hover Scale</Label>
                    <Select
                      value={customTokens.effects?.hoverScale || '1'}
                      onValueChange={(v) => handleEffectChange('hoverScale', v)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">None</SelectItem>
                        <SelectItem value="1.02">Subtle (1.02x)</SelectItem>
                        <SelectItem value="1.05">Medium (1.05x)</SelectItem>
                        <SelectItem value="1.08">Dramatic (1.08x)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Spacing Tab */}
            <TabsContent value="spacing" className="mt-4">
              <Card>
                <CardHeader><CardTitle>Spacing Scale</CardTitle><CardDescription>Controls whitespace and breathing room</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <SliderControl label="XS" value={parseFloat(customTokens.spacing?.xs || '0.25')} min={0.125} max={0.5} step={0.125} unit="rem" onChange={(v) => handleSpacingChange('xs', `${v}rem`)} />
                  <SliderControl label="SM" value={parseFloat(customTokens.spacing?.sm || '0.5')} min={0.25} max={1} step={0.125} unit="rem" onChange={(v) => handleSpacingChange('sm', `${v}rem`)} />
                  <SliderControl label="MD" value={parseFloat(customTokens.spacing?.md || '1')} min={0.5} max={2} step={0.125} unit="rem" onChange={(v) => handleSpacingChange('md', `${v}rem`)} />
                  <SliderControl label="LG" value={parseFloat(customTokens.spacing?.lg || '1.5')} min={1} max={3} step={0.25} unit="rem" onChange={(v) => handleSpacingChange('lg', `${v}rem`)} />
                  <SliderControl label="XL" value={parseFloat(customTokens.spacing?.xl || '2')} min={1.5} max={4} step={0.25} unit="rem" onChange={(v) => handleSpacingChange('xl', `${v}rem`)} />
                  <SliderControl label="2XL" value={parseFloat(customTokens.spacing?.['2xl'] || '3')} min={2} max={6} step={0.5} unit="rem" onChange={(v) => handleSpacingChange('2xl', `${v}rem`)} />
                  <Separator />
                  <SliderControl label="Section Padding" value={parseFloat(customTokens.spacing?.sectionPadding || '2')} min={1} max={6} step={0.25} unit="rem" onChange={(v) => handleSpacingChange('sectionPadding', `${v}rem`)} description="Vertical padding between page sections" />
                  <div className="space-y-2">
                    <Label className="text-sm">Container Max Width</Label>
                    <Select
                      value={customTokens.spacing?.containerMaxWidth || '1200px'}
                      onValueChange={(v) => handleSpacingChange('containerMaxWidth', v)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="960px">Narrow (960px)</SelectItem>
                        <SelectItem value="1080px">Medium (1080px)</SelectItem>
                        <SelectItem value="1200px">Default (1200px)</SelectItem>
                        <SelectItem value="1440px">Wide (1440px)</SelectItem>
                        <SelectItem value="100%">Full Width</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Preview Panel (sticky) */}
        <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Live Preview</CardTitle>
                  <CardDescription>Changes apply instantly</CardDescription>
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
              <CardDescription>Copy into custom CSS</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="rounded-lg bg-muted p-4 text-xs overflow-auto max-h-48 font-mono">
                {`:root {
  --primary: ${customTokens.colors.primary};
  --primary-dark: ${customTokens.colors.primaryDark || customTokens.colors.primary};
  --accent: ${customTokens.colors.accent || customTokens.colors.primary};
  --background: ${customTokens.colors.background};
  --surface: ${customTokens.colors.surface || customTokens.colors.background};
  --text: ${customTokens.colors.text};
  --text-secondary: ${customTokens.colors.textSecondary || customTokens.colors.text};
  --border: ${customTokens.colors.border || 'rgba(128,128,128,0.2)'};
  --font-family: ${customTokens.typography.fontFamily};
  --font-heading: ${customTokens.typography.fontFamilyHeading || customTokens.typography.fontFamily};
  --font-size-h1: ${customTokens.typography.fontSizeH1 || '2.25rem'};
  --btn-radius: ${customTokens.effects?.buttonRadius || customTokens.effects?.borderRadius || '8px'};
  --card-radius: ${customTokens.effects?.cardRadius || '12px'};
  --shadow-md: ${customTokens.effects?.shadowMd || '0 4px 12px rgba(0,0,0,0.15)'};
  --transition: ${customTokens.effects?.transitionSpeed || '150ms'};
}`}
              </pre>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  navigator.clipboard.writeText(`:root {
  --primary: ${customTokens.colors.primary};
  --background: ${customTokens.colors.background};
  --surface: ${customTokens.colors.surface || customTokens.colors.background};
  --text: ${customTokens.colors.text};
  --font-family: ${customTokens.typography.fontFamily};
  --btn-radius: ${customTokens.effects?.buttonRadius || '8px'};
  --card-radius: ${customTokens.effects?.cardRadius || '12px'};
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
