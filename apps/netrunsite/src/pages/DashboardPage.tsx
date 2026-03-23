/**
 * NetrunSite Dashboard — overview of the corporate website.
 *
 * Shows: blog post count, contact submissions, KAMERA scan jobs,
 * newsletter subscribers, and recent activity across plugins.
 */

import { useState, useEffect } from 'react';
import { FileText, Inbox, ScanLine, Mail, ShoppingBag, HelpCircle } from 'lucide-react';
import Header from '../components/common/Header';
import MetricCard from '../components/common/MetricCard';
import Panel from '../components/common/Panel';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div>
        <Header title="Dashboard" subtitle="Netrun Systems — corporate website management" />
        <div className="p-8 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
          <p className="text-sm font-mono">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Dashboard" subtitle="Netrun Systems — corporate website management" />
      <div className="p-4 md:p-8 space-y-6">
        {/* Key metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Blog Posts" value={12} />
          <MetricCard label="Contact Submissions" value={0} />
          <MetricCard label="KAMERA Jobs" value={0} />
          <MetricCard label="Newsletter Subscribers" value={0} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent blog posts */}
          <Panel title="Recent Blog Posts" noPadding>
            <div className="px-5 py-8 text-center">
              <FileText size={24} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                12 articles imported from NetrunSite. Manage posts, categories, and tags
                through the Blog section.
              </p>
            </div>
          </Panel>

          {/* Contact submissions */}
          <Panel title="Recent Contact Submissions" noPadding>
            <div className="px-5 py-8 text-center">
              <Inbox size={24} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Contact form submissions from netrunsystems.com will appear here.
              </p>
            </div>
          </Panel>

          {/* KAMERA pipeline */}
          <Panel title="KAMERA Scan Pipeline" noPadding>
            <div className="px-5 py-8 text-center">
              <ScanLine size={24} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                3D scan job submissions and processing status.
                Connected to the Survai processing pipeline.
              </p>
            </div>
          </Panel>

          {/* Newsletter & store */}
          <Panel title="Products & Subscribers" noPadding>
            <div className="px-5 py-8 text-center">
              <ShoppingBag size={24} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                KAMERA scan pricing and Stripe checkout managed through the Store section.
                Newsletter subscribers managed through Mailing List.
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
