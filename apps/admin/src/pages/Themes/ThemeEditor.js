import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams, Link } from 'react-router-dom';
import { Palette, Save, Eye, ArrowLeft, Sun, Moon, RotateCcw, Copy, Check, Type, Sparkles, Space, MousePointer2, Wand2, } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Tabs, TabsContent, TabsList, TabsTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Separator, cn, } from '@netrun-cms/ui';
import { useTheme, themePresets, } from '@netrun-cms/theme';
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { FontBrowser } from '../../components/FontBrowser';
function ColorInput({ label, value, onChange, description }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (_jsxs("div", { className: "space-y-1.5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Label, { className: "text-sm", children: label }), _jsx("button", { onClick: handleCopy, className: "text-xs text-muted-foreground hover:text-foreground", children: copied ? (_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Check, { className: "h-3 w-3" }), " Copied"] })) : (_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Copy, { className: "h-3 w-3" }), " Copy"] })) })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "h-9 w-9 rounded-md border cursor-pointer flex-shrink-0", style: { backgroundColor: value }, children: _jsx("input", { type: "color", value: value, onChange: (e) => onChange(e.target.value), className: "h-full w-full opacity-0 cursor-pointer" }) }), _jsx(Input, { value: value, onChange: (e) => onChange(e.target.value), className: "flex-1 font-mono text-sm", placeholder: "#000000" })] }), description && _jsx("p", { className: "text-xs text-muted-foreground", children: description })] }));
}
function SliderControl({ label, value, min, max, step = 1, unit = '', onChange, description }) {
    return (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Label, { className: "text-sm", children: label }), _jsxs("span", { className: "text-sm font-mono text-muted-foreground", children: [value, unit] })] }), _jsx("input", { type: "range", min: min, max: max, step: step, value: value, onChange: (e) => onChange(parseFloat(e.target.value)), className: "w-full accent-primary h-2 rounded-lg appearance-none cursor-pointer bg-muted" }), description && _jsx("p", { className: "text-xs text-muted-foreground", children: description })] }));
}
function ButtonShapePicker({ value, onChange }) {
    const shapes = [
        { id: '0px', label: 'Square', preview: '0px' },
        { id: '4px', label: 'Subtle', preview: '4px' },
        { id: '8px', label: 'Rounded', preview: '8px' },
        { id: '12px', label: 'Soft', preview: '12px' },
        { id: '9999px', label: 'Pill', preview: '9999px' },
    ];
    return (_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { className: "text-sm", children: "Button Shape" }), _jsx("div", { className: "flex gap-2", children: shapes.map((shape) => (_jsx("button", { onClick: () => onChange(shape.id), className: cn('flex-1 px-3 py-2 text-xs font-medium border transition-all', value === shape.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted-foreground/20 hover:border-primary/50'), style: { borderRadius: shape.preview }, children: shape.label }, shape.id))) })] }));
}
function ShadowIntensityPicker({ valueSm, valueMd, valueLg, shadowColor, onChange }) {
    const presets = [
        { id: 'none', label: 'Flat', sm: 'none', md: 'none', lg: 'none' },
        { id: 'subtle', label: 'Subtle', sm: '0 1px 2px', md: '0 2px 8px', lg: '0 4px 16px' },
        { id: 'medium', label: 'Medium', sm: '0 1px 3px', md: '0 4px 12px', lg: '0 8px 24px' },
        { id: 'dramatic', label: 'Dramatic', sm: '0 2px 4px', md: '0 8px 24px', lg: '0 16px 48px' },
        { id: 'lifted', label: 'Lifted', sm: '0 4px 6px -1px', md: '0 10px 30px -5px', lg: '0 20px 60px -10px' },
    ];
    const current = presets.find((p) => p.sm === valueSm?.replace(/ rgba?\([^)]+\)$/, '').replace(/ #[0-9a-f]+$/i, '')) || presets[2];
    return (_jsxs("div", { className: "space-y-3", children: [_jsx(Label, { className: "text-sm", children: "Shadow Intensity" }), _jsx("div", { className: "grid grid-cols-5 gap-2", children: presets.map((preset) => (_jsxs("button", { onClick: () => {
                        const color = shadowColor || 'rgba(0,0,0,0.15)';
                        onChange('shadowSm', preset.sm === 'none' ? 'none' : `${preset.sm} ${color}`);
                        onChange('shadowMd', preset.md === 'none' ? 'none' : `${preset.md} ${color}`);
                        onChange('shadowLg', preset.lg === 'none' ? 'none' : `${preset.lg} ${color}`);
                    }, className: cn('p-3 rounded-lg border text-xs font-medium transition-all', current.id === preset.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted-foreground/20 hover:border-primary/50'), children: [_jsx("div", { className: "h-6 w-full rounded bg-background mb-1", style: { boxShadow: preset.md === 'none' ? 'none' : `${preset.md} rgba(0,0,0,0.2)` } }), preset.label] }, preset.id))) })] }));
}
// ============================================================================
// PRESET CARD
// ============================================================================
function PresetCard({ preset, isSelected, onSelect }) {
    return (_jsxs("button", { onClick: onSelect, className: cn('group relative flex flex-col items-start rounded-lg border p-4 text-left transition-all hover:border-primary', isSelected && 'border-primary ring-2 ring-primary/20'), children: [isSelected && (_jsx("div", { className: "absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground", children: _jsx(Check, { className: "h-3 w-3" }) })), _jsxs("div", { className: "flex gap-1 mb-3", children: [_jsx("div", { className: "h-6 w-6 rounded-l-md", style: { backgroundColor: preset.darkTokens.colors.primary } }), _jsx("div", { className: "h-6 w-6", style: { backgroundColor: preset.darkTokens.colors.background } }), _jsx("div", { className: "h-6 w-6 rounded-r-md", style: { backgroundColor: preset.darkTokens.colors.text } })] }), _jsx("p", { className: "font-medium", children: preset.name }), _jsx("p", { className: "text-sm text-muted-foreground", children: preset.description })] }));
}
// ============================================================================
// LIVE PREVIEW — Full-page website mockup
// ============================================================================
function LivePreview({ tokens }) {
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
    return (_jsxs("div", { className: "rounded-lg border overflow-hidden text-sm", style: {
            backgroundColor: tokens.colors.background,
            color: tokens.colors.text,
            fontFamily: tokens.typography.fontFamily,
            fontSize: baseFontSize,
            lineHeight,
        }, children: [_jsxs("div", { className: "flex items-center justify-between px-4 py-3 border-b", style: {
                    backgroundColor: tokens.colors.surface || tokens.colors.backgroundSecondary || tokens.colors.background,
                    borderColor: tokens.colors.border || 'rgba(128,128,128,0.2)',
                }, children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "h-6 w-6 rounded-md", style: { backgroundColor: tokens.colors.primary } }), _jsx("span", { className: "font-bold text-sm", style: {
                                    fontFamily: headingFont,
                                    letterSpacing: headingLetterSpacing,
                                    textTransform: headingTransform,
                                }, children: "Brand Name" })] }), _jsxs("div", { className: "flex gap-3 text-xs", style: { color: tokens.colors.textSecondary || tokens.colors.text }, children: [_jsx("span", { children: "Home" }), _jsx("span", { children: "About" }), _jsx("span", { style: { color: tokens.colors.link || tokens.colors.primary }, children: "Contact" })] })] }), _jsxs("div", { style: { padding: sectionPad }, className: "space-y-3", children: [_jsx("h1", { style: {
                            fontFamily: headingFont,
                            fontWeight: headingWeight,
                            fontSize: tokens.typography.fontSizeH1 || '1.75rem',
                            lineHeight: tokens.typography.lineHeightHeading || 1.2,
                            letterSpacing: headingLetterSpacing,
                            textTransform: headingTransform,
                        }, children: "Design Playground" }), _jsx("h2", { style: {
                            fontFamily: headingFont,
                            fontWeight: tokens.typography.fontWeightMedium || 500,
                            fontSize: tokens.typography.fontSizeH2 || '1.25rem',
                            lineHeight: tokens.typography.lineHeightHeading || 1.2,
                            color: tokens.colors.textSecondary || tokens.colors.text,
                            letterSpacing: headingLetterSpacing,
                        }, children: "See your changes in real-time" }), _jsx("p", { style: { color: tokens.colors.textMuted || tokens.colors.textSecondary || tokens.colors.text, fontSize: tokens.typography.fontSizeSm || '0.875rem' }, children: "Adjust typography, colors, button shapes, shadows, spacing, and effects to dramatically transform the look and feel." }), _jsxs("div", { className: "flex flex-wrap gap-2 pt-1", children: [_jsx("button", { className: "px-4 py-2 text-xs font-medium", style: {
                                    backgroundColor: tokens.colors.primary,
                                    color: tokens.colors.background,
                                    borderRadius: btnRadius,
                                    transition: `all ${transition}`,
                                    boxShadow: tokens.effects?.shadowSm || 'none',
                                }, children: "Primary Action" }), _jsx("button", { className: "px-4 py-2 text-xs font-medium border", style: {
                                    borderColor: tokens.colors.primary,
                                    color: tokens.colors.primary,
                                    borderRadius: btnRadius,
                                    backgroundColor: 'transparent',
                                    transition: `all ${transition}`,
                                }, children: "Secondary" }), _jsx("button", { className: "px-4 py-2 text-xs font-medium", style: {
                                    backgroundColor: tokens.colors.accent || tokens.colors.secondary || tokens.colors.primary,
                                    color: tokens.colors.background,
                                    borderRadius: btnRadius,
                                    transition: `all ${transition}`,
                                }, children: "Accent" }), _jsx("button", { className: "px-3 py-2 text-xs", style: {
                                    color: tokens.colors.textSecondary || tokens.colors.text,
                                    borderRadius: btnRadius,
                                    textDecoration: 'underline',
                                    backgroundColor: 'transparent',
                                }, children: "Text Link" })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3 px-4 pb-4", style: { padding: `0 ${sectionPad} ${sectionPad}` }, children: [_jsxs("div", { className: "p-3 space-y-1", style: {
                            backgroundColor: tokens.colors.surface || tokens.colors.backgroundSecondary || tokens.colors.background,
                            borderRadius: cardRadius,
                            boxShadow: shadowMd,
                            transition: `all ${transition}`,
                            transform: `scale(${hoverScale === '1' ? '1' : '1'})`,
                        }, children: [_jsx("h3", { className: "font-semibold text-xs", style: { fontFamily: headingFont, letterSpacing: headingLetterSpacing, textTransform: headingTransform }, children: "Feature Card" }), _jsx("p", { className: "text-xs", style: { color: tokens.colors.textSecondary || tokens.colors.text }, children: "Cards with surface colors, shadows, and rounded corners." }), _jsx("span", { className: "inline-block text-xs mt-1", style: { color: tokens.colors.link || tokens.colors.primary }, children: "Learn more \u2192" })] }), _jsxs("div", { className: "p-3 space-y-1", style: {
                            backgroundColor: tokens.colors.surface || tokens.colors.backgroundSecondary || tokens.colors.background,
                            borderRadius: cardRadius,
                            boxShadow: shadowMd,
                        }, children: [_jsx("h3", { className: "font-semibold text-xs", style: { fontFamily: headingFont, letterSpacing: headingLetterSpacing, textTransform: headingTransform }, children: "Another Card" }), _jsx("p", { className: "text-xs", style: { color: tokens.colors.textSecondary || tokens.colors.text }, children: "Consistent styling across the entire component library." }), _jsxs("div", { className: "flex gap-1 mt-1", children: [_jsx("span", { className: "px-1.5 py-0.5 text-[10px] rounded", style: { backgroundColor: tokens.colors.success, color: '#fff', borderRadius: tokens.effects?.borderRadiusSm || '4px' }, children: "Active" }), _jsx("span", { className: "px-1.5 py-0.5 text-[10px] rounded", style: { backgroundColor: tokens.colors.info, color: '#fff', borderRadius: tokens.effects?.borderRadiusSm || '4px' }, children: "New" })] })] })] }), _jsxs("div", { className: "mx-4 mb-4 p-3 space-y-2", style: {
                    backgroundColor: tokens.colors.surface || tokens.colors.backgroundSecondary || tokens.colors.background,
                    borderRadius: cardRadius,
                    border: `1px solid ${tokens.colors.border || 'rgba(128,128,128,0.2)'}`,
                }, children: [_jsx("h3", { className: "text-xs font-semibold", style: { fontFamily: headingFont }, children: "Contact Form" }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsx("input", { placeholder: "Name", className: "px-2 py-1.5 text-xs border bg-transparent", style: {
                                    borderColor: tokens.colors.border || 'rgba(128,128,128,0.3)',
                                    borderRadius: inputRadius,
                                    color: tokens.colors.text,
                                }, readOnly: true }), _jsx("input", { placeholder: "Email", className: "px-2 py-1.5 text-xs border bg-transparent", style: {
                                    borderColor: tokens.colors.border || 'rgba(128,128,128,0.3)',
                                    borderRadius: inputRadius,
                                    color: tokens.colors.text,
                                }, readOnly: true })] }), _jsx("button", { className: "w-full px-3 py-1.5 text-xs font-medium", style: {
                            backgroundColor: tokens.colors.primary,
                            color: tokens.colors.background,
                            borderRadius: btnRadius,
                        }, children: "Send Message" })] }), _jsxs("div", { className: "flex flex-wrap gap-1.5 px-4 pb-4", children: [_jsx("span", { className: "px-2 py-0.5 text-[10px] font-medium", style: { backgroundColor: tokens.colors.success, color: '#fff', borderRadius: tokens.effects?.borderRadiusFull || '9999px' }, children: "Success" }), _jsx("span", { className: "px-2 py-0.5 text-[10px] font-medium", style: { backgroundColor: tokens.colors.warning, color: '#000', borderRadius: tokens.effects?.borderRadiusFull || '9999px' }, children: "Warning" }), _jsx("span", { className: "px-2 py-0.5 text-[10px] font-medium", style: { backgroundColor: tokens.colors.error, color: '#fff', borderRadius: tokens.effects?.borderRadiusFull || '9999px' }, children: "Error" }), _jsx("span", { className: "px-2 py-0.5 text-[10px] font-medium", style: { backgroundColor: tokens.colors.info, color: '#fff', borderRadius: tokens.effects?.borderRadiusFull || '9999px' }, children: "Info" })] }), tokens.effects?.glassBlur && tokens.effects.glassBlur !== '0px' && (_jsxs("div", { className: "mx-4 mb-4 p-3", style: {
                    backdropFilter: `blur(${tokens.effects.glassBlur})`,
                    backgroundColor: tokens.effects.glassBg || 'rgba(255,255,255,0.05)',
                    borderRadius: cardRadius,
                    border: `1px solid ${tokens.colors.border || 'rgba(255,255,255,0.1)'}`,
                }, children: [_jsx("p", { className: "text-xs font-medium", children: "Glass Effect Panel" }), _jsx("p", { className: "text-xs", style: { color: tokens.colors.textMuted || tokens.colors.textSecondary }, children: "Frosted glass with backdrop blur" })] }))] }));
}
// ============================================================================
// THEME EDITOR
// ============================================================================
export function ThemeEditor() {
    const { siteId } = useParams();
    const { tokens, setMode, setSiteTheme, applyTokenOverrides } = useTheme();
    const [selectedPreset, setSelectedPreset] = useState('netrun-dark');
    const [customTokens, setCustomTokens] = useState(tokens);
    const [previewMode, setPreviewMode] = useState('dark');
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [customFonts, setCustomFonts] = useState([]);
    const [activeThemeId, setActiveThemeId] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => {
        setCustomTokens(tokens);
    }, [tokens]);
    // Load active theme from API
    useEffect(() => {
        if (!siteId)
            return;
        api.get('/sites/' + siteId + '/themes/active').then((res) => {
            const theme = res.data;
            if (theme && theme.id) {
                setActiveThemeId(theme.id);
                if (theme.baseTheme) {
                    setSelectedPreset(theme.baseTheme);
                }
                if (theme.tokens) {
                    const savedTokens = theme.tokens;
                    setCustomTokens(savedTokens);
                    setSiteTheme({ darkTokens: savedTokens, lightTokens: savedTokens });
                }
            }
        }).catch(() => {
            // No active theme yet — that's fine, use defaults
        });
    }, [siteId, setSiteTheme]);
    const handlePresetSelect = (presetId) => {
        setSelectedPreset(presetId);
        const preset = themePresets.find((p) => p.id === presetId);
        if (preset) {
            const newTokens = previewMode === 'dark' ? preset.darkTokens : preset.lightTokens;
            setCustomTokens(newTokens);
            setSiteTheme({ darkTokens: preset.darkTokens, lightTokens: preset.lightTokens });
            setHasChanges(true);
        }
    };
    const updateTokens = useCallback((path, key, value) => {
        setCustomTokens((prev) => {
            const section = prev[path];
            const updated = { ...prev, [path]: { ...section, [key]: value } };
            return updated;
        });
        applyTokenOverrides({ [path]: { [key]: value } });
        setHasChanges(true);
    }, [applyTokenOverrides]);
    const handleColorChange = (key, value) => updateTokens('colors', key, value);
    const handleTypographyChange = (key, value) => updateTokens('typography', key, value);
    const handleEffectChange = (key, value) => updateTokens('effects', key, value);
    const handleSpacingChange = (key, value) => updateTokens('spacing', key, value);
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
            }
            else {
                const res = await api.post('/sites/' + siteId + '/themes', payload);
                setActiveThemeId(res.data.id);
            }
            setHasChanges(false);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Save failed');
        }
        finally {
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
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [siteId && (_jsx(Button, { variant: "ghost", size: "icon", asChild: true, children: _jsx(Link, { to: `/sites/${siteId}`, children: _jsx(ArrowLeft, { className: "h-5 w-5" }) }) })), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Design Playground" }), _jsx("p", { className: "text-muted-foreground", children: "Dramatically transform every visual aspect of your site" })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [hasChanges && (_jsxs(Button, { variant: "outline", onClick: handleReset, children: [_jsx(RotateCcw, { className: "mr-2 h-4 w-4" }), "Reset"] })), _jsxs(Button, { onClick: handleSave, disabled: isSaving || !hasChanges, children: [_jsx(Save, { className: "mr-2 h-4 w-4" }), isSaving ? 'Saving...' : 'Save Theme'] })] })] }), error && (_jsx("div", { className: "rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive", children: error })), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Label, { children: "Preview Mode" }), _jsxs("div", { className: "flex items-center gap-1 rounded-lg border p-1", children: [_jsxs(Button, { variant: previewMode === 'dark' ? 'secondary' : 'ghost', size: "sm", onClick: () => { setPreviewMode('dark'); setMode('dark'); }, children: [_jsx(Moon, { className: "mr-2 h-4 w-4" }), "Dark"] }), _jsxs(Button, { variant: previewMode === 'light' ? 'secondary' : 'ghost', size: "sm", onClick: () => { setPreviewMode('light'); setMode('light'); }, children: [_jsx(Sun, { className: "mr-2 h-4 w-4" }), "Light"] })] })] }), _jsxs("div", { className: "text-sm text-muted-foreground", children: ["Editing: ", _jsx("strong", { className: "capitalize", children: previewMode }), " mode"] })] }) }) }), _jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [_jsx("div", { className: "space-y-6", children: _jsxs(Tabs, { defaultValue: "presets", children: [_jsxs(TabsList, { className: "w-full flex-wrap h-auto gap-1 p-1", children: [_jsxs(TabsTrigger, { value: "presets", className: "flex-1 min-w-0", children: [_jsx(Sparkles, { className: "mr-1.5 h-3.5 w-3.5" }), "Presets"] }), _jsxs(TabsTrigger, { value: "colors", className: "flex-1 min-w-0", children: [_jsx(Palette, { className: "mr-1.5 h-3.5 w-3.5" }), "Colors"] }), _jsxs(TabsTrigger, { value: "typography", className: "flex-1 min-w-0", children: [_jsx(Type, { className: "mr-1.5 h-3.5 w-3.5" }), "Type"] }), _jsxs(TabsTrigger, { value: "shapes", className: "flex-1 min-w-0", children: [_jsx(MousePointer2, { className: "mr-1.5 h-3.5 w-3.5" }), "Shapes"] }), _jsxs(TabsTrigger, { value: "effects", className: "flex-1 min-w-0", children: [_jsx(Wand2, { className: "mr-1.5 h-3.5 w-3.5" }), "Effects"] }), _jsxs(TabsTrigger, { value: "spacing", className: "flex-1 min-w-0", children: [_jsx(Space, { className: "mr-1.5 h-3.5 w-3.5" }), "Spacing"] })] }), _jsx(TabsContent, { value: "presets", className: "mt-4", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Theme Presets" }), _jsx(CardDescription, { children: "Start from a preset, then make it yours" })] }), _jsx(CardContent, { className: "grid gap-4 sm:grid-cols-2", children: themePresets.map((preset) => (_jsx(PresetCard, { preset: preset, isSelected: selectedPreset === preset.id, onSelect: () => handlePresetSelect(preset.id) }, preset.id))) })] }) }), _jsxs(TabsContent, { value: "colors", className: "mt-4 space-y-4", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Brand Colors" }), _jsx(CardDescription, { children: "Primary, secondary, and accent" })] }), _jsxs(CardContent, { className: "grid gap-4 sm:grid-cols-2", children: [_jsx(ColorInput, { label: "Primary", value: customTokens.colors.primary, onChange: (v) => handleColorChange('primary', v), description: "Main brand color" }), _jsx(ColorInput, { label: "Primary Dark", value: customTokens.colors.primaryDark || customTokens.colors.primary, onChange: (v) => handleColorChange('primaryDark', v), description: "Hover & active states" }), _jsx(ColorInput, { label: "Primary Light", value: customTokens.colors.primaryLight || customTokens.colors.primary, onChange: (v) => handleColorChange('primaryLight', v), description: "Tints & highlights" }), _jsx(ColorInput, { label: "Secondary", value: customTokens.colors.secondary || '#000000', onChange: (v) => handleColorChange('secondary', v) }), _jsx(ColorInput, { label: "Accent", value: customTokens.colors.accent || customTokens.colors.primary, onChange: (v) => handleColorChange('accent', v), description: "Eye-catching highlights" })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Backgrounds & Surfaces" }) }), _jsxs(CardContent, { className: "grid gap-4 sm:grid-cols-2", children: [_jsx(ColorInput, { label: "Background", value: customTokens.colors.background, onChange: (v) => handleColorChange('background', v), description: "Page background" }), _jsx(ColorInput, { label: "Background Alt", value: customTokens.colors.backgroundSecondary || customTokens.colors.background, onChange: (v) => handleColorChange('backgroundSecondary', v) }), _jsx(ColorInput, { label: "Surface", value: customTokens.colors.surface || customTokens.colors.background, onChange: (v) => handleColorChange('surface', v), description: "Cards & panels" }), _jsx(ColorInput, { label: "Border", value: customTokens.colors.border || '#333333', onChange: (v) => handleColorChange('border', v) })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Text & Links" }) }), _jsxs(CardContent, { className: "grid gap-4 sm:grid-cols-2", children: [_jsx(ColorInput, { label: "Text", value: customTokens.colors.text, onChange: (v) => handleColorChange('text', v) }), _jsx(ColorInput, { label: "Text Secondary", value: customTokens.colors.textSecondary || customTokens.colors.text, onChange: (v) => handleColorChange('textSecondary', v) }), _jsx(ColorInput, { label: "Text Muted", value: customTokens.colors.textMuted || '#666666', onChange: (v) => handleColorChange('textMuted', v), description: "Captions & placeholders" }), _jsx(ColorInput, { label: "Link", value: customTokens.colors.link || customTokens.colors.primary, onChange: (v) => handleColorChange('link', v) })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Status Colors" }) }), _jsxs(CardContent, { className: "grid gap-4 sm:grid-cols-2", children: [_jsx(ColorInput, { label: "Success", value: customTokens.colors.success || '#10b981', onChange: (v) => handleColorChange('success', v) }), _jsx(ColorInput, { label: "Warning", value: customTokens.colors.warning || '#f59e0b', onChange: (v) => handleColorChange('warning', v) }), _jsx(ColorInput, { label: "Error", value: customTokens.colors.error || '#ef4444', onChange: (v) => handleColorChange('error', v) }), _jsx(ColorInput, { label: "Info", value: customTokens.colors.info || '#3b82f6', onChange: (v) => handleColorChange('info', v) })] })] })] }), _jsxs(TabsContent, { value: "typography", className: "mt-4 space-y-4", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Font Families" }), _jsx(CardDescription, { children: "Browse 70+ Google Fonts or upload your own .woff2/.ttf/.otf files" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx(FontBrowser, { label: "Body Font", currentFont: customTokens.typography.fontFamily, customFonts: customFonts, onSelect: (family) => handleTypographyChange('fontFamily', family), onCustomFontsChange: (fonts, css) => {
                                                                setCustomFonts(fonts);
                                                                // Inject @font-face rules so custom fonts render everywhere
                                                                let el = document.getElementById('netrun-cms-custom-fonts');
                                                                if (!el) {
                                                                    el = document.createElement('style');
                                                                    el.id = 'netrun-cms-custom-fonts';
                                                                    document.head.appendChild(el);
                                                                }
                                                                el.textContent = css;
                                                            } }), _jsx(FontBrowser, { label: "Heading Font", currentFont: customTokens.typography.fontFamilyHeading || customTokens.typography.fontFamily, customFonts: customFonts, onSelect: (family) => handleTypographyChange('fontFamilyHeading', family), onCustomFontsChange: (fonts, css) => {
                                                                setCustomFonts(fonts);
                                                                let el = document.getElementById('netrun-cms-custom-fonts');
                                                                if (!el) {
                                                                    el = document.createElement('style');
                                                                    el.id = 'netrun-cms-custom-fonts';
                                                                    document.head.appendChild(el);
                                                                }
                                                                el.textContent = css;
                                                            } }), _jsx(FontBrowser, { label: "Monospace Font", currentFont: customTokens.typography.fontFamilyMono || "'JetBrains Mono', monospace", customFonts: customFonts, onSelect: (family) => handleTypographyChange('fontFamilyMono', family), onCustomFontsChange: (fonts, css) => {
                                                                setCustomFonts(fonts);
                                                                let el = document.getElementById('netrun-cms-custom-fonts');
                                                                if (!el) {
                                                                    el = document.createElement('style');
                                                                    el.id = 'netrun-cms-custom-fonts';
                                                                    document.head.appendChild(el);
                                                                }
                                                                el.textContent = css;
                                                            } })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Heading Scale" }), _jsx(CardDescription, { children: "Control the visual hierarchy" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx(SliderControl, { label: "H1 Size", value: parseFloat(customTokens.typography.fontSizeH1 || '2.25'), min: 1.5, max: 4, step: 0.125, unit: "rem", onChange: (v) => handleTypographyChange('fontSizeH1', `${v}rem`) }), _jsx(SliderControl, { label: "H2 Size", value: parseFloat(customTokens.typography.fontSizeH2 || '1.5'), min: 1, max: 3, step: 0.125, unit: "rem", onChange: (v) => handleTypographyChange('fontSizeH2', `${v}rem`) }), _jsx(SliderControl, { label: "H3 Size", value: parseFloat(customTokens.typography.fontSizeH3 || '1.25'), min: 0.875, max: 2, step: 0.125, unit: "rem", onChange: (v) => handleTypographyChange('fontSizeH3', `${v}rem`) }), _jsx(Separator, {}), _jsx(SliderControl, { label: "Base Font Size", value: parseFloat(customTokens.typography.fontSizeBase || '1'), min: 0.75, max: 1.25, step: 0.0625, unit: "rem", onChange: (v) => handleTypographyChange('fontSizeBase', `${v}rem`) })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Weight, Spacing & Transform" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx(SliderControl, { label: "Body Weight", value: customTokens.typography.fontWeightNormal || 400, min: 300, max: 500, step: 100, onChange: (v) => handleTypographyChange('fontWeightNormal', v) }), _jsx(SliderControl, { label: "Bold Weight", value: customTokens.typography.fontWeightBold || 700, min: 500, max: 900, step: 100, onChange: (v) => handleTypographyChange('fontWeightBold', v) }), _jsx(SliderControl, { label: "Line Height", value: customTokens.typography.lineHeightBase || 1.5, min: 1.1, max: 2, step: 0.05, onChange: (v) => handleTypographyChange('lineHeightBase', v) }), _jsx(SliderControl, { label: "Heading Line Height", value: customTokens.typography.lineHeightHeading || 1.2, min: 0.9, max: 1.6, step: 0.05, onChange: (v) => handleTypographyChange('lineHeightHeading', v) }), _jsx(Separator, {}), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { className: "text-sm", children: "Letter Spacing (Headings)" }), _jsxs(Select, { value: customTokens.typography.letterSpacingHeading || '0', onValueChange: (v) => handleTypographyChange('letterSpacingHeading', v), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "-0.03em", children: "Tight (-0.03em)" }), _jsx(SelectItem, { value: "-0.01em", children: "Snug (-0.01em)" }), _jsx(SelectItem, { value: "0", children: "Normal" }), _jsx(SelectItem, { value: "0.025em", children: "Wide (0.025em)" }), _jsx(SelectItem, { value: "0.05em", children: "Wider (0.05em)" }), _jsx(SelectItem, { value: "0.1em", children: "Widest (0.1em)" }), _jsx(SelectItem, { value: "0.2em", children: "Ultra Wide (0.2em)" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { className: "text-sm", children: "Heading Text Transform" }), _jsxs(Select, { value: customTokens.typography.textTransformHeading || 'none', onValueChange: (v) => handleTypographyChange('textTransformHeading', v), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "none", children: "None" }), _jsx(SelectItem, { value: "uppercase", children: "UPPERCASE" }), _jsx(SelectItem, { value: "lowercase", children: "lowercase" }), _jsx(SelectItem, { value: "capitalize", children: "Capitalize" })] })] })] })] })] })] }), _jsxs(TabsContent, { value: "shapes", className: "mt-4 space-y-4", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Button Shape" }), _jsx(CardDescription, { children: "Dramatically changes the feel \u2014 square is corporate, pill is playful" })] }), _jsx(CardContent, { children: _jsx(ButtonShapePicker, { value: customTokens.effects?.buttonRadius || customTokens.effects?.borderRadius || '8px', onChange: (v) => handleEffectChange('buttonRadius', v) }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Component Radii" }), _jsx(CardDescription, { children: "Fine-tune each element independently" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx(SliderControl, { label: "Cards", value: parseInt(customTokens.effects?.cardRadius || customTokens.effects?.borderRadiusLg || '12'), min: 0, max: 24, unit: "px", onChange: (v) => handleEffectChange('cardRadius', `${v}px`) }), _jsx(SliderControl, { label: "Inputs", value: parseInt(customTokens.effects?.inputRadius || customTokens.effects?.borderRadius || '8'), min: 0, max: 16, unit: "px", onChange: (v) => handleEffectChange('inputRadius', `${v}px`) }), _jsx(SliderControl, { label: "Badges / Tags", value: parseInt(customTokens.effects?.borderRadiusSm || '4'), min: 0, max: 16, unit: "px", onChange: (v) => handleEffectChange('borderRadiusSm', `${v}px`) }), _jsx(SliderControl, { label: "Default Radius", value: parseInt(customTokens.effects?.borderRadius || '8'), min: 0, max: 24, unit: "px", onChange: (v) => handleEffectChange('borderRadius', `${v}px`) })] })] })] }), _jsxs(TabsContent, { value: "effects", className: "mt-4 space-y-4", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Shadows" }) }), _jsx(CardContent, { children: _jsx(ShadowIntensityPicker, { valueSm: customTokens.effects?.shadowSm || '0 1px 3px rgba(0,0,0,0.15)', valueMd: customTokens.effects?.shadowMd || '0 4px 12px rgba(0,0,0,0.15)', valueLg: customTokens.effects?.shadowLg || '0 8px 24px rgba(0,0,0,0.15)', shadowColor: customTokens.effects?.shadowColor || 'rgba(0,0,0,0.15)', onChange: (k, v) => handleEffectChange(k, v) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Glass Effect" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx(SliderControl, { label: "Backdrop Blur", value: parseInt(customTokens.effects?.glassBlur || '12'), min: 0, max: 32, unit: "px", onChange: (v) => handleEffectChange('glassBlur', `${v}px`) }), _jsx(ColorInput, { label: "Glass Background", value: customTokens.effects?.glassBg || 'rgba(255,255,255,0.05)', onChange: (v) => handleEffectChange('glassBg', v), description: "Semi-transparent overlay" })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Interactions" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { className: "text-sm", children: "Transition Speed" }), _jsxs(Select, { value: customTokens.effects?.transitionSpeed || '150ms', onValueChange: (v) => handleEffectChange('transitionSpeed', v), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "0ms", children: "Instant (0ms)" }), _jsx(SelectItem, { value: "100ms", children: "Fast (100ms)" }), _jsx(SelectItem, { value: "150ms", children: "Normal (150ms)" }), _jsx(SelectItem, { value: "250ms", children: "Smooth (250ms)" }), _jsx(SelectItem, { value: "400ms", children: "Slow (400ms)" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { className: "text-sm", children: "Hover Scale" }), _jsxs(Select, { value: customTokens.effects?.hoverScale || '1', onValueChange: (v) => handleEffectChange('hoverScale', v), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "1", children: "None" }), _jsx(SelectItem, { value: "1.02", children: "Subtle (1.02x)" }), _jsx(SelectItem, { value: "1.05", children: "Medium (1.05x)" }), _jsx(SelectItem, { value: "1.08", children: "Dramatic (1.08x)" })] })] })] })] })] })] }), _jsx(TabsContent, { value: "spacing", className: "mt-4", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Spacing Scale" }), _jsx(CardDescription, { children: "Controls whitespace and breathing room" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx(SliderControl, { label: "XS", value: parseFloat(customTokens.spacing?.xs || '0.25'), min: 0.125, max: 0.5, step: 0.125, unit: "rem", onChange: (v) => handleSpacingChange('xs', `${v}rem`) }), _jsx(SliderControl, { label: "SM", value: parseFloat(customTokens.spacing?.sm || '0.5'), min: 0.25, max: 1, step: 0.125, unit: "rem", onChange: (v) => handleSpacingChange('sm', `${v}rem`) }), _jsx(SliderControl, { label: "MD", value: parseFloat(customTokens.spacing?.md || '1'), min: 0.5, max: 2, step: 0.125, unit: "rem", onChange: (v) => handleSpacingChange('md', `${v}rem`) }), _jsx(SliderControl, { label: "LG", value: parseFloat(customTokens.spacing?.lg || '1.5'), min: 1, max: 3, step: 0.25, unit: "rem", onChange: (v) => handleSpacingChange('lg', `${v}rem`) }), _jsx(SliderControl, { label: "XL", value: parseFloat(customTokens.spacing?.xl || '2'), min: 1.5, max: 4, step: 0.25, unit: "rem", onChange: (v) => handleSpacingChange('xl', `${v}rem`) }), _jsx(SliderControl, { label: "2XL", value: parseFloat(customTokens.spacing?.['2xl'] || '3'), min: 2, max: 6, step: 0.5, unit: "rem", onChange: (v) => handleSpacingChange('2xl', `${v}rem`) }), _jsx(Separator, {}), _jsx(SliderControl, { label: "Section Padding", value: parseFloat(customTokens.spacing?.sectionPadding || '2'), min: 1, max: 6, step: 0.25, unit: "rem", onChange: (v) => handleSpacingChange('sectionPadding', `${v}rem`), description: "Vertical padding between page sections" }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { className: "text-sm", children: "Container Max Width" }), _jsxs(Select, { value: customTokens.spacing?.containerMaxWidth || '1200px', onValueChange: (v) => handleSpacingChange('containerMaxWidth', v), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "960px", children: "Narrow (960px)" }), _jsx(SelectItem, { value: "1080px", children: "Medium (1080px)" }), _jsx(SelectItem, { value: "1200px", children: "Default (1200px)" }), _jsx(SelectItem, { value: "1440px", children: "Wide (1440px)" }), _jsx(SelectItem, { value: "100%", children: "Full Width" })] })] })] })] })] }) })] }) }), _jsxs("div", { className: "space-y-4 lg:sticky lg:top-4 lg:self-start", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx(CardTitle, { children: "Live Preview" }), _jsx(CardDescription, { children: "Changes apply instantly" })] }), _jsxs(Button, { variant: "outline", size: "sm", children: [_jsx(Eye, { className: "mr-2 h-4 w-4" }), "Full Preview"] })] }) }), _jsx(CardContent, { children: _jsx(LivePreview, { tokens: customTokens }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "CSS Variables" }), _jsx(CardDescription, { children: "Copy into custom CSS" })] }), _jsxs(CardContent, { children: [_jsx("pre", { className: "rounded-lg bg-muted p-4 text-xs overflow-auto max-h-48 font-mono", children: `:root {
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
}` }), _jsxs(Button, { variant: "outline", size: "sm", className: "mt-2", onClick: () => {
                                                    navigator.clipboard.writeText(`:root {
  --primary: ${customTokens.colors.primary};
  --background: ${customTokens.colors.background};
  --surface: ${customTokens.colors.surface || customTokens.colors.background};
  --text: ${customTokens.colors.text};
  --font-family: ${customTokens.typography.fontFamily};
  --btn-radius: ${customTokens.effects?.buttonRadius || '8px'};
  --card-radius: ${customTokens.effects?.cardRadius || '12px'};
}`);
                                                }, children: [_jsx(Copy, { className: "mr-2 h-4 w-4" }), "Copy CSS"] })] })] })] })] })] }));
}
//# sourceMappingURL=ThemeEditor.js.map