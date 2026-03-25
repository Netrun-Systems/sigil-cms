import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, ScanLine, ChevronDown, ChevronUp, FileDown, FileBarChart, Wifi, WifiOff, AlertTriangle, Box, } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';
const statusStyles = {
    processing: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400',
    completed: 'border-green-500/50 bg-green-500/10 text-green-400',
    failed: 'border-red-500/50 bg-red-500/10 text-red-400',
};
function formatDate(iso) {
    return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
export function ScansPage() {
    const { siteId } = useParams();
    const basePath = `/sites/${siteId}`;
    const [scans, setScans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [generating, setGenerating] = useState(null);
    const [exporting, setExporting] = useState(null);
    const checkConnection = async () => {
        try {
            await api.get(`${basePath}/kamera/health`);
            setConnected(true);
        }
        catch {
            setConnected(false);
        }
    };
    const loadScans = async () => {
        setLoading(true);
        try {
            const res = await api.get(`${basePath}/kamera/scans`);
            setScans(res.data ?? []);
        }
        catch {
            // empty state on error
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        checkConnection();
        loadScans();
    }, [siteId]);
    const toggleExpanded = (id) => {
        setExpandedId((prev) => (prev === id ? null : id));
    };
    const handleGenerateReport = async (scanId) => {
        setGenerating(scanId);
        try {
            await api.post(`${basePath}/kamera/scans/${scanId}/report`, {});
        }
        catch {
            // report generation error
        }
        finally {
            setGenerating(null);
        }
    };
    const handleExport = async (scanId, format) => {
        setExporting(scanId);
        try {
            const res = await api.get(`${basePath}/kamera/scans/${scanId}/export?format=${format}`);
            if (res.url) {
                window.open(res.url, '_blank');
            }
        }
        catch {
            // export error
        }
        finally {
            setExporting(null);
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "KAMERA Scans" }), connected !== null && (_jsxs("span", { className: cn('flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border', connected
                                ? 'border-green-500/50 bg-green-500/10 text-green-400'
                                : 'border-red-500/50 bg-red-500/10 text-red-400'), children: [connected ? (_jsx(Wifi, { className: "h-3 w-3" })) : (_jsx(WifiOff, { className: "h-3 w-3" })), connected ? 'Connected' : 'Disconnected'] }))] }) }), connected === false && (_jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-md bg-yellow-500/10 text-yellow-500", children: _jsx(AlertTriangle, { className: "h-5 w-5" }) }), _jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm font-medium", children: "KAMERA / SURVAI Connection Failed" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Could not reach the SURVAI API. To use KAMERA 3D scan management, ensure the following:" }), _jsxs("ul", { className: "list-disc list-inside text-sm text-muted-foreground space-y-1", children: [_jsxs("li", { children: ["Set ", _jsx("code", { className: "text-xs bg-muted px-1 rounded", children: "SURVAI_API_URL" }), " in your environment"] }), _jsx("li", { children: "The SURVAI service is running and accessible" }), _jsx("li", { children: "The KAMERA plugin is enabled for this site" })] })] })] }) }) })), loading ? (_jsx("div", { className: "flex h-48 items-center justify-center", children: _jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }) })) : scans.length === 0 && connected !== false ? (_jsxs("div", { className: "flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground", children: [_jsx(ScanLine, { className: "h-10 w-10" }), _jsx("p", { className: "text-sm", children: "No scans found." }), _jsx("p", { className: "text-xs", children: "Upload 3D scan data through the KAMERA pipeline to get started." })] })) : (_jsx("div", { className: "space-y-3", children: scans.map((scan) => {
                    const isExpanded = expandedId === scan.id;
                    const isGenerating = generating === scan.id;
                    const isExporting = exporting === scan.id;
                    return (_jsx(Card, { children: _jsxs(CardContent, { className: "pt-4 pb-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("button", { onClick: () => toggleExpanded(scan.id), className: "flex flex-1 items-center gap-3 text-left", children: [isExpanded ? (_jsx(ChevronUp, { className: "h-4 w-4 text-muted-foreground shrink-0" })) : (_jsx(ChevronDown, { className: "h-4 w-4 text-muted-foreground shrink-0" })), _jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-md bg-muted shrink-0", children: _jsx(Box, { className: "h-5 w-5 text-muted-foreground" }) }), _jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [_jsx("span", { className: "text-sm font-medium", children: scan.filename }), _jsx("span", { className: cn('rounded-md px-2 py-0.5 text-xs capitalize border', statusStyles[scan.status] || ''), children: scan.status }), _jsxs("span", { className: "text-xs text-muted-foreground", children: [scan.detectionCount, " detection", scan.detectionCount !== 1 ? 's' : ''] }), _jsx("span", { className: "text-xs text-muted-foreground", children: formatDate(scan.createdAt) })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("button", { onClick: () => handleGenerateReport(scan.id), disabled: isGenerating || scan.status !== 'completed', className: "flex h-8 items-center gap-1.5 rounded-md border border-input px-3 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-50", children: [isGenerating ? (_jsx(Loader2, { className: "h-3.5 w-3.5 animate-spin" })) : (_jsx(FileBarChart, { className: "h-3.5 w-3.5" })), "Generate Report"] }), _jsxs("div", { className: "relative group", children: [_jsxs("button", { disabled: isExporting || scan.status !== 'completed', className: "flex h-8 items-center gap-1.5 rounded-md border border-input px-3 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-50", children: [isExporting ? (_jsx(Loader2, { className: "h-3.5 w-3.5 animate-spin" })) : (_jsx(FileDown, { className: "h-3.5 w-3.5" })), "Export", _jsx(ChevronDown, { className: "h-3 w-3" })] }), _jsx("div", { className: "absolute right-0 top-full mt-1 z-10 hidden group-hover:block rounded-md border border-border bg-popover shadow-md", children: ['JSON', 'CSV', 'GeoJSON'].map((fmt) => (_jsx("button", { onClick: () => handleExport(scan.id, fmt.toLowerCase()), className: "block w-full px-4 py-1.5 text-left text-xs hover:bg-accent transition-colors", children: fmt }, fmt))) })] })] })] }), isExpanded && scan.detections && (_jsxs("div", { className: "mt-4 ml-7 space-y-2 border-t border-border pt-3", children: [_jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wide", children: "Detections" }), scan.detections.length === 0 ? (_jsx("p", { className: "text-sm text-muted-foreground", children: "No detections recorded." })) : (_jsx("div", { className: "space-y-1.5", children: scan.detections.map((det, i) => (_jsxs("div", { className: "flex items-center gap-3 rounded-md border border-border p-2", children: [_jsx("span", { className: "rounded bg-muted px-1.5 py-0.5 text-[10px] capitalize font-mono shrink-0", children: det.type }), _jsx("span", { className: "text-xs flex-1", children: det.label }), _jsxs("span", { className: cn('text-xs font-mono', det.confidence >= 0.8
                                                            ? 'text-green-400'
                                                            : det.confidence >= 0.5
                                                                ? 'text-yellow-400'
                                                                : 'text-red-400'), children: [(det.confidence * 100).toFixed(1), "%"] })] }, i))) }))] }))] }) }, scan.id));
                }) }))] }));
}
//# sourceMappingURL=ScansPage.js.map