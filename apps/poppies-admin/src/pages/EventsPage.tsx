/**
 * Events page — art shows, workshops, and openings.
 * Uses the Sigil artist plugin's events feature.
 */

import Header from '../components/common/Header';
import Panel from '../components/common/Panel';

export default function EventsPage() {
  return (
    <div>
      <Header
        title="Events"
        subtitle="Art shows, workshops, and gallery openings"
        actions={
          <button
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: 'var(--accent)' }}
          >
            Create Event
          </button>
        }
      />
      <div className="p-4 md:p-8">
        <Panel>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Event management powered by the Sigil artist plugin.
            Create art shows, workshops, and gallery openings with registration and capacity tracking.
          </p>
        </Panel>
      </div>
    </div>
  );
}
