import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, FileText, ExternalLink } from 'lucide-react';
import Header from '../components/common/Header';
import Panel from '../components/common/Panel';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { searchDocuments } from '../services/api';

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ wiki: any[]; external: any[] } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await searchDocuments(query);
      setResults(res.data);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  }

  const totalResults = results ? results.wiki.length + results.external.length : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Header title="Search Documents" subtitle="Search across all wikis and connected drives" />

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Search wiki pages, OneDrive, Google Drive..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 rounded-lg px-4 py-3 text-sm"
          style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
          autoFocus
        />
        <Button icon={<Search size={14} />} onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </div>

      {results && (
        <>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            {totalResults} result{totalResults !== 1 ? 's' : ''} for "{query}"
          </p>

          {results.wiki.length > 0 && (
            <Panel title={`Wiki Pages (${results.wiki.length})`} className="mb-4">
              {results.wiki.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center gap-3 py-2 cursor-pointer rounded px-2"
                  onClick={() => navigate(`/wiki/${page.wikiId}/pages/${page.id}`)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <BookOpen size={14} style={{ color: 'var(--accent)' }} />
                  <span className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>{page.title}</span>
                  <Badge variant={page.status === 'published' ? 'success' : 'default'}>{page.status}</Badge>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {new Date(page.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </Panel>
          )}

          {results.external.length > 0 && (
            <Panel title={`Drive Files (${results.external.length})`}>
              {results.external.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 py-2 px-2"
                >
                  <FileText size={14} style={{ color: 'var(--text-muted)' }} />
                  <span className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>{doc.name}</span>
                  {doc.webUrl && (
                    <a
                      href={doc.webUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs flex items-center gap-1"
                      style={{ color: 'var(--wiki-link)' }}
                    >
                      Open <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              ))}
            </Panel>
          )}

          {totalResults === 0 && (
            <Panel>
              <div className="text-center py-8">
                <Search size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No results found for "{query}".</p>
              </div>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}
