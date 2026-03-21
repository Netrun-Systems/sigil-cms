import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Loader2,
  FlaskConical,
  Plus,
  Play,
  Square,
  Eye,
  Trophy,
  X,
} from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';

interface Experiment {
  id: string;
  name: string;
  status: 'draft' | 'running' | 'concluded';
  originalBlockId: string;
  variantBlockId: string;
  trafficSplit: number;
  startedAt: string | null;
  concludedAt: string | null;
  winner: 'original' | 'variant' | null;
  liftPercent: number | null;
}

interface ExperimentResults {
  original: { impressions: number; resonanceScore: number; clicks: number };
  variant: { impressions: number; resonanceScore: number; clicks: number };
  winner: 'original' | 'variant' | null;
  liftPercent: number | null;
  significant: boolean;
}

interface Page {
  id: string;
  title: string;
}

interface Block {
  id: string;
  blockType: string;
  position: number;
}

const statusColors: Record<string, string> = {
  draft: 'border-gray-500/50 bg-gray-500/10 text-gray-400',
  running: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
  concluded: 'border-green-500/50 bg-green-500/10 text-green-400',
};

export function ExperimentsList() {
  const { siteId } = useParams<{ siteId: string }>();
  const basePath = `/sites/${siteId}`;

  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [resultsView, setResultsView] = useState<string | null>(null);
  const [results, setResults] = useState<ExperimentResults | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);

  // Create form state
  const [pages, setPages] = useState<Page[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [formName, setFormName] = useState('');
  const [formPageId, setFormPageId] = useState('');
  const [formBlockId, setFormBlockId] = useState('');
  const [formTrafficSplit, setFormTrafficSplit] = useState(50);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Experiment[] }>(`${basePath}/resonance/experiments`);
      setExperiments(res.data ?? []);
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

  const loadBlocks = async (pageId: string) => {
    if (!pageId) {
      setBlocks([]);
      return;
    }
    try {
      const res = await api.get<{ data: Block[] }>(`${basePath}/pages/${pageId}/blocks`);
      setBlocks(res.data ?? []);
    } catch {
      setBlocks([]);
    }
  };

  const loadResults = async (experimentId: string) => {
    setResultsView(experimentId);
    setResultsLoading(true);
    try {
      const res = await api.get<ExperimentResults>(
        `${basePath}/resonance/experiments/${experimentId}/results`
      );
      setResults(res);
    } catch {
      setResults(null);
    } finally {
      setResultsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formName || !formBlockId) return;
    setCreating(true);
    try {
      await api.post(`${basePath}/resonance/experiments`, {
        name: formName,
        blockId: formBlockId,
        trafficSplit: formTrafficSplit,
      });
      setShowCreate(false);
      setFormName('');
      setFormPageId('');
      setFormBlockId('');
      setFormTrafficSplit(50);
      await load();
    } catch {
      // keep dialog open
    } finally {
      setCreating(false);
    }
  };

  const startExperiment = async (id: string) => {
    try {
      await api.post(`${basePath}/resonance/experiments/${id}/start`, {});
      setExperiments((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: 'running' as const, startedAt: new Date().toISOString() } : e))
      );
    } catch {
      // keep state
    }
  };

  const concludeExperiment = async (id: string) => {
    try {
      await api.post(`${basePath}/resonance/experiments/${id}/conclude`, {});
      await load();
    } catch {
      // keep state
    }
  };

  useEffect(() => { load(); }, [siteId]);

  useEffect(() => {
    if (showCreate) loadPages();
  }, [showCreate]);

  useEffect(() => {
    loadBlocks(formPageId);
  }, [formPageId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Experiments</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New Experiment
        </button>
      </div>

      {/* Create Dialog */}
      {showCreate && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Create Experiment</h3>
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Name</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Experiment name..."
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Page</label>
                <select
                  value={formPageId}
                  onChange={(e) => setFormPageId(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select a page...</option>
                  {pages.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Block</label>
                <select
                  value={formBlockId}
                  onChange={(e) => setFormBlockId(e.target.value)}
                  disabled={!formPageId}
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                >
                  <option value="">Select a block...</option>
                  {blocks.map((b) => (
                    <option key={b.id} value={b.id}>
                      #{b.position} - {b.blockType}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Traffic Split: {formTrafficSplit}% variant / {100 - formTrafficSplit}% original
                </label>
                <input
                  type="range"
                  min={10}
                  max={90}
                  step={5}
                  value={formTrafficSplit}
                  onChange={(e) => setFormTrafficSplit(Number(e.target.value))}
                  className="mt-1 w-full"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !formName || !formBlockId}
                className="flex h-8 items-center gap-2 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Create
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Experiments List */}
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : experiments.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
          <FlaskConical className="h-8 w-8" />
          <p className="text-sm">No experiments yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {experiments.map((exp) => (
            <Card key={exp.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{exp.name}</span>
                      <span className={cn(
                        'rounded-md px-2 py-0.5 text-xs capitalize border',
                        statusColors[exp.status] || ''
                      )}>
                        {exp.status}
                      </span>
                      {exp.status === 'concluded' && exp.winner && (
                        <span className="flex items-center gap-1 rounded-md border border-green-500/50 bg-green-500/10 px-2 py-0.5 text-xs text-green-400">
                          <Trophy className="h-3 w-3" />
                          {exp.winner} wins
                          {exp.liftPercent != null && ` (+${exp.liftPercent.toFixed(1)}%)`}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>Original: {exp.originalBlockId.slice(0, 8)}...</span>
                      <span>Variant: {exp.variantBlockId.slice(0, 8)}...</span>
                      <span>Split: {exp.trafficSplit}% / {100 - exp.trafficSplit}%</span>
                      {exp.startedAt && (
                        <span>Started: {new Date(exp.startedAt).toLocaleDateString()}</span>
                      )}
                      {exp.concludedAt && (
                        <span>Concluded: {new Date(exp.concludedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {exp.status === 'draft' && (
                      <button
                        onClick={() => startExperiment(exp.id)}
                        title="Start experiment"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-blue-500/10 hover:text-blue-500 transition-colors"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                    )}
                    {exp.status === 'running' && (
                      <button
                        onClick={() => concludeExperiment(exp.id)}
                        title="Conclude experiment"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      >
                        <Square className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => loadResults(exp.id)}
                      title="View results"
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Inline Results */}
                {resultsView === exp.id && (
                  <div className="mt-4 pt-4 border-t border-border">
                    {resultsLoading ? (
                      <div className="flex h-16 items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : results ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          {/* Original */}
                          <div className={cn(
                            'rounded-lg border p-3 space-y-2',
                            results.winner === 'original' ? 'border-green-500/50 bg-green-500/5' : 'border-border'
                          )}>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold">Original</p>
                              {results.winner === 'original' && (
                                <Trophy className="h-3.5 w-3.5 text-green-500" />
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div>
                                <p className="text-xs text-muted-foreground">Impressions</p>
                                <p className="text-sm font-bold">{results.original.impressions.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Resonance</p>
                                <p className="text-sm font-bold">{results.original.resonanceScore}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Clicks</p>
                                <p className="text-sm font-bold">{results.original.clicks.toLocaleString()}</p>
                              </div>
                            </div>
                          </div>

                          {/* Variant */}
                          <div className={cn(
                            'rounded-lg border p-3 space-y-2',
                            results.winner === 'variant' ? 'border-green-500/50 bg-green-500/5' : 'border-border'
                          )}>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold">Variant</p>
                              {results.winner === 'variant' && (
                                <Trophy className="h-3.5 w-3.5 text-green-500" />
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div>
                                <p className="text-xs text-muted-foreground">Impressions</p>
                                <p className="text-sm font-bold">{results.variant.impressions.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Resonance</p>
                                <p className="text-sm font-bold">{results.variant.resonanceScore}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Clicks</p>
                                <p className="text-sm font-bold">{results.variant.clicks.toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Significance */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className={cn(
                            'rounded-md px-2 py-0.5 border',
                            results.significant
                              ? 'border-green-500/50 bg-green-500/10 text-green-400'
                              : 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400'
                          )}>
                            {results.significant ? 'Statistically significant' : 'Not yet significant'}
                          </span>
                          {results.liftPercent != null && (
                            <span>Lift: {results.liftPercent > 0 ? '+' : ''}{results.liftPercent.toFixed(1)}%</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No results available</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
