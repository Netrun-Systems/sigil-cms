import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Loader2, Radio, Podcast, Calendar, Users, RefreshCw, Play,
  AlertCircle, Clock, Eye, Wifi,
} from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';

interface LiveStream {
  id: string;
  title: string;
  viewerCount: number;
  streamUrl: string;
  startedAt: string;
}

interface PodcastEpisode {
  id: string;
  title: string;
  duration: number; // seconds
  publishDate: string;
  audioUrl: string;
}

interface ScheduledBroadcast {
  id: string;
  title: string;
  scheduledAt: string;
  type: 'live' | 'podcast' | 'rebroadcast';
}

interface IntirkastConfig {
  connected: boolean;
  apiUrl: string;
  subscriberCount: number | null;
}

const broadcastTypeBadge: Record<ScheduledBroadcast['type'], string> = {
  live: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  podcast: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  rebroadcast: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function BroadcastsPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const basePath = `/sites/${siteId}`;

  const [loading, setLoading] = useState(true);
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [schedule, setSchedule] = useState<ScheduledBroadcast[]>([]);
  const [config, setConfig] = useState<IntirkastConfig | null>(null);
  const [testing, setTesting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [liveRes, episodesRes, scheduleRes, configRes] = await Promise.all([
        api.get<{ data: LiveStream[] }>(`${basePath}/intirkast/live`),
        api.get<{ data: PodcastEpisode[] }>(`${basePath}/intirkast/episodes`),
        api.get<{ data: ScheduledBroadcast[] }>(`${basePath}/intirkast/schedule`),
        api.get<{ data: IntirkastConfig }>(`${basePath}/intirkast/config`),
      ]);
      setLiveStreams(liveRes.data ?? []);
      setEpisodes(episodesRes.data ?? []);
      setSchedule(scheduleRes.data ?? []);
      setConfig(configRes.data ?? null);
    } catch {
      // graceful empty state
    } finally {
      setLoading(false);
    }
  }, [basePath]);

  useEffect(() => { load(); }, [load]);

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const res = await api.post<{ data: { connected: boolean } }>(`${basePath}/intirkast/test-connection`, {});
      setConfig((prev) => prev ? { ...prev, connected: res.data?.connected ?? false } : prev);
    } catch {
      setConfig((prev) => prev ? { ...prev, connected: false } : prev);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Broadcasting</h1>
          <span
            className={cn(
              'h-2.5 w-2.5 rounded-full',
              config?.connected ? 'bg-green-500' : 'bg-red-500'
            )}
            title={config?.connected ? 'Connected' : 'Disconnected'}
          />
        </div>
        <button
          onClick={load}
          className="flex h-9 items-center gap-2 rounded-md border border-input px-4 text-sm transition-colors hover:bg-accent"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Live Now */}
      {liveStreams.length > 0 && (
        <Card className="border-red-500/50">
          <CardContent className="pt-6">
            {liveStreams.map((stream) => (
              <div key={stream.id} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 rounded-md bg-red-600 px-2.5 py-1 text-xs font-bold uppercase text-white animate-pulse">
                    <Wifi className="h-3 w-3" /> LIVE
                  </span>
                  <div>
                    <p className="font-medium">{stream.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Started {new Date(stream.startedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    {stream.viewerCount.toLocaleString()} viewers
                  </div>
                  <a
                    href={stream.streamUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 items-center gap-2 rounded-md bg-red-600 px-3 text-xs font-medium text-white transition-colors hover:bg-red-700"
                  >
                    <Radio className="h-3.5 w-3.5" /> Watch
                  </a>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Stats Row */}
      {config?.subscriberCount != null && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{config.subscriberCount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Newsletter Subscribers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Podcast className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{episodes.length}</p>
                  <p className="text-xs text-muted-foreground">Podcast Episodes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{schedule.length}</p>
                  <p className="text-xs text-muted-foreground">Upcoming Broadcasts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Podcast Episodes */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Podcast Episodes</h2>
        {episodes.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
            <Podcast className="h-8 w-8" />
            <p className="text-sm">No episodes yet</p>
          </div>
        ) : (
          <Card>
            <div className="divide-y divide-border">
              {episodes.map((episode) => (
                <div key={episode.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-4">
                    <a
                      href={episode.audioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20"
                    >
                      <Play className="h-4 w-4" />
                    </a>
                    <div>
                      <p className="text-sm font-medium">{episode.title}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(episode.duration)}
                        </span>
                        <span>{new Date(episode.publishDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Broadcast Schedule */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Broadcast Schedule</h2>
        {schedule.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
            <Calendar className="h-8 w-8" />
            <p className="text-sm">No upcoming broadcasts</p>
          </div>
        ) : (
          <Card>
            <div className="divide-y divide-border">
              {schedule.map((broadcast) => {
                const dt = new Date(broadcast.scheduledAt);
                return (
                  <div key={broadcast.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="flex h-12 w-12 flex-col items-center justify-center rounded-md bg-muted text-center">
                      <span className="text-xs font-medium uppercase text-muted-foreground">
                        {dt.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-lg font-bold leading-none">{dt.getDate()}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{broadcast.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'rounded-md px-2 py-0.5 text-xs font-medium capitalize',
                        broadcastTypeBadge[broadcast.type]
                      )}
                    >
                      {broadcast.type}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      {/* Config Section */}
      <Card>
        <CardContent className="pt-6">
          <p className="mb-3 text-sm font-medium">Configuration</p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-muted-foreground">
                Intirkast API URL (set via environment)
              </label>
              <div className="flex h-9 items-center rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground">
                {config?.apiUrl || 'Not configured'}
              </div>
            </div>
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="mt-4 flex h-9 items-center gap-2 rounded-md border border-input px-4 text-sm transition-colors hover:bg-accent disabled:opacity-50"
            >
              {testing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5" />
              )}
              Test
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
