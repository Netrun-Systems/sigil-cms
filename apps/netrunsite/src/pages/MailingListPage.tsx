/**
 * Mailing list — newsletter subscribers via the Sigil mailing-list plugin.
 */

import { Mail } from 'lucide-react';
import Header from '../components/common/Header';
import Panel from '../components/common/Panel';

export default function MailingListPage() {
  return (
    <div>
      <Header
        title="Mailing List"
        subtitle="Newsletter subscribers and broadcasts"
      />
      <div className="p-4 md:p-8 space-y-6">
        <Panel title="Subscribers" noPadding>
          <div className="px-5 py-8 text-center">
            <Mail size={24} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Newsletter subscribers from the corporate website. CAN-SPAM and GDPR compliant
              with one-click unsubscribe. Broadcasts sent via Azure Communication Services.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
