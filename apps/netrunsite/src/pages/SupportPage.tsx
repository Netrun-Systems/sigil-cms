/**
 * Support panel config — announcements and help settings via the Sigil support plugin.
 */

import { HelpCircle } from 'lucide-react';
import Header from '../components/common/Header';
import Panel from '../components/common/Panel';

export default function SupportPage() {
  return (
    <div>
      <Header
        title="Support Panel"
        subtitle="Configure the interactive help widget on netrunsystems.com"
      />
      <div className="p-4 md:p-8 space-y-6">
        <Panel title="Announcements" noPadding>
          <div className="px-5 py-8 text-center">
            <HelpCircle size={24} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Status announcements and maintenance notices shown in the support panel.
              The support plugin combines help docs, contact form, and Charlotte AI chat
              in one slide-out panel.
            </p>
          </div>
        </Panel>
        <Panel title="Panel Configuration">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Configure which features are active in the support panel:
            help docs, contact form, AI chat, and status announcements.
          </p>
        </Panel>
      </div>
    </div>
  );
}
