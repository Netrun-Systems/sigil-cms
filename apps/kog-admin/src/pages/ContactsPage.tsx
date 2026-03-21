import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Mail, Phone } from 'lucide-react';
import Header from '../components/common/Header';
import Badge from '../components/common/Badge';
import { getContacts } from '../services/api';

const statusVariant: Record<string, string> = {
  customer: 'success', prospect: 'info', lead: 'sage',
  active: 'success', inactive: 'default',
};

interface Contact {
  id: string; first_name: string; last_name: string;
  email: string; phone?: string; company?: string;
  title?: string; lead_score: number; status: string;
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--warning)' : 'var(--error)';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full" style={{ background: 'var(--bg-input)' }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(score, 100)}%`, background: color }} />
      </div>
      <span className="text-xs" style={{ color }}>{score}</span>
    </div>
  );
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: '50' };
      if (search) params.search = search;
      const data: any = await getContacts(params);
      const items = data?.items ?? data ?? [];
      setContacts(Array.isArray(items) ? items.map((c: any) => ({
        id: c.id, first_name: c.first_name || '', last_name: c.last_name || '',
        email: c.email || '', phone: c.phone, company: c.organization_name || c.company || '',
        title: c.title || '',
        lead_score: c.lead_score ?? (c.relationship_strength ? Math.round(c.relationship_strength * 100) : 0),
        status: c.status || 'active',
      })) : []);
      setTotal(data?.total ?? items.length ?? 0);
    } catch (err) { console.error('Failed to load contacts:', err); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <Header title="Contacts" subtitle={`${total} contacts`} />
      <div className="p-4 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
          <div className="relative w-full md:w-auto">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input type="search" placeholder="Search contacts..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 min-h-[48px] rounded-lg text-sm w-full md:w-[320px] outline-none"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} />
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 min-h-[48px] rounded-lg text-sm cursor-pointer"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
              <Filter size={16} /> Filter
            </button>
            <button className="flex items-center gap-2 px-4 min-h-[48px] rounded-lg text-sm font-body cursor-pointer"
              style={{ background: 'var(--netrun-green)', border: 'none', color: 'var(--netrun-black)' }}>
              <Plus size={16} /> Add Contact
            </button>
          </div>
        </div>

        {loading && <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>Loading contacts...</p>}
        {!loading && contacts.length === 0 && (
          <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No contacts found.</p>
        )}

        <div className="hidden md:grid grid-cols-1 gap-3">
          {contacts.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-6 py-4 rounded-xl cursor-pointer transition-all duration-200"
              style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-primary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(144,185,171,0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-primary)'; }}>
              <div className="flex items-center gap-4 w-[280px]">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-display text-sm"
                  style={{ background: 'var(--bg-hover)', color: 'var(--netrun-green)' }}>
                  {(c.first_name?.[0] || '?')}{(c.last_name?.[0] || '')}
                </div>
                <div>
                  <p className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>{c.first_name} {c.last_name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.title}</p>
                </div>
              </div>
              <div className="w-[160px]"><p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{c.company}</p></div>
              <div className="w-[120px]"><ScoreBar score={c.lead_score || 0} /></div>
              <div className="w-[100px]"><Badge label={c.status} variant={statusVariant[c.status] as any} /></div>
              <div className="flex items-center gap-2">
                <button className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-lg cursor-pointer"
                  style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none' }} title="Email">
                  <Mail size={16} />
                </button>
                <button className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-lg cursor-pointer"
                  style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none' }} title="Call">
                  <Phone size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile cards */}
        <div className="md:hidden grid grid-cols-1 gap-3">
          {contacts.map((c) => (
            <div key={c.id} className="rounded-xl p-4 cursor-pointer"
              style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-primary)' }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-display text-sm flex-shrink-0"
                  style={{ background: 'var(--bg-hover)', color: 'var(--netrun-green)' }}>
                  {(c.first_name?.[0] || '?')}{(c.last_name?.[0] || '')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body truncate" style={{ color: 'var(--text-primary)' }}>{c.first_name} {c.last_name}</p>
                  {c.company && <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{c.company}</p>}
                </div>
                <Badge label={c.status} variant={statusVariant[c.status] as any} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
