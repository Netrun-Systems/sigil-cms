import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams, Link } from 'react-router-dom';
import { Palette, Save, Eye, ArrowLeft, Sun, Moon, RotateCcw, Copy, Check, Type, Layers, Sparkles, } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Tabs, TabsContent, TabsList, TabsTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Separator, cn, } from '@netrun-cms/ui';
import { useTheme, themePresets, } from '@netrun-cms/theme';
import { useState, useEffect } from 'react';
function ColorInput({ label, value, onChange, description }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Label, { className: "text-sm", children: label }), _jsx("button", { onClick: handleCopy, className: "text-xs text-muted-foreground hover:text-foreground", children: copied ? (_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Check, { className: "h-3 w-3" }), " Copied"] })) : (_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Copy, { className: "h-3 w-3" }), " Copy"] })) })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "h-9 w-9 rounded-md border cursor-pointer", style: { backgroundColor: value }, children: _jsx("input", { type: "color", value: value, onChange: (e) => onChange(e.target.value), className: "h-full w-full opacity-0 cursor-pointer" }) }), _jsx(Input, { value: value, onChange: (e) => onChange(e.target.value), className: "flex-1 font-mono text-sm", placeholder: "#000000" })] }), description && (_jsx("p", { className: "text-xs text-muted-foreground", children: description }))] }));
}
function PresetCard({ preset, isSelected, onSelect, }) {
    return (_jsxs("button", { onClick: onSelect, className: cn('group relative flex flex-col items-start rounded-lg border p-4 text-left transition-all hover:border-primary', isSelected && 'border-primary ring-2 ring-primary/20'), children: [isSelected && (_jsx("div", { className: "absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground", children: _jsx(Check, { className: "h-3 w-3" }) })), _jsxs("div", { className: "flex gap-1 mb-3", children: [_jsx("div", { className: "h-6 w-6 rounded-l-md", style: { backgroundColor: preset.darkTokens.colors.primary } }), _jsx("div", { className: "h-6 w-6", style: { backgroundColor: preset.darkTokens.colors.background } }), _jsx("div", { className: "h-6 w-6 rounded-r-md", style: { backgroundColor: preset.darkTokens.colors.text } })] }), _jsx("p", { className: "font-medium", children: preset.name }), _jsx("p", { className: "text-sm text-muted-foreground", children: preset.description })] }));
}
function LivePreview({ tokens }) {
    return (_jsxs("div", { className: "rounded-lg border p-6 space-y-4", style: {
            backgroundColor: tokens.colors.background,
            color: tokens.colors.text,
            fontFamily: tokens.typography.fontFamily,
        }, children: [_jsxs("div", { className: "space-y-2", children: [_jsx("h3", { className: "text-xl font-bold", style: {
                            fontFamily: tokens.typography.fontFamilyHeading || tokens.typography.fontFamily,
                        }, children: "Preview Heading" }), _jsx("p", { style: { color: tokens.colors.textSecondary }, children: "This is how your theme will look with the current settings." })] }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { className: "rounded-md px-4 py-2 text-sm font-medium transition-colors", style: {
                            backgroundColor: tokens.colors.primary,
                            color: '#000',
                            borderRadius: tokens.effects?.borderRadius || '8px',
                        }, children: "Primary Button" }), _jsx("button", { className: "rounded-md border px-4 py-2 text-sm font-medium", style: {
                            borderColor: tokens.colors.primary,
                            color: tokens.colors.primary,
                            borderRadius: tokens.effects?.borderRadius || '8px',
                        }, children: "Secondary Button" })] }), _jsxs("div", { className: "rounded-lg p-4", style: {
                    backgroundColor: tokens.colors.surface || tokens.colors.backgroundSecondary,
                    boxShadow: tokens.effects?.shadowMd,
                    borderRadius: tokens.effects?.borderRadiusLg || '12px',
                }, children: [_jsx("p", { className: "font-medium", children: "Card Component" }), _jsx("p", { className: "text-sm", style: { color: tokens.colors.textSecondary }, children: "This demonstrates surface colors and shadows." })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("span", { className: "rounded px-2 py-1 text-xs", style: { backgroundColor: tokens.colors.success, color: '#fff' }, children: "Success" }), _jsx("span", { className: "rounded px-2 py-1 text-xs", style: { backgroundColor: tokens.colors.warning, color: '#000' }, children: "Warning" }), _jsx("span", { className: "rounded px-2 py-1 text-xs", style: { backgroundColor: tokens.colors.error, color: '#fff' }, children: "Error" }), _jsx("span", { className: "rounded px-2 py-1 text-xs", style: { backgroundColor: tokens.colors.info, color: '#000' }, children: "Info" })] })] }));
}
export function ThemeEditor() {
    const { siteId } = useParams();
    const { tokens, isDark, setMode, setSiteTheme, applyTokenOverrides } = useTheme();
    const [selectedPreset, setSelectedPreset] = useState('netrun-dark');
    const [customTokens, setCustomTokens] = useState(tokens);
    const [previewMode, setPreviewMode] = useState('dark');
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    // Update custom tokens when theme changes
    useEffect(() => {
        setCustomTokens(tokens);
    }, [tokens]);
    const handlePresetSelect = (presetId) => {
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
    const handleColorChange = (key, value) => {
        setCustomTokens((prev) => ({
            ...prev,
            colors: { ...prev.colors, [key]: value },
        }));
        applyTokenOverrides({ colors: { ...customTokens.colors, [key]: value } });
        setHasChanges(true);
    };
    const handleTypographyChange = (key, value) => {
        setCustomTokens((prev) => ({
            ...prev,
            typography: { ...prev.typography, [key]: value },
        }));
        applyTokenOverrides({ typography: { ...customTokens.typography, [key]: value } });
        setHasChanges(true);
    };
    const handleEffectChange = (key, value) => {
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
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [siteId && (_jsx(Button, { variant: "ghost", size: "icon", asChild: true, children: _jsx(Link, { to: `/sites/${siteId}`, children: _jsx(ArrowLeft, { className: "h-5 w-5" }) }) })), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Theme Editor" }), _jsx("p", { className: "text-muted-foreground", children: "Customize the visual appearance of your site" })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [hasChanges && (_jsxs(Button, { variant: "outline", onClick: handleReset, children: [_jsx(RotateCcw, { className: "mr-2 h-4 w-4" }), "Reset"] })), _jsxs(Button, { onClick: handleSave, disabled: isSaving || !hasChanges, children: [_jsx(Save, { className: "mr-2 h-4 w-4" }), isSaving ? 'Saving...' : 'Save Theme'] })] })] }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Label, { children: "Preview Mode" }), _jsxs("div", { className: "flex items-center gap-1 rounded-lg border p-1", children: [_jsxs(Button, { variant: previewMode === 'dark' ? 'secondary' : 'ghost', size: "sm", onClick: () => {
                                                    setPreviewMode('dark');
                                                    setMode('dark');
                                                }, children: [_jsx(Moon, { className: "mr-2 h-4 w-4" }), "Dark"] }), _jsxs(Button, { variant: previewMode === 'light' ? 'secondary' : 'ghost', size: "sm", onClick: () => {
                                                    setPreviewMode('light');
                                                    setMode('light');
                                                }, children: [_jsx(Sun, { className: "mr-2 h-4 w-4" }), "Light"] })] })] }), _jsxs("div", { className: "text-sm text-muted-foreground", children: ["Currently editing: ", _jsx("strong", { className: "capitalize", children: previewMode }), " mode"] })] }) }) }), _jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [_jsx("div", { className: "space-y-6", children: _jsxs(Tabs, { defaultValue: "presets", children: [_jsxs(TabsList, { className: "w-full", children: [_jsxs(TabsTrigger, { value: "presets", className: "flex-1", children: [_jsx(Sparkles, { className: "mr-2 h-4 w-4" }), "Presets"] }), _jsxs(TabsTrigger, { value: "colors", className: "flex-1", children: [_jsx(Palette, { className: "mr-2 h-4 w-4" }), "Colors"] }), _jsxs(TabsTrigger, { value: "typography", className: "flex-1", children: [_jsx(Type, { className: "mr-2 h-4 w-4" }), "Typography"] }), _jsxs(TabsTrigger, { value: "effects", className: "flex-1", children: [_jsx(Layers, { className: "mr-2 h-4 w-4" }), "Effects"] })] }), _jsx(TabsContent, { value: "presets", className: "mt-4", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Theme Presets" }), _jsx(CardDescription, { children: "Choose a preset to get started, then customize it" })] }), _jsx(CardContent, { className: "grid gap-4 sm:grid-cols-2", children: themePresets.map((preset) => (_jsx(PresetCard, { preset: preset, isSelected: selectedPreset === preset.id, onSelect: () => handlePresetSelect(preset.id) }, preset.id))) })] }) }), _jsxs(TabsContent, { value: "colors", className: "mt-4 space-y-4", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Brand Colors" }), _jsx(CardDescription, { children: "Primary and secondary brand colors" })] }), _jsxs(CardContent, { className: "grid gap-4 sm:grid-cols-2", children: [_jsx(ColorInput, { label: "Primary", value: customTokens.colors.primary, onChange: (v) => handleColorChange('primary', v), description: "Main brand color" }), _jsx(ColorInput, { label: "Primary Dark", value: customTokens.colors.primaryDark || customTokens.colors.primary, onChange: (v) => handleColorChange('primaryDark', v), description: "Darker shade for hover states" }), _jsx(ColorInput, { label: "Primary Light", value: customTokens.colors.primaryLight || customTokens.colors.primary, onChange: (v) => handleColorChange('primaryLight', v), description: "Lighter shade for backgrounds" }), _jsx(ColorInput, { label: "Secondary", value: customTokens.colors.secondary || '#000000', onChange: (v) => handleColorChange('secondary', v), description: "Secondary accent color" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Background Colors" }), _jsx(CardDescription, { children: "Page and surface backgrounds" })] }), _jsxs(CardContent, { className: "grid gap-4 sm:grid-cols-2", children: [_jsx(ColorInput, { label: "Background", value: customTokens.colors.background, onChange: (v) => handleColorChange('background', v), description: "Main page background" }), _jsx(ColorInput, { label: "Background Secondary", value: customTokens.colors.backgroundSecondary || customTokens.colors.background, onChange: (v) => handleColorChange('backgroundSecondary', v), description: "Secondary background" }), _jsx(ColorInput, { label: "Surface", value: customTokens.colors.surface || customTokens.colors.background, onChange: (v) => handleColorChange('surface', v), description: "Card and component surfaces" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Text Colors" }), _jsx(CardDescription, { children: "Primary and secondary text" })] }), _jsxs(CardContent, { className: "grid gap-4 sm:grid-cols-2", children: [_jsx(ColorInput, { label: "Text", value: customTokens.colors.text, onChange: (v) => handleColorChange('text', v), description: "Primary text color" }), _jsx(ColorInput, { label: "Text Secondary", value: customTokens.colors.textSecondary || customTokens.colors.text, onChange: (v) => handleColorChange('textSecondary', v), description: "Muted text color" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Status Colors" }), _jsx(CardDescription, { children: "Success, warning, error, and info" })] }), _jsxs(CardContent, { className: "grid gap-4 sm:grid-cols-2", children: [_jsx(ColorInput, { label: "Success", value: customTokens.colors.success || '#10b981', onChange: (v) => handleColorChange('success', v) }), _jsx(ColorInput, { label: "Warning", value: customTokens.colors.warning || '#f59e0b', onChange: (v) => handleColorChange('warning', v) }), _jsx(ColorInput, { label: "Error", value: customTokens.colors.error || '#ef4444', onChange: (v) => handleColorChange('error', v) }), _jsx(ColorInput, { label: "Info", value: customTokens.colors.info || '#3b82f6', onChange: (v) => handleColorChange('info', v) })] })] })] }), _jsx(TabsContent, { value: "typography", className: "mt-4", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Typography" }), _jsx(CardDescription, { children: "Fonts and text settings" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Body Font Family" }), _jsxs(Select, { value: customTokens.typography.fontFamily.split(',')[0].replace(/'/g, ''), onValueChange: (v) => handleTypographyChange('fontFamily', `'${v}', system-ui, sans-serif`), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "Futura Medium", children: "Futura Medium" }), _jsx(SelectItem, { value: "Inter", children: "Inter" }), _jsx(SelectItem, { value: "-apple-system", children: "System Font" }), _jsx(SelectItem, { value: "Georgia", children: "Georgia" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Heading Font Family" }), _jsxs(Select, { value: (customTokens.typography.fontFamilyHeading || customTokens.typography.fontFamily).split(',')[0].replace(/'/g, ''), onValueChange: (v) => handleTypographyChange('fontFamilyHeading', `'${v}', system-ui, sans-serif`), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "Futura Bold", children: "Futura Bold" }), _jsx(SelectItem, { value: "Inter", children: "Inter" }), _jsx(SelectItem, { value: "-apple-system", children: "System Font" }), _jsx(SelectItem, { value: "Georgia", children: "Georgia" })] })] })] }), _jsx(Separator, {}), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Base Font Size" }), _jsxs(Select, { value: customTokens.typography.fontSizeBase || '1rem', onValueChange: (v) => handleTypographyChange('fontSizeBase', v), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "0.875rem", children: "14px (0.875rem)" }), _jsx(SelectItem, { value: "0.9375rem", children: "15px (0.9375rem)" }), _jsx(SelectItem, { value: "1rem", children: "16px (1rem)" }), _jsx(SelectItem, { value: "1.125rem", children: "18px (1.125rem)" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Line Height" }), _jsxs(Select, { value: String(customTokens.typography.lineHeightBase || 1.5), onValueChange: (v) => handleTypographyChange('lineHeightBase', parseFloat(v)), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "1.25", children: "Tight (1.25)" }), _jsx(SelectItem, { value: "1.4", children: "Snug (1.4)" }), _jsx(SelectItem, { value: "1.5", children: "Normal (1.5)" }), _jsx(SelectItem, { value: "1.75", children: "Relaxed (1.75)" })] })] })] })] })] })] }) }), _jsx(TabsContent, { value: "effects", className: "mt-4", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Effects & Styling" }), _jsx(CardDescription, { children: "Border radius, shadows, and more" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Border Radius" }), _jsxs(Select, { value: customTokens.effects?.borderRadius || '8px', onValueChange: (v) => handleEffectChange('borderRadius', v), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "0px", children: "None (0px)" }), _jsx(SelectItem, { value: "4px", children: "Small (4px)" }), _jsx(SelectItem, { value: "6px", children: "Medium (6px)" }), _jsx(SelectItem, { value: "8px", children: "Default (8px)" }), _jsx(SelectItem, { value: "12px", children: "Large (12px)" }), _jsx(SelectItem, { value: "16px", children: "Extra Large (16px)" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Glass Effect Blur" }), _jsxs(Select, { value: customTokens.effects?.glassBlur || '12px', onValueChange: (v) => handleEffectChange('glassBlur', v), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "4px", children: "Light (4px)" }), _jsx(SelectItem, { value: "8px", children: "Medium (8px)" }), _jsx(SelectItem, { value: "12px", children: "Default (12px)" }), _jsx(SelectItem, { value: "16px", children: "Heavy (16px)" }), _jsx(SelectItem, { value: "24px", children: "Extra Heavy (24px)" })] })] })] })] })] }) })] }) }), _jsxs("div", { className: "space-y-4", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx(CardTitle, { children: "Live Preview" }), _jsx(CardDescription, { children: "See changes in real-time" })] }), _jsxs(Button, { variant: "outline", size: "sm", children: [_jsx(Eye, { className: "mr-2 h-4 w-4" }), "Full Preview"] })] }) }), _jsx(CardContent, { children: _jsx(LivePreview, { tokens: customTokens }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "CSS Variables" }), _jsx(CardDescription, { children: "Copy and paste into your custom CSS" })] }), _jsxs(CardContent, { children: [_jsx("pre", { className: "rounded-lg bg-muted p-4 text-xs overflow-auto max-h-64", children: `:root {
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
}` }), _jsxs(Button, { variant: "outline", size: "sm", className: "mt-2", onClick: () => {
                                                    navigator.clipboard.writeText(`:root {
  --primary: ${customTokens.colors.primary};
  --primary-dark: ${customTokens.colors.primaryDark || customTokens.colors.primary};
  --background: ${customTokens.colors.background};
  --text: ${customTokens.colors.text};
}`);
                                                }, children: [_jsx(Copy, { className: "mr-2 h-4 w-4" }), "Copy CSS"] })] })] })] })] })] }));
}
//# sourceMappingURL=ThemeEditor.js.map