import { useState, useEffect } from 'react';
import { Building2, Users, TrendingUp } from 'lucide-react';
import Header from '../components/common/Header';
import Badge from '../components/common/Badge';
import { getOrganizations } from '../services/api';

interface Org {
  id: string; name: string; domain?: string; industry?: string;
  contacts_count: number; deals_count: number; size?: string;
}

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data: any = await getOrganizations({ limit: '50' });
        const items = data?.items ?? data ?? [];
        setOrgs(Array.isArray(items) ? items.map((o: any) => ({
          id: o.id, name: o.name || 'Unnamed', domain: o.domain || '',
          industry: o.industry || 'Other',
          contacts_count: o.contacts_count ?? o.contacts?.length ?? 0,
          deals_count: o.deals_count ?? o.opportunities?.length ?? 0,
          size: o.size || '',
        })) : []);
        setTotal(data?.total ?? items.length ?? 0);
      } catch (err) { console.error('Failed to load organizations:', err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  return (
    <div>
      <Header title="Organizations" subtitle={`${total} organizations`} />
      <div className="p-4 md:p-8">
        {loading && <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>Loading organizations...</p>}
        {!loading && orgs.length === 0 && (
          <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No organizations yet.</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orgs.map((org) => (
            <div key={org.id} className="rounded-xl p-5 cursor-pointer transition-all duration-200"
              style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-primary)' }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(144,185,171,0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-primary)'}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-hover)' }}>
                    <Building2 size={18} style={{ color: 'var(--netrun-green)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>{org.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{org.domain}</p>
                  </div>
                </div>
                <Badge label={org.industry || 'Other'} variant="sage" />
              </div>
              <div className="flex items-center gap-6 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span className="flex items-center gap-1"><Users size={12} /> {org.contacts_count} contacts</span>
                <span className="flex items-center gap-1"><TrendingUp size={12} /> {org.deals_count} deals</span>
                {org.size && <span>{org.size}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
