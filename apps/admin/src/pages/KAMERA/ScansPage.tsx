import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Loader2,
  ScanLine,
  ChevronDown,
  ChevronUp,
  FileDown,
  FileBarChart,
  Wifi,
  WifiOff,
  AlertTriangle,
  Box,
} from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';

interface Detection {
  type: string;
  confidence: number;
  label: string;
}

interface Scan {
  id: string;
  filename: string;
  status: 'processing' | 'completed' | 'failed';
  detectionCount: number;
  detections: Detection[];
  thumbnailUrl: string | null;
  createdAt: string;
}

const statusStyles: Record<string, string> = {
  processing: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400',
  completed: 'border-green-500/50 bg-green-500/10 text-green-400',
  failed: 'border-red-500/50 bg-red-500/10 text-red-400',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ScansPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const basePath = `/sites/${siteId}`;

  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  const checkConnection = async () => {
    try {
      await api.get(`${basePath}/kamera/health`);
      setConnected(true);
    } catch {
      setConnected(false);
    }
  };

  const loadScans = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Scan[] }>(`${basePath}/kamera/scans`);
      setScans(res.data ?? []);
    } catch {
      // empty state on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
    loadScans();
  }, [siteId]);

  const toggleExpanded = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleGenerateReport = async (scanId: string) => {
    setGenerating(scanId);
    try {
      await api.post(`${basePath}/kamera/scans/${scanId}/report`, {});
    } catch {
      // report generation error
    } finally {
      setGenerating(null);
    }
  };

  const handleExport = async (scanId: string, format: string) => {
    setExporting(scanId);
    try {
      const res = await api.get<{ url: string }>(
        `${basePath}/kamera/scans/${scanId}/export?format=${format}`
      );
      if (res.url) {
        window.open(res.url, '_blank');
      }
    } catch {
      // export error
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">KAMERA Scans</h1>
          {connected !== null && (
            <span
              className={cn(
                'flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border',
                connected
                  ? 'border-green-500/50 bg-green-500/10 text-green-400'
                  : 'border-red-500/50 bg-red-500/10 text-red-400'
              )}
            >
              {connected ? (
                <Wifi className="h-3 w-3" />
              ) : (
                <WifiOff className="h-3 w-3" />
              )}
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          )}
        </div>
      </div>

      {/* Connection failed / no scans setup card */}
      {connected === false && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-yellow-500/10 text-yellow-500">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  KAMERA / SURVAI Connection Failed
                </p>
                <p className="text-sm text-muted-foreground">
                  Could not reach the SURVAI API. To use KAMERA 3D scan
                  management, ensure the following:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>
                    Set <code className="text-xs bg-muted px-1 rounded">SURVAI_API_URL</code> in your environment
                  </li>
                  <li>The SURVAI service is running and accessible</li>
                  <li>
                    The KAMERA plugin is enabled for this site
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scan list */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : scans.length === 0 && connected !== false ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
          <ScanLine className="h-10 w-10" />
          <p className="text-sm">No scans found.</p>
          <p className="text-xs">
            Upload 3D scan data through the KAMERA pipeline to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {scans.map((scan) => {
            const isExpanded = expandedId === scan.id;
            const isGenerating = generating === scan.id;
            const isExporting = exporting === scan.id;

            return (
              <Card key={scan.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => toggleExpanded(scan.id)}
                      className="flex flex-1 items-center gap-3 text-left"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}

                      {/* Thumbnail placeholder */}
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted shrink-0">
                        <Box className="h-5 w-5 text-muted-foreground" />
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-medium">
                          {scan.filename}
                        </span>
                        <span
                          className={cn(
                            'rounded-md px-2 py-0.5 text-xs capitalize border',
                            statusStyles[scan.status] || ''
                          )}
                        >
                          {scan.status}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {scan.detectionCount} detection
                          {scan.detectionCount !== 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(scan.createdAt)}
                        </span>
                      </div>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleGenerateReport(scan.id)}
                        disabled={
                          isGenerating || scan.status !== 'completed'
                        }
                        className="flex h-8 items-center gap-1.5 rounded-md border border-input px-3 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-50"
                      >
                        {isGenerating ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <FileBarChart className="h-3.5 w-3.5" />
                        )}
                        Generate Report
                      </button>

                      {/* Export dropdown */}
                      <div className="relative group">
                        <button
                          disabled={
                            isExporting || scan.status !== 'completed'
                          }
                          className="flex h-8 items-center gap-1.5 rounded-md border border-input px-3 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-50"
                        >
                          {isExporting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <FileDown className="h-3.5 w-3.5" />
                          )}
                          Export
                          <ChevronDown className="h-3 w-3" />
                        </button>
                        <div className="absolute right-0 top-full mt-1 z-10 hidden group-hover:block rounded-md border border-border bg-popover shadow-md">
                          {['JSON', 'CSV', 'GeoJSON'].map((fmt) => (
                            <button
                              key={fmt}
                              onClick={() =>
                                handleExport(scan.id, fmt.toLowerCase())
                              }
                              className="block w-full px-4 py-1.5 text-left text-xs hover:bg-accent transition-colors"
                            >
                              {fmt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded detections */}
                  {isExpanded && scan.detections && (
                    <div className="mt-4 ml-7 space-y-2 border-t border-border pt-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Detections
                      </p>
                      {scan.detections.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No detections recorded.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {scan.detections.map((det, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-3 rounded-md border border-border p-2"
                            >
                              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] capitalize font-mono shrink-0">
                                {det.type}
                              </span>
                              <span className="text-xs flex-1">
                                {det.label}
                              </span>
                              <span
                                className={cn(
                                  'text-xs font-mono',
                                  det.confidence >= 0.8
                                    ? 'text-green-400'
                                    : det.confidence >= 0.5
                                      ? 'text-yellow-400'
                                      : 'text-red-400'
                                )}
                              >
                                {(det.confidence * 100).toFixed(1)}%
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
