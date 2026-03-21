import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Loader2, MessageCircle, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';

interface FeedbackStats {
  totalHelpful: number;
  totalNotHelpful: number;
  totalResponses: number;
  responseRate: number;
  averagePerArticle: number;
}

interface ArticleFeedback {
  articleId: string;
  articleTitle: string;
  helpfulCount: number;
  notHelpfulCount: number;
  latestComment: string | null;
  comments: FeedbackComment[];
}

interface FeedbackComment {
  id: string;
  helpful: boolean;
  comment: string | null;
  createdAt: string;
}

type FeedbackFilter = 'all' | 'helpful' | 'not_helpful';

export function FeedbackList() {
  const { siteId } = useParams<{ siteId: string }>();
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [feedback, setFeedback] = useState<ArticleFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FeedbackFilter>('all');
  const [articleFilter, setArticleFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const basePath = `/sites/${siteId}/docs/feedback`;

  const load = async () => {
    setLoading(true);
    try {
      const [feedbackRes, statsRes] = await Promise.all([
        api.get<{ data: ArticleFeedback[] }>(basePath),
        api.get<{ data: FeedbackStats }>(`${basePath}/stats`),
      ]);
      setFeedback(feedbackRes.data ?? []);
      setStats(statsRes.data ?? null);
    } catch {
      // empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [siteId]);

  const filtered = feedback.filter((f) => {
    if (articleFilter && f.articleId !== articleFilter) return false;
    if (filter === 'helpful' && f.helpfulCount === 0) return false;
    if (filter === 'not_helpful' && f.notHelpfulCount === 0) return false;
    return true;
  });

  const ratioBar = (helpful: number, notHelpful: number) => {
    const total = helpful + notHelpful;
    if (total === 0) return null;
    const pct = Math.round((helpful / total) * 100);
    return (
      <div className="flex items-center gap-2 w-full max-w-[200px]">
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground shrink-0 w-10 text-right">{pct}%</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Feedback</h1>
        {stats && (
          <span className="text-sm text-muted-foreground">
            {stats.totalResponses} total responses
          </span>
        )}
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <ThumbsUp className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalHelpful}</p>
                  <p className="text-xs text-muted-foreground">Total Helpful</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                  <ThumbsDown className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalNotHelpful}</p>
                  <p className="text-xs text-muted-foreground">Total Not Helpful</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {stats.totalResponses > 0
                      ? `${Math.round((stats.totalHelpful / stats.totalResponses) * 100)}%`
                      : '--'}
                  </p>
                  <p className="text-xs text-muted-foreground">Helpful Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Article filter */}
            <select
              value={articleFilter}
              onChange={(e) => setArticleFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">All Articles</option>
              {feedback.map((f) => (
                <option key={f.articleId} value={f.articleId}>{f.articleTitle}</option>
              ))}
            </select>

            {/* Sentiment filter */}
            <div className="flex gap-2">
              {(['all', 'helpful', 'not_helpful'] as FeedbackFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm transition-colors',
                    filter === f
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  {f === 'all' ? 'All' : f === 'helpful' ? 'Helpful' : 'Not Helpful'}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback table */}
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
          <MessageCircle className="h-8 w-8" />
          <p className="text-sm">{feedback.length === 0 ? 'No feedback yet' : 'No matches'}</p>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Article</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground w-[80px]">
                    <ThumbsUp className="h-3.5 w-3.5 inline" />
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground w-[80px]">
                    <ThumbsDown className="h-3.5 w-3.5 inline" />
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Ratio</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Latest Comment</th>
                  <th className="px-6 py-3 w-[40px]"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const isExpanded = expanded === item.articleId;
                  return (
                    <tr key={item.articleId} className="group">
                      {/* Main row */}
                      <td className="px-6 py-4">
                        <span className="font-medium text-sm">{item.articleTitle}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-green-500 font-medium">{item.helpfulCount}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-red-500 font-medium">{item.notHelpfulCount}</span>
                      </td>
                      <td className="px-6 py-4">
                        {ratioBar(item.helpfulCount, item.notHelpfulCount)}
                      </td>
                      <td className="px-6 py-4">
                        {item.latestComment ? (
                          <p className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">
                            {item.latestComment}
                          </p>
                        ) : (
                          <span className="text-xs text-muted-foreground/60">--</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {item.comments && item.comments.length > 0 && (
                          <button
                            onClick={() => setExpanded(isExpanded ? null : item.articleId)}
                            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                          >
                            {isExpanded
                              ? <ChevronUp className="h-4 w-4" />
                              : <ChevronDown className="h-4 w-4" />
                            }
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Expanded comments */}
            {expanded && (() => {
              const item = filtered.find((f) => f.articleId === expanded);
              if (!item || !item.comments || item.comments.length === 0) return null;
              return (
                <div className="border-t border-border bg-accent/20 px-6 py-4">
                  <p className="text-xs font-medium text-muted-foreground mb-3">
                    Comments for "{item.articleTitle}"
                  </p>
                  <div className="space-y-3">
                    {item.comments.map((c) => (
                      <div key={c.id} className="flex items-start gap-3">
                        <div className={cn(
                          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                          c.helpful ? 'bg-green-500/10' : 'bg-red-500/10',
                        )}>
                          {c.helpful
                            ? <ThumbsUp className="h-3 w-3 text-green-500" />
                            : <ThumbsDown className="h-3 w-3 text-red-500" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          {c.comment ? (
                            <p className="text-sm">{c.comment}</p>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No comment</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(c.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </Card>
      )}
    </div>
  );
}
