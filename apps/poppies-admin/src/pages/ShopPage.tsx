/**
 * Shop page — product catalog and orders via the Sigil store plugin.
 * Products are linked to consignment artists for commission tracking.
 */

import Header from '../components/common/Header';
import Panel from '../components/common/Panel';

export default function ShopPage() {
  return (
    <div>
      <Header
        title="Shop"
        subtitle="Product catalog and order management"
        actions={
          <button
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: 'var(--accent)' }}
          >
            Add Product
          </button>
        }
      />
      <div className="p-4 md:p-8 space-y-6">
        <Panel title="Products">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Product catalog powered by the Sigil store plugin.
            Products linked to consignment artists for automatic commission calculation.
          </p>
        </Panel>
        <Panel title="Recent Orders">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Orders from online sales (Stripe) and Square POS imports.
          </p>
        </Panel>
      </div>
    </div>
  );
}
