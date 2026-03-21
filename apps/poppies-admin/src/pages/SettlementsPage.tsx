/**
 * Settlements page — monthly payout summaries per artist.
 * From the @poppies/consignment plugin.
 */

import Header from '../components/common/Header';
import Panel from '../components/common/Panel';

export default function SettlementsPage() {
  return (
    <div>
      <Header
        title="Settlements"
        subtitle="Monthly payout summaries for consignment artists"
        actions={
          <button
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: 'var(--accent)' }}
          >
            Generate Settlements
          </button>
        }
      />
      <div className="p-4 md:p-8 space-y-6">
        <Panel title="Settlement Periods">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Generate monthly settlement reports. Each settlement aggregates all sales for an artist
            in a given month, calculates commission splits, and creates a payout summary.
          </p>
          <div className="mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            Statuses: Draft (pending review) | Paid (settled with artist)
          </div>
        </Panel>
      </div>
    </div>
  );
}
