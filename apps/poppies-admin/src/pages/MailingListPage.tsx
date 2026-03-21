/**
 * Mailing list page — subscriber management via the Sigil mailing-list plugin.
 * GDPR-compliant subscribe/unsubscribe with Mailchimp integration.
 */

import Header from '../components/common/Header';
import Panel from '../components/common/Panel';

export default function MailingListPage() {
  return (
    <div>
      <Header title="Mailing List" subtitle="Newsletter subscribers and campaigns" />
      <div className="p-4 md:p-8">
        <Panel>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Mailing list powered by the Sigil mailing-list plugin.
            GDPR-compliant subscribe/unsubscribe with Mailchimp integration for campaigns.
          </p>
        </Panel>
      </div>
    </div>
  );
}
