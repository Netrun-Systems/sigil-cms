/**
 * Poppies Dashboard — overview combining data from multiple plugins.
 *
 * Shows: active artists count, monthly sales, pending settlements,
 * upcoming events, recent gallery uploads, and Square sync status.
 */

import { useState, useEffect } from 'react';
import { Users, DollarSign, CalendarDays, Image } from 'lucide-react';
import Header from '../components/common/Header';
import MetricCard from '../components/common/MetricCard';
import Panel from '../components/common/Panel';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Dashboard data will load from multiple plugin APIs
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div>
        <Header title="Dashboard" subtitle="Poppies Art & Gifts — store overview" />
        <div className="p-8 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
          <p className="text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Dashboard" subtitle="Poppies Art & Gifts — store overview" />
      <div className="p-4 md:p-8 space-y-6">
        {/* Key metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Active Artists" value={45} />
          <MetricCard label="Monthly Sales" value={0} format="currency" trend="flat" />
          <MetricCard label="Items on Consignment" value={0} />
          <MetricCard label="Pending Settlements" value={0} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent sales */}
          <Panel title="Recent Sales" noPadding>
            <div className="px-5 py-8 text-center">
              <DollarSign size={24} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                No sales recorded yet. Connect Square POS to import transactions.
              </p>
            </div>
          </Panel>

          {/* Upcoming events */}
          <Panel title="Upcoming Events" noPadding>
            <div className="px-5 py-8 text-center">
              <CalendarDays size={24} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                No upcoming events. Create art shows and workshops in the Events section.
              </p>
            </div>
          </Panel>

          {/* Artist spotlight */}
          <Panel title="Artist Spotlight" noPadding>
            <div className="px-5 py-8 text-center">
              <Users size={24} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Add consignment artists to see them here.
              </p>
            </div>
          </Panel>

          {/* Recent gallery */}
          <Panel title="Latest Gallery Uploads" noPadding>
            <div className="px-5 py-8 text-center">
              <Image size={24} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Upload photos of artist work to the gallery.
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
