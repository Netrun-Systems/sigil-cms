import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, BookOpen, HardDrive, Clock, Tag } from 'lucide-react';
import Header from '../components/common/Header';
import Panel from '../components/common/Panel';
import Button from '../components/common/Button';
import MetricCard from '../components/common/MetricCard';
import Badge from '../components/common/Badge';
import { searchDocuments, getRecentDocuments, getWikis, getDrives } from '../services/api';

export default function DocumentHubPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ wiki: any[]; external: any[] } | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [wikis, setWikis] = useState<any[]>([]);
  const [drives, setDrives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [wikisRes, drivesRes, recentRes] = await Promise.allSettled([
        getWikis(),
        getDrives(),
        getRecentDocuments(10),
      ]);
      if (wikisRes.status === 'fulfilled') setWikis(wikisRes.value.data);
      if (drivesRes.status === 'fulfilled') setDrives(drivesRes.value.data);
      if (recentRes.status === 'fulfilled') setRecentActivity(recentRes.value.data);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    try {
      const res = await searchDocuments(searchQuery);
      setSearchResults(res.data);
    } catch (err) {
      console.error('Search failed:', err);
    }
  }

  if (loading) {
    return <div className="p-6"><p style={{ color: 'var(--text-secondary)' }}>Loading...</p></div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Header
        title="Documents"
        subtitle="Unified view of wikis and connected drives"
      />

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Wikis"
          value={wikis.length}
          icon={<BookOpen size={18} style={{ color: 'var(--accent)' }} />}
        />
        <MetricCard
          label="Connected Drives"
          value={drives.length}
          icon={<HardDrive size={18} style={{ color: 'var(--accent)' }} />}
        />
        <MetricCard
          label="Recent Activity"
          value={recentActivity.length}
          icon={<Clock size={18} style={{ color: 'var(--accent)' }} />}
        />
        <MetricCard
          label="Sources"
          value={wikis.length + drives.length}
          icon={<FileText size={18} style={{ color: 'var(--accent)' }} />}
        />
      </div>

      {/* Unified search */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Search across all wikis and connected drives..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); if (!e.target.value) setSearchResults(null); }}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 rounded-lg px-4 py-2.5 text-sm"
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-primary)',
            color: 'var(--text-primary)',
          }}
        />
        <Button icon={<Search size={14} />} onClick={handleSearch}>Search</Button>
      </div>

      {/* Search results */}
      {searchResults && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Panel title={`Wiki Results (${searchResults.wiki.length})`}>
            {searchResults.wiki.length > 0 ? searchResults.wiki.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-2 px-2 py-2 rounded cursor-pointer"
                onClick={() => navigate(`/wiki/${r.wikiId}/pages/${r.id}`)}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <BookOpen size={14} style={{ color: 'var(--accent)' }} />
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{r.title}</span>
                <Badge variant={r.status === 'published' ? 'success' : 'default'}>{r.status}</Badge>
              </div>
            )) : (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No wiki results.</p>
            )}
          </Panel>
          <Panel title={`Drive Results (${searchResults.external.length})`}>
            {searchResults.external.length > 0 ? searchResults.external.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-2 px-2 py-2 rounded"
              >
                <FileText size={14} style={{ color: 'var(--text-muted)' }} />
                <a
                  href={r.webUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm"
                  style={{ color: 'var(--wiki-link)' }}
                >
                  {r.name}
                </a>
              </div>
            )) : (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No drive results.</p>
            )}
          </Panel>
        </div>
      )}

      {/* Quick access */}
      <div className="grid grid-cols-2 gap-6">
        <Panel title="Wikis" action={
          <Button variant="ghost" size="sm" onClick={() => navigate('/wiki')}>View all</Button>
        }>
          {wikis.map((wiki) => (
            <div
              key={wiki.id}
              className="flex items-center gap-3 py-2 cursor-pointer"
              onClick={() => navigate(`/wiki/${wiki.id}`)}
            >
              <BookOpen size={16} style={{ color: 'var(--accent)' }} />
              <div>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{wiki.name}</p>
                {wiki.description && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{wiki.description}</p>
                )}
              </div>
            </div>
          ))}
          {wikis.length === 0 && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No wikis created yet.</p>
          )}
        </Panel>

        <Panel title="Connected Drives" action={
          <Button variant="ghost" size="sm" onClick={() => navigate('/documents/drives')}>Manage</Button>
        }>
          {drives.map((drive) => (
            <div
              key={drive.id}
              className="flex items-center gap-3 py-2 cursor-pointer"
              onClick={() => navigate(`/documents/drives/${drive.id}`)}
            >
              <HardDrive size={16} style={{ color: drive.provider === 'microsoft' ? '#0078d4' : '#4285f4' }} />
              <div>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  {drive.driveName || drive.provider}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{drive.accountEmail}</p>
              </div>
              <Badge variant="info">{drive.provider}</Badge>
            </div>
          ))}
          {drives.length === 0 && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              No drives connected. Connect Microsoft 365 or Google Workspace.
            </p>
          )}
        </Panel>
      </div>
    </div>
  );
}
