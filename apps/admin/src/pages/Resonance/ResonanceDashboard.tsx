import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Loader2,
  Activity,
  BarChart3,
  Blocks,
  FlaskConical,
  Sparkles,
  RefreshCw,
  Check,
  X,
} from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';

interface DashboardStats {
  totalEvents: number;
  avgResonanceScore: number;
  topBlockType: string;
  activeExperiments: number;
}

interface HeatmapBlock {
  blockId: string;
  blockType: string;
  resonanceScore: number;
  impressions: number;
  avgViewportTime: number;
  clicks: number;
}

interface Page {
  id: string;
  title: string;
}

interface Suggestion {
  id: string;
  blockType: string;
  suggestion: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  status: string;
}

const priorityColors: Record<string, string> = {
  low: 'border-gray-500/50 bg-gray-500/10 text-gray-400',
  medium: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400',
  high: 'border-red-500/50 bg-red-500/10 text-red-400',
};

function scoreColor(score: number): string {
  if (score <= 30) return 'bg-red-500';
  if (score <= 60) return 'bg-yellow-500';
  return 'bg-green-500';
}

function scoreTextColor(score: number): string {
  if (score <= 30) return 'text-red-500';
  if (score <= 60) return 'text-yellow-500';
  return 'text-green-500';
}

function formatSeconds(s: number): string {
  if (s < 60) return `${s.toFixed(1)}s`;
  return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
}

export function ResonanceDashboard() {
  const { siteId } = useParams<{ siteId: string }>();
  const basePath = `/sites/${siteId}`;

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);

  // Heatmap state
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPageId, setSelectedPageId] = useState('');
  const [heatmap, setHeatmap] = useState<HeatmapBlock[]>([]);
  const [heatmapLoading, setHeatmapLoading] = useState(false);

  // Suggestions state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get<DashboardStats>(`${basePath}/resonance/dashboard`);
      setStats(res);
    } catch {
      // empty state
    } finally {
      setLoading(false);
    }
  };

  const loadPages = async () => {
    try {
      const res = await api.get<{ data: Page[] }>(`${basePath}/pages`);
      setPages(res.data ?? []);
    } catch {
      // empty state
    }
  };

  const loadHeatmap = async (pageId: string) => {
    if (!pageId) {
      setHeatmap([]);
      return;
    }
    setHeatmapLoading(true);
    try {
      const res = await api.get<{ data: HeatmapBlock[] }>(
        `${basePath}/resonance/scores/heatmap?pageId=${pageId}`
      );
      setHeatmap(res.data ?? []);
    } catch {
      setHeatmap([]);
    } finally {
      setHeatmapLoading(false);
    }
  };

  const loadSuggestions = async () => {
    setSuggestionsLoading(true);
    try {
      const res = await api.get<{ data: Suggestion[] }>(
        `${basePath}/resonance/suggestions?status=pending`
      );
      setSuggestions(res.data ?? []);
    } catch {
      // empty state
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const computeScores = async () => {
    setComputing(true);
    try {
      await api.post(`${basePath}/resonance/scores/compute`, {});
      await loadDashboard();
      if (selectedPageId) await loadHeatmap(selectedPageId);
    } catch {
      // error handled silently
    } finally {
      setComputing(false);
    }
  };

  const generateSuggestions = async () => {
    setGenerating(true);
    try {
      await api.post(`${basePath}/resonance/suggestions/generate`, {});
      await loadSuggestions();
    } catch {
      // error handled silently
    } finally {
      setGenerating(false);
    }
  };

  const updateSuggestion = async (id: string, status: 'applied' | 'dismissed') => {
    try {
      await api.patch(`${basePath}/resonance/suggestions/${id}`, { status });
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // keep list as-is
    }
  };

  useEffect(() => {
    loadDashboard();
    loadPages();
    loadSuggestions();
  }, [siteId]);

  useEffect(() => {
    loadHeatmap(selectedPageId);
  }, [selectedPageId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Resonance Analytics</h1>
        <button
          onClick={computeScores}
          disabled={computing}
          className="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {computing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Compute Scores
        </button>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-500/10 text-blue-500">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Events</p>
                  <p className="text-2xl font-bold">{stats.totalEvents.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-md',
                  stats.avgResonanceScore <= 30
                    ? 'bg-red-500/10 text-red-500'
                    : stats.avgResonanceScore <= 60
                      ? 'bg-yellow-500/10 text-yellow-500'
                      : 'bg-green-500/10 text-green-500'
                )}>
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Resonance Score</p>
                  <p className={cn('text-2xl font-bold', scoreTextColor(stats.avgResonanceScore))}>
                    {stats.avgResonanceScore}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-purple-500/10 text-purple-500">
                  <Blocks className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Top Block Type</p>
                  <p className="text-lg font-bold capitalize">{stats.topBlockType || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-orange-500/10 text-orange-500">
                  <FlaskConical className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Experiments</p>
                  <p className="text-2xl font-bold">{stats.activeExperiments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Block Heatmap */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Block Heatmap</h2>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <select
              value={selectedPageId}
              onChange={(e) => setSelectedPageId(e.target.value)}
              className="flex h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Select a page...</option>
              {pages.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>

            {heatmapLoading ? (
              <div className="flex h-24 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !selectedPageId ? (
              <p className="text-sm text-muted-foreground py-4">
                Select a page to view block resonance scores.
              </p>
            ) : heatmap.length === 0 ? (
              <div className="flex h-24 flex-col items-center justify-center gap-2 text-muted-foreground">
                <BarChart3 className="h-8 w-8" />
                <p className="text-sm">No heatmap data for this page</p>
              </div>
            ) : (
              <div className="space-y-2">
                {heatmap.map((block) => (
                  <div
                    key={block.blockId}
                    className="flex items-center gap-4 rounded-lg border border-border p-3"
                  >
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs capitalize min-w-[80px] text-center">
                      {block.blockType}
                    </span>

                    <div className="flex-1 flex items-center gap-3">
                      <div className="flex-1 h-4 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all', scoreColor(block.resonanceScore))}
                          style={{ width: `${block.resonanceScore}%` }}
                        />
                      </div>
                      <span className={cn('text-sm font-bold min-w-[36px] text-right', scoreTextColor(block.resonanceScore))}>
                        {block.resonanceScore}
                      </span>
                    </div>

                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span title="Impressions">{block.impressions.toLocaleString()} imp</span>
                      <span title="Avg viewport time">{formatSeconds(block.avgViewportTime)}</span>
                      <span title="Clicks">{block.clicks.toLocaleString()} clicks</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Suggestions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">AI Suggestions</h2>
          <button
            onClick={generateSuggestions}
            disabled={generating}
            className="flex h-8 items-center gap-2 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            Generate Suggestions
          </button>
        </div>

        {suggestionsLoading ? (
          <div className="flex h-24 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : suggestions.length === 0 ? (
          <div className="flex h-24 flex-col items-center justify-center gap-2 text-muted-foreground">
            <Sparkles className="h-8 w-8" />
            <p className="text-sm">No pending suggestions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((s) => (
              <Card key={s.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="rounded-md bg-muted px-2 py-0.5 text-xs capitalize">
                          {s.blockType}
                        </span>
                        <span className={cn(
                          'rounded-md px-2 py-0.5 text-xs capitalize border',
                          priorityColors[s.priority] || ''
                        )}>
                          {s.priority}
                        </span>
                        <span className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">
                          {s.category}
                        </span>
                      </div>
                      <p className="text-sm">{s.suggestion}</p>
                      <p className="text-xs text-muted-foreground">{s.reason}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateSuggestion(s.id, 'applied')}
                        title="Applied"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-green-500/10 hover:text-green-500 transition-colors"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => updateSuggestion(s.id, 'dismissed')}
                        title="Dismiss"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
