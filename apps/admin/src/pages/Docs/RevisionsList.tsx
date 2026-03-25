import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  History,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';

interface Revision {
  id: string;
  version: number;
  changeNote: string | null;
  changedBy: string | null;
  snapshot: {
    blocks: Array<{
      type: string;
      content: Record<string, unknown>;
    }>;
  } | null;
  createdAt: string;
}

interface ArticleSummary {
  id: string;
  title: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function summarizeBlock(block: { type: string; content: Record<string, unknown> }): string {
  const text =
    (block.content.title as string) ||
    (block.content.heading as string) ||
    (block.content.text as string) ||
    '';
  if (text.length > 80) return text.slice(0, 80) + '...';
  return text || '(no text content)';
}

export function RevisionsList() {
  const { siteId, id: articleId } = useParams<{
    siteId: string;
    id: string;
  }>();
  const basePath = `/sites/${siteId}`;

  const [article, setArticle] = useState<ArticleSummary | null>(null);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reverting, setReverting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [articleRes, revisionsRes] = await Promise.all([
        api.get<ArticleSummary>(`${basePath}/docs/articles/${articleId}`),
        api.get<{ data: Revision[] }>(
          `${basePath}/docs/articles/${articleId}/revisions`
        ),
      ]);
      setArticle(articleRes);
      setRevisions(revisionsRes.data ?? []);
    } catch {
      // error loading
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [siteId, articleId]);

  const handleRevert = async (revisionId: string) => {
    if (!confirm('Revert to this revision? The current content will be saved as a new revision.')) {
      return;
    }
    setReverting(revisionId);
    try {
      await api.post(
        `${basePath}/docs/articles/${articleId}/revisions/${revisionId}/revert`,
        {}
      );
      await load();
    } catch {
      // revert error
    } finally {
      setReverting(null);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to={`/sites/${siteId}/docs/articles/${articleId}`}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Revision History</h1>
          {article && (
            <p className="text-sm text-muted-foreground">{article.title}</p>
          )}
        </div>
      </div>

      {/* Revision list */}
      {revisions.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
          <History className="h-10 w-10" />
          <p className="text-sm">No revisions found for this article.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {revisions.map((rev) => {
            const isExpanded = expandedId === rev.id;
            const isReverting = reverting === rev.id;

            return (
              <Card key={rev.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => toggleExpanded(rev.id)}
                      className="flex flex-1 items-center gap-3 text-left"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="flex items-center gap-3">
                        <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-mono">
                          v{rev.version}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(rev.createdAt)}
                        </span>
                        {rev.changedBy && (
                          <span className="text-sm text-muted-foreground">
                            by {rev.changedBy}
                          </span>
                        )}
                      </div>
                    </button>

                    <button
                      onClick={() => handleRevert(rev.id)}
                      disabled={isReverting}
                      className="flex h-8 items-center gap-1.5 rounded-md border border-input px-3 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-50"
                    >
                      {isReverting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="h-3.5 w-3.5" />
                      )}
                      Revert
                    </button>
                  </div>

                  {rev.changeNote && (
                    <p className="mt-2 ml-7 text-sm text-muted-foreground">
                      {rev.changeNote}
                    </p>
                  )}

                  {isExpanded && rev.snapshot?.blocks && (
                    <div className="mt-4 ml-7 space-y-2 border-t border-border pt-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Content Snapshot
                      </p>
                      {rev.snapshot.blocks.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No content blocks in this revision.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {rev.snapshot.blocks.map((block, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-2 rounded-md border border-border p-2"
                            >
                              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] capitalize font-mono shrink-0">
                                {block.type}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {summarizeBlock(block)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
