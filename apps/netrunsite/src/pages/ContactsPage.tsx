/**
 * Contact submissions — powered by the Sigil contact plugin.
 */

import { Inbox } from 'lucide-react';
import Header from '../components/common/Header';
import Panel from '../components/common/Panel';

export default function ContactsPage() {
  return (
    <div>
      <Header
        title="Contact Submissions"
        subtitle="Inquiries from the netrunsystems.com contact form"
      />
      <div className="p-4 md:p-8 space-y-6">
        <Panel title="Recent Submissions" noPadding>
          <div className="px-5 py-8 text-center">
            <Inbox size={24} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Contact form submissions from the corporate website.
              The contact plugin handles form validation, spam detection,
              and optional email notifications.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
