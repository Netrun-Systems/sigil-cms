/**
 * Contacts page — form submissions via the Sigil contact plugin.
 */

import Header from '../components/common/Header';
import Panel from '../components/common/Panel';

export default function ContactsPage() {
  return (
    <div>
      <Header title="Contact Submissions" subtitle="Messages from the contact form" />
      <div className="p-4 md:p-8">
        <Panel>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Contact form submissions powered by the Sigil contact plugin.
            View, respond to, and manage inquiries from website visitors.
          </p>
        </Panel>
      </div>
    </div>
  );
}
