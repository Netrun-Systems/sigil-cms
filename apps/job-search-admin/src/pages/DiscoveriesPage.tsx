import { useState, useEffect } from 'react';
import { Search, Plus, ExternalLink } from 'lucide-react';
import Header from '../components/common/Header';
import Panel from '../components/common/Panel';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { getDiscoveries, addDiscoveryToTracker, runEvening } from '../services/api';

const priorityVariant: Record<string, 'error' | 'warning' | 'success'> = {
  HIGH: 'error', MEDIUM: 'warning', LOW: 'success',
};

export default function DiscoveriesPage() {
  const [discoveries, setDiscoveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    loadDiscoveries();
  }, []);

  async function loadDiscoveries() {
    setLoading(true);
    try {
      const res = await getDiscoveries();
      setDiscoveries(res.data || []);
    } catch (err) { console.error('Failed to load discoveries:', err); }
    finally { setLoading(false); }
  }

  async function handleDiscover() {
    setDiscoverLoading(true);
    try {
      await runEvening();
      await loadDiscoveries();
    } catch (err) { console.error('Discovery run failed:', err); }
    finally { setDiscoverLoading(false); }
  }

  async function handleAddToTracker(discoveryId: string) {
    setAddingId(discoveryId);
    try {
      await addDiscoveryToTracker(discoveryId);
      await loadDiscoveries();
    } catch (err) { console.error('Failed to add to tracker:', err); }
    finally { setAddingId(null); }
  }

  if (loading) {
    return (
      <div>
        <Header title="Discoveries" subtitle="Loading..." />
        <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Discoveries"
        subtitle={`${discoveries.length} jobs discovered`}
        action={
          <Button size="sm" loading={discoverLoading} onClick={handleDiscover}>
            <Search size={14} /> Run Discovery
          </Button>
        }
      />

      <div className="p-4 md:p-8">
        <Panel noPadding>
          {discoveries.length === 0 ? (
            <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>
              <Search size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">No discoveries yet. Run an evening discovery to find matching jobs.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  {['Company', 'Role', 'Compensation', 'Location', 'Priority', 'Date', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {discoveries.map((d: any) => (
                  <tr key={d.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>{d.company}</td>
                    <td className="px-4 py-3">
                      <span style={{ color: 'var(--text-primary)' }}>{d.role}</span>
                      {d.url && (
                        <a href={d.url} target="_blank" rel="noopener noreferrer" className="ml-2"
                          style={{ color: 'var(--accent)' }}><ExternalLink size={12} className="inline" /></a>
                      )}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{d.compensation || '-'}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{d.location || '-'}</td>
                    <td className="px-4 py-3">
                      <Badge label={d.priority} variant={priorityVariant[d.priority] || 'default'} />
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{d.runDate}</td>
                    <td className="px-4 py-3">
                      {d.addedToTracker ? (
                        <Badge label="Added" variant="success" />
                      ) : (
                        <Button size="sm" variant="secondary"
                          loading={addingId === d.id}
                          onClick={() => handleAddToTracker(d.id)}>
                          <Plus size={12} /> Add
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>
    </div>
  );
}
