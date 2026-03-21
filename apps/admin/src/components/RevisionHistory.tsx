import { useState, useEffect } from 'react';
import { Clock, RotateCcw, Eye, ChevronDown, ChevronUp, User } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Separator,
  cn,
} from '@netrun-cms/ui';
import { api } from '../lib/api';

interface Revision {
  id: string;
  pageId: string;
  version: number;
  title: string;
  slug: string;
  contentSnapshot: Array<Record<string, unknown>>;
  settingsSnapshot: Record<string, unknown>;
  changedBy: string | null;
  changeNote: string | null;
  createdAt: string;
}

interface RevisionHistoryProps {
  siteId: string;
  pageId: string;
  onReverted?: () => void;
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

export function RevisionHistory({ siteId, pageId, onReverted }: RevisionHistoryProps) {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reverting, setReverting] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const fetchRevisions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ data: Revision[] }>(
        `/sites/${siteId}/pages/${pageId}/revisions`
      );
      setRevisions(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load revisions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pageId) {
      fetchRevisions();
    }
  }, [siteId, pageId]);

  const handleRevert = async (revisionId: string, version: number) => {
    if (!confirm(`Revert this page to version ${version}? The current state will be saved as a new revision before reverting.`)) {
      return;
    }
    setReverting(revisionId);
    try {
      await api.post(
        `/sites/${siteId}/pages/${pageId}/revisions/${revisionId}/revert`,
        {}
      );
      await fetchRevisions();
      onReverted?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Revert failed');
    } finally {
      setReverting(null);
    }
  };

  return (
    <Card>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Revision History</CardTitle>
            {revisions.length > 0 && (
              <Badge variant="secondary">{revisions.length}</Badge>
            )}
          </div>
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      {!isCollapsed && (
        <CardContent>
          {loading && (
            <p className="text-sm text-muted-foreground">Loading revisions...</p>
          )}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          {!loading && !error && revisions.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No revisions yet. Revisions are created automatically when you save changes.
            </p>
          )}
          {!loading && revisions.length > 0 && (
            <div className="space-y-3">
              {revisions.map((rev) => (
                <div key={rev.id} className="rounded-lg border">
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/50"
                    onClick={() =>
                      setExpandedId(expandedId === rev.id ? null : rev.id)
                    }
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">v{rev.version}</Badge>
                        <span className="text-sm font-medium">{rev.title}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{formatDate(rev.createdAt)}</span>
                        {rev.changedBy && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {rev.changedBy}
                          </span>
                        )}
                      </div>
                      {rev.changeNote && (
                        <p className="mt-1 text-xs text-muted-foreground italic">
                          {rev.changeNote}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(expandedId === rev.id ? null : rev.id);
                        }}
                      >
                        <Eye className="mr-1 h-3 w-3" />
                        Preview
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={reverting === rev.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRevert(rev.id, rev.version);
                        }}
                      >
                        <RotateCcw className={cn('mr-1 h-3 w-3', reverting === rev.id && 'animate-spin')} />
                        {reverting === rev.id ? 'Reverting...' : 'Revert'}
                      </Button>
                    </div>
                  </div>
                  {expandedId === rev.id && (
                    <div className="border-t p-3 bg-muted/30">
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Slug:</span>{' '}
                          <span className="text-muted-foreground">/{rev.slug}</span>
                        </div>
                        <Separator />
                        <div className="text-sm font-medium">
                          Content Blocks ({rev.contentSnapshot.length})
                        </div>
                        {rev.contentSnapshot.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No blocks in this revision</p>
                        ) : (
                          <div className="space-y-1">
                            {rev.contentSnapshot.map((block, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 rounded border bg-background px-3 py-2 text-sm"
                              >
                                <Badge variant="secondary" className="text-xs">
                                  {(block.blockType as string) || 'unknown'}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Order: {(block.sortOrder as number) ?? idx}
                                </span>
                                {block.isVisible === false && (
                                  <Badge variant="outline" className="text-xs">Hidden</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {rev.settingsSnapshot && Object.keys(rev.settingsSnapshot).length > 0 && (
                          <>
                            <Separator />
                            <div className="text-sm font-medium">Settings</div>
                            <div className="space-y-1 text-xs text-muted-foreground">
                              {Object.entries(rev.settingsSnapshot).map(([key, value]) => (
                                value != null && (
                                  <div key={key}>
                                    <span className="font-medium">{key}:</span> {String(value)}
                                  </div>
                                )
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
