import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Radio, Podcast, Calendar, Users, RefreshCw, Play, AlertCircle, Clock, Eye, Wifi, } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';
const broadcastTypeBadge = {
    live: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    podcast: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    rebroadcast: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};
function formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0)
        return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
}
export function BroadcastsPage() {
    const { siteId } = useParams();
    const basePath = `/sites/${siteId}`;
    const [loading, setLoading] = useState(true);
    const [liveStreams, setLiveStreams] = useState([]);
    const [episodes, setEpisodes] = useState([]);
    const [schedule, setSchedule] = useState([]);
    const [config, setConfig] = useState(null);
    const [testing, setTesting] = useState(false);
    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [liveRes, episodesRes, scheduleRes, configRes] = await Promise.all([
                api.get(`${basePath}/intirkast/live`),
                api.get(`${basePath}/intirkast/episodes`),
                api.get(`${basePath}/intirkast/schedule`),
                api.get(`${basePath}/intirkast/config`),
            ]);
            setLiveStreams(liveRes.data ?? []);
            setEpisodes(episodesRes.data ?? []);
            setSchedule(scheduleRes.data ?? []);
            setConfig(configRes.data ?? null);
        }
        catch {
            // graceful empty state
        }
        finally {
            setLoading(false);
        }
    }, [basePath]);
    useEffect(() => { load(); }, [load]);
    const handleTestConnection = async () => {
        setTesting(true);
        try {
            const res = await api.post(`${basePath}/intirkast/test-connection`, {});
            setConfig((prev) => prev ? { ...prev, connected: res.data?.connected ?? false } : prev);
        }
        catch {
            setConfig((prev) => prev ? { ...prev, connected: false } : prev);
        }
        finally {
            setTesting(false);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "flex h-32 items-center justify-center", children: _jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Broadcasting" }), _jsx("span", { className: cn('h-2.5 w-2.5 rounded-full', config?.connected ? 'bg-green-500' : 'bg-red-500'), title: config?.connected ? 'Connected' : 'Disconnected' })] }), _jsxs("button", { onClick: load, className: "flex h-9 items-center gap-2 rounded-md border border-input px-4 text-sm transition-colors hover:bg-accent", children: [_jsx(RefreshCw, { className: "h-4 w-4" }), " Refresh"] })] }), liveStreams.length > 0 && (_jsx(Card, { className: "border-red-500/50", children: _jsx(CardContent, { className: "pt-6", children: liveStreams.map((stream) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("span", { className: "flex items-center gap-1.5 rounded-md bg-red-600 px-2.5 py-1 text-xs font-bold uppercase text-white animate-pulse", children: [_jsx(Wifi, { className: "h-3 w-3" }), " LIVE"] }), _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: stream.title }), _jsxs("p", { className: "text-xs text-muted-foreground", children: ["Started ", new Date(stream.startedAt).toLocaleTimeString()] })] })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "flex items-center gap-1.5 text-sm text-muted-foreground", children: [_jsx(Eye, { className: "h-4 w-4" }), stream.viewerCount.toLocaleString(), " viewers"] }), _jsxs("a", { href: stream.streamUrl, target: "_blank", rel: "noopener noreferrer", className: "flex h-8 items-center gap-2 rounded-md bg-red-600 px-3 text-xs font-medium text-white transition-colors hover:bg-red-700", children: [_jsx(Radio, { className: "h-3.5 w-3.5" }), " Watch"] })] })] }, stream.id))) }) })), config?.subscriberCount != null && (_jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-3", children: [_jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Users, { className: "h-5 w-5 text-primary" }), _jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold", children: config.subscriberCount.toLocaleString() }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Newsletter Subscribers" })] })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Podcast, { className: "h-5 w-5 text-primary" }), _jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold", children: episodes.length }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Podcast Episodes" })] })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Calendar, { className: "h-5 w-5 text-primary" }), _jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold", children: schedule.length }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Upcoming Broadcasts" })] })] }) }) })] })), _jsxs("div", { children: [_jsx("h2", { className: "mb-3 text-lg font-semibold", children: "Podcast Episodes" }), episodes.length === 0 ? (_jsxs("div", { className: "flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground", children: [_jsx(Podcast, { className: "h-8 w-8" }), _jsx("p", { className: "text-sm", children: "No episodes yet" })] })) : (_jsx(Card, { children: _jsx("div", { className: "divide-y divide-border", children: episodes.map((episode) => (_jsx("div", { className: "flex items-center justify-between px-6 py-4", children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("a", { href: episode.audioUrl, target: "_blank", rel: "noopener noreferrer", className: "flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20", children: _jsx(Play, { className: "h-4 w-4" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", children: episode.title }), _jsxs("div", { className: "flex items-center gap-3 text-xs text-muted-foreground", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Clock, { className: "h-3 w-3" }), formatDuration(episode.duration)] }), _jsx("span", { children: new Date(episode.publishDate).toLocaleDateString() })] })] })] }) }, episode.id))) }) }))] }), _jsxs("div", { children: [_jsx("h2", { className: "mb-3 text-lg font-semibold", children: "Broadcast Schedule" }), schedule.length === 0 ? (_jsxs("div", { className: "flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground", children: [_jsx(Calendar, { className: "h-8 w-8" }), _jsx("p", { className: "text-sm", children: "No upcoming broadcasts" })] })) : (_jsx(Card, { children: _jsx("div", { className: "divide-y divide-border", children: schedule.map((broadcast) => {
                                const dt = new Date(broadcast.scheduledAt);
                                return (_jsxs("div", { className: "flex items-center gap-4 px-6 py-4", children: [_jsxs("div", { className: "flex h-12 w-12 flex-col items-center justify-center rounded-md bg-muted text-center", children: [_jsx("span", { className: "text-xs font-medium uppercase text-muted-foreground", children: dt.toLocaleDateString('en-US', { month: 'short' }) }), _jsx("span", { className: "text-lg font-bold leading-none", children: dt.getDate() })] }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-medium", children: broadcast.title }), _jsx("p", { className: "text-xs text-muted-foreground", children: dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) })] }), _jsx("span", { className: cn('rounded-md px-2 py-0.5 text-xs font-medium capitalize', broadcastTypeBadge[broadcast.type]), children: broadcast.type })] }, broadcast.id));
                            }) }) }))] }), _jsx(Card, { children: _jsxs(CardContent, { className: "pt-6", children: [_jsx("p", { className: "mb-3 text-sm font-medium", children: "Configuration" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "mb-1 block text-xs text-muted-foreground", children: "Intirkast API URL (set via environment)" }), _jsx("div", { className: "flex h-9 items-center rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground", children: config?.apiUrl || 'Not configured' })] }), _jsxs("button", { onClick: handleTestConnection, disabled: testing, className: "mt-4 flex h-9 items-center gap-2 rounded-md border border-input px-4 text-sm transition-colors hover:bg-accent disabled:opacity-50", children: [testing ? (_jsx(Loader2, { className: "h-3.5 w-3.5 animate-spin" })) : (_jsx(AlertCircle, { className: "h-3.5 w-3.5" })), "Test"] })] })] }) })] }));
}
//# sourceMappingURL=BroadcastsPage.js.map