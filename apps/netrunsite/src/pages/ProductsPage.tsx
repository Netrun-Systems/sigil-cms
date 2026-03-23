/**
 * Store / Products — KAMERA scan pricing and Stripe products via the Sigil store plugin.
 */

import Header from '../components/common/Header';
import Panel from '../components/common/Panel';

export default function ProductsPage() {
  return (
    <div>
      <Header
        title="Store"
        subtitle="KAMERA scan packages and Stripe product management"
        actions={
          <button
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--accent)', color: 'var(--bg-base)' }}
          >
            Add Product
          </button>
        }
      />
      <div className="p-4 md:p-8 space-y-6">
        <Panel title="Products">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Product catalog powered by the Sigil store plugin with Stripe integration.
            KAMERA scan packages (Basic, Professional, Enterprise) are managed here.
            Stripe webhooks route through the store plugin for order fulfillment.
          </p>
        </Panel>
        <Panel title="Orders">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Stripe checkout orders for KAMERA scans. Order status tracks from
            payment &rarr; scan submission &rarr; processing &rarr; delivery.
          </p>
        </Panel>
      </div>
    </div>
  );
}
