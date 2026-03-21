/**
 * Bookings page — workshop reservations via the Sigil booking plugin.
 * Google Calendar integration for scheduling.
 */

import Header from '../components/common/Header';
import Panel from '../components/common/Panel';

export default function BookingsPage() {
  return (
    <div>
      <Header
        title="Bookings"
        subtitle="Workshop reservations and appointment scheduling"
      />
      <div className="p-4 md:p-8">
        <Panel>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Booking management powered by the Sigil booking plugin.
            Workshop reservations with Google Calendar integration and email confirmations.
          </p>
        </Panel>
      </div>
    </div>
  );
}
