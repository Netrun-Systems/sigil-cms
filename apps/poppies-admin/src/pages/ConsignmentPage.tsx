/**
 * Consignment management page — from the @poppies/consignment plugin.
 *
 * Tabbed view: Artists | Inventory | Sales | Commission Rates | Square Sync
 */

import { useState } from 'react';
import Header from '../components/common/Header';
import Panel from '../components/common/Panel';
import MetricCard from '../components/common/MetricCard';

type Tab = 'artists' | 'inventory' | 'sales' | 'rates' | 'square';

export default function ConsignmentPage() {
  const [activeTab, setActiveTab] = useState<Tab>('artists');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'artists', label: 'Artists' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'sales', label: 'Sales' },
    { key: 'rates', label: 'Commission Rates' },
    { key: 'square', label: 'Square Sync' },
  ];

  return (
    <div>
      <Header title="Consignment" subtitle="Track consignment items, sales, and commission splits" />
      <div className="p-4 md:p-8 space-y-6">
        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Active Artists" value={45} />
          <MetricCard label="Items Consigned" value={0} />
          <MetricCard label="This Month Sales" value={0} format="currency" />
          <MetricCard label="Pending Payouts" value={0} format="currency" />
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 rounded-lg p-1" style={{ background: 'var(--bg-input)' }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
              style={{
                background: activeTab === tab.key ? 'var(--bg-panel)' : 'transparent',
                color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: activeTab === tab.key ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <Panel>
          {activeTab === 'artists' && (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Manage the 45 consignment artists. Set commission rates per artist, track their inventory and sales.
            </p>
          )}
          {activeTab === 'inventory' && (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              All items currently on consignment. Filter by artist, category, or status.
            </p>
          )}
          {activeTab === 'sales' && (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Sales records from Square POS and manual entries. Shows sale amount, artist share, and store share.
            </p>
          )}
          {activeTab === 'rates' && (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Configure commission rates per artist or globally. Default: 60% artist / 40% store.
            </p>
          )}
          {activeTab === 'square' && (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Square POS integration. Sync catalog items and import payment transactions.
            </p>
          )}
        </Panel>
      </div>
    </div>
  );
}
