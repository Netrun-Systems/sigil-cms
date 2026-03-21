/**
 * Individual artist dashboard — profile + products + sales in one view.
 *
 * Combines data from:
 *   - Sigil artist plugin (profile, bio, social links)
 *   - Sigil store plugin (products linked to this artist)
 *   - @poppies/consignment plugin (commission rate, sales, settlements)
 *   - Sigil photos plugin (gallery images by this artist)
 */

import Header from '../components/common/Header';
import Panel from '../components/common/Panel';
import MetricCard from '../components/common/MetricCard';

export default function ArtistDashboardPage() {
  return (
    <div>
      <Header title="Artist Dashboard" subtitle="Profile, products, and sales overview" />
      <div className="p-4 md:p-8 space-y-6">
        {/* Artist stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Commission Rate" value="60%" format="text" />
          <MetricCard label="Active Items" value={0} />
          <MetricCard label="Lifetime Sales" value={0} format="currency" />
          <MetricCard label="Pending Payout" value={0} format="currency" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Panel title="Profile">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Artist profile loaded from the Sigil artist plugin.
            </p>
          </Panel>

          <Panel title="Consignment Items">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Items currently on consignment from this artist.
            </p>
          </Panel>

          <Panel title="Recent Sales">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Sales for this artist from the consignment plugin.
            </p>
          </Panel>

          <Panel title="Gallery">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Photos of this artist's work from the photos plugin.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
