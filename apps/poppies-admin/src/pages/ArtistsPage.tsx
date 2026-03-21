/**
 * Artists list page — shows all 45 consignment artists.
 *
 * Combines data from:
 *   - Sigil artist plugin (profiles, bios)
 *   - @poppies/consignment plugin (commission rates, sales totals)
 */

import Header from '../components/common/Header';
import Panel from '../components/common/Panel';

export default function ArtistsPage() {
  return (
    <div>
      <Header
        title="Artists"
        subtitle="Manage consignment artists and their profiles"
        actions={
          <button
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: 'var(--accent)' }}
          >
            Add Artist
          </button>
        }
      />
      <div className="p-4 md:p-8">
        <Panel>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Artist listing will load from the consignment plugin API.
            Each row shows: name, commission rate, active items, lifetime sales, status.
          </p>
        </Panel>
      </div>
    </div>
  );
}
