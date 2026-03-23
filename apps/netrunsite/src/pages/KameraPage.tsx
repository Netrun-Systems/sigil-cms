/**
 * KAMERA admin — 3D scan pipeline management via the Sigil kamera plugin.
 *
 * Shows scan job submissions, processing status, and integrates with the
 * Survai processing pipeline API.
 */

import { ScanLine } from 'lucide-react';
import Header from '../components/common/Header';
import Panel from '../components/common/Panel';

export default function KameraPage() {
  return (
    <div>
      <Header
        title="KAMERA"
        subtitle="3D scan pipeline — job submissions and processing status"
      />
      <div className="p-4 md:p-8 space-y-6">
        <Panel title="Scan Jobs" noPadding>
          <div className="px-5 py-8 text-center">
            <ScanLine size={24} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              KAMERA scan jobs submitted through netrunsystems.com/kamera.
              Jobs are processed by the Survai pipeline and results delivered
              via the KAMERA plugin's scan viewer block.
            </p>
          </div>
        </Panel>
        <Panel title="Pipeline Status">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Connected to Survai API for real-time processing status.
            Scan submissions flow through: upload &rarr; queue &rarr; process &rarr;
            report generation &rarr; delivery.
          </p>
        </Panel>
        <Panel title="Route Mapping">
          <div className="space-y-2 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
            <p>POST /api/v1/public/kamera/:siteSlug/jobs &mdash; Submit scan job</p>
            <p>GET  /api/v1/public/kamera/:siteSlug/jobs/:id &mdash; Job status</p>
            <p>GET  /api/v1/sites/:siteId/kamera/jobs &mdash; Admin: list all jobs</p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
