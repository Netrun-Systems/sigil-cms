import { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import { getDeals } from '../services/api';

type DealStage = 'discovery' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';

interface Deal {
  id: string; title: string; value: number; stage: DealStage;
  probability: number; contact_name: string; organization_name: string;
}

const stages: { key: DealStage; label: string; color: string }[] = [
  { key: 'discovery', label: 'Discovery', color: 'var(--info)' },
  { key: 'qualification', label: 'Qualification', color: 'var(--text-secondary)' },
  { key: 'proposal', label: 'Proposal', color: 'var(--warning)' },
  { key: 'negotiation', label: 'Negotiation', color: 'var(--netrun-green)' },
  { key: 'closed_won', label: 'Closed Won', color: 'var(--success)' },
];

const stageMap: Record<string, DealStage> = {
  lead: 'discovery', qualified: 'qualification', discovery: 'discovery',
  qualification: 'qualification', proposal: 'proposal', negotiation: 'negotiation',
  closed_won: 'closed_won', closed_lost: 'closed_lost',
};

function DealCard({ deal }: { deal: Deal }) {
  return (
    <div className="rounded-lg p-4 cursor-pointer transition-all duration-200"
      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)' }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(144,185,171,0.3)'}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-primary)'}>
      <p className="text-sm font-body mb-1" style={{ color: 'var(--text-primary)' }}>{deal.title}</p>
      <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
        {deal.contact_name}{deal.organization_name ? ` -- ${deal.organization_name}` : ''}
      </p>
      <div className="flex items-center justify-between">
        <span className="font-display text-sm" style={{ color: 'var(--netrun-green)' }}>
          ${deal.value.toLocaleString()}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{deal.probability}%</span>
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data: any = await getDeals({ limit: '100' });
        const items = data?.items ?? data ?? [];
        setDeals(Array.isArray(items) ? items.map((d: any) => ({
          id: d.id, title: d.name || d.title || 'Untitled', value: d.value || 0,
          stage: stageMap[d.stage] || d.stage || 'discovery',
          probability: d.probability ? Math.round(d.probability * 100) : 0,
          contact_name: d.contact_name || d.primary_contact_name || '',
          organization_name: d.organization_name || '',
        })) : []);
      } catch (err) { console.error('Failed to load deals:', err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);

  if (loading) {
    return (
      <div>
        <Header title="Pipeline" subtitle="Loading deals..." />
        <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>
          <p className="text-sm">Loading pipeline data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Pipeline" subtitle={`${deals.length} deals -- $${totalValue.toLocaleString()} total value`} />
      <div className="p-4 md:p-8">
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory md:snap-none pb-4">
          {stages.map((stage) => {
            const stageDeals = deals.filter(d => d.stage === stage.key);
            const stageValue = stageDeals.reduce((sum, d) => sum + d.value, 0);
            return (
              <div key={stage.key} className="flex-shrink-0 w-[280px] snap-center">
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
                    <span className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>{stage.label}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full"
                      style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>{stageDeals.length}</span>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>${stageValue.toLocaleString()}</span>
                </div>
                <div className="space-y-3 min-h-[200px] rounded-xl p-3"
                  style={{ background: 'rgba(17,17,17,0.5)', border: '1px solid var(--border-primary)' }}>
                  {stageDeals.map((deal) => <DealCard key={deal.id} deal={deal} />)}
                  {stageDeals.length === 0 && (
                    <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>No deals</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
