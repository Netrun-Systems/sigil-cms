/**
 * AI Design Panel — Stitch-powered design generation for the Design Playground.
 *
 * Provides a text prompt input, device selector, preview area, edit/variant
 * generation, and import-to-page flow. Rendered as a collapsible panel
 * inside the Theme Editor.
 */

import { useState, useCallback } from 'react';
import {
  Wand2,
  Monitor,
  Tablet,
  Smartphone,
  Loader2,
  Copy,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
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
  cn,
} from '@netrun-cms/ui';
import {
  designAi,
  type DeviceType,
  type GenerateResult,
  type EditResult,
} from '../lib/design-ai';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  siteId: string;
  /** Called when blocks are imported — parent can add them to the page. */
  onImport?: (blocks: Array<{ blockType: string; content: Record<string, unknown>; sortOrder: number }>) => void;
}

type Screen = {
  screenId: string;
  previewUrl: string;
  code: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AIDesignPanel({ siteId, onImport }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [deviceType, setDeviceType] = useState<DeviceType>('DESKTOP');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen | null>(null);
  const [variants, setVariants] = useState<Screen[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  // ── Generate ────────────────────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    setVariants([]);

    try {
      const res = await designAi.generate(siteId, prompt.trim(), deviceType);
      const data = res.data;
      setCurrentScreen({
        screenId: data.screenId,
        previewUrl: data.previewUrl,
        code: data.code,
      });
      setSuggestions(data.suggestions ?? []);
      setIsMock(data.mock);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  }, [siteId, prompt, deviceType]);

  // ── Edit ────────────────────────────────────────────────────────────

  const handleEdit = useCallback(async () => {
    if (!editPrompt.trim() || !currentScreen) return;
    setIsEditing(true);
    setError(null);

    try {
      const res = await designAi.edit(siteId, currentScreen.screenId, editPrompt.trim());
      const data = res.data;
      setCurrentScreen({
        screenId: data.screenId,
        previewUrl: data.previewUrl,
        code: data.code,
      });
      setEditPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Edit failed');
    } finally {
      setIsEditing(false);
    }
  }, [siteId, currentScreen, editPrompt]);

  // ── Variants ────────────────────────────────────────────────────────

  const handleVariants = useCallback(async () => {
    if (!currentScreen) return;
    setIsLoadingVariants(true);
    setError(null);

    try {
      const res = await designAi.variants(siteId, currentScreen.screenId, 3);
      setVariants(res.data.variants);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Variant generation failed');
    } finally {
      setIsLoadingVariants(false);
    }
  }, [siteId, currentScreen]);

  // ── Import ──────────────────────────────────────────────────────────

  const handleImport = useCallback(
    async (screen: Screen) => {
      setIsImporting(true);
      setError(null);

      try {
        // Import returns blocks — we pass a placeholder pageId;
        // the actual page association is handled by the parent.
        const res = await designAi.importToPage(siteId, screen.screenId, 'current');
        onImport?.(res.data.blocks);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Import failed');
      } finally {
        setIsImporting(false);
      }
    },
    [siteId, onImport]
  );

  // ── Select a variant ────────────────────────────────────────────────

  const handleSelectVariant = (screen: Screen) => {
    setCurrentScreen(screen);
    setVariants([]);
  };

  // ── Copy HTML to clipboard ──────────────────────────────────────────

  const handleCopyCode = () => {
    if (currentScreen?.code) {
      navigator.clipboard.writeText(currentScreen.code);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────

  const deviceButtons: Array<{ type: DeviceType; icon: typeof Monitor; label: string }> = [
    { type: 'DESKTOP', icon: Monitor, label: 'Desktop' },
    { type: 'TABLET', icon: Tablet, label: 'Tablet' },
    { type: 'MOBILE', icon: Smartphone, label: 'Mobile' },
  ];

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <div>
              <CardTitle className="text-base">AI Design Generator</CardTitle>
              <CardDescription>Describe a page and get a designed, editable result</CardDescription>
            </div>
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-4">
          {/* Prompt input */}
          <div className="space-y-2">
            <Label>Describe what you want</Label>
            <div className="flex gap-2">
              <Input
                placeholder="A modern SaaS landing page with dark theme and gradient hero..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                className="flex-1"
              />
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                Generate
              </Button>
            </div>
          </div>

          {/* Device selector */}
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">Device:</Label>
            <div className="flex gap-1 rounded-lg border p-1">
              {deviceButtons.map(({ type, icon: Icon, label }) => (
                <Button
                  key={type}
                  variant={deviceType === type ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setDeviceType(type)}
                  title={label}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
          </div>

          {/* Mock indicator */}
          {isMock && currentScreen && (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
              Running in preview mode (STITCH_API_KEY not configured). Showing sample output.
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Preview */}
          {currentScreen && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Preview</Label>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={handleCopyCode} title="Copy HTML">
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleVariants}
                    disabled={isLoadingVariants}
                    title="Generate variants"
                  >
                    {isLoadingVariants ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Variants
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleImport(currentScreen)}
                    disabled={isImporting}
                  >
                    {isImporting ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Import to Page
                  </Button>
                </div>
              </div>

              {/* Rendered preview */}
              <div
                className={cn(
                  'overflow-hidden rounded-lg border bg-white',
                  deviceType === 'MOBILE' && 'mx-auto max-w-[375px]',
                  deviceType === 'TABLET' && 'mx-auto max-w-[768px]'
                )}
              >
                {currentScreen.previewUrl ? (
                  <img
                    src={currentScreen.previewUrl}
                    alt="Design preview"
                    className="w-full"
                  />
                ) : currentScreen.code ? (
                  <iframe
                    srcDoc={currentScreen.code}
                    title="Design preview"
                    className="h-[500px] w-full border-0"
                    sandbox="allow-scripts"
                  />
                ) : (
                  <div className="flex h-48 items-center justify-center text-muted-foreground">
                    No preview available
                  </div>
                )}
              </div>

              {/* Edit refinement */}
              <div className="flex gap-2">
                <Input
                  placeholder="Refine: Make the hero bigger, change colors..."
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={handleEdit}
                  disabled={isEditing || !editPrompt.trim()}
                >
                  {isEditing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                  )}
                  Edit
                </Button>
              </div>
            </div>
          )}

          {/* Variants */}
          {variants.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Variants</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                {variants.map((variant, i) => (
                  <div
                    key={variant.screenId}
                    className="cursor-pointer overflow-hidden rounded-lg border transition-shadow hover:shadow-md"
                    onClick={() => handleSelectVariant(variant)}
                  >
                    {variant.previewUrl ? (
                      <img
                        src={variant.previewUrl}
                        alt={`Variant ${i + 1}`}
                        className="w-full"
                      />
                    ) : variant.code ? (
                      <iframe
                        srcDoc={variant.code}
                        title={`Variant ${i + 1}`}
                        className="pointer-events-none h-32 w-full border-0"
                        sandbox=""
                      />
                    ) : (
                      <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
                        Variant {i + 1}
                      </div>
                    )}
                    <div className="border-t px-2 py-1 text-center text-xs text-muted-foreground">
                      Variant {i + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && !currentScreen && (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  onClick={() => {
                    setPrompt(s);
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
