import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Search, ChevronRight, FileText, FolderOpen } from 'lucide-react';
import Header from '../components/common/Header';
import Panel from '../components/common/Panel';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { getWikis, getWiki, createWiki, createPage, searchWiki } from '../services/api';

interface PageTreeNode {
  id: string;
  title: string;
  slug: string;
  status: string;
  order: number;
  children: PageTreeNode[];
}

function PageTreeItem({ node, wikiId, depth = 0 }: { node: PageTreeNode; wikiId: string; depth?: number }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);

  return (
    <div>
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors"
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={() => navigate(`/wiki/${wikiId}/pages/${node.id}`)}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        {node.children.length > 0 ? (
          <ChevronRight
            size={14}
            style={{
              color: 'var(--text-muted)',
              transform: expanded ? 'rotate(90deg)' : 'none',
              transition: 'transform 0.15s',
            }}
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          />
        ) : (
          <FileText size={14} style={{ color: 'var(--text-muted)' }} />
        )}
        <span className="text-sm flex-1 truncate" style={{ color: 'var(--text-primary)' }}>
          {node.title}
        </span>
        <Badge variant={node.status === 'published' ? 'success' : 'default'}>
          {node.status}
        </Badge>
      </div>
      {expanded && node.children.map((child) => (
        <PageTreeItem key={child.id} node={child} wikiId={wikiId} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function WikiBrowserPage() {
  const { wikiId } = useParams();
  const navigate = useNavigate();
  const [wikis, setWikis] = useState<any[]>([]);
  const [selectedWiki, setSelectedWiki] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewWiki, setShowNewWiki] = useState(false);
  const [newWikiName, setNewWikiName] = useState('');
  const [showNewPage, setShowNewPage] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');

  useEffect(() => {
    loadWikis();
  }, []);

  useEffect(() => {
    if (wikiId) {
      loadWiki(wikiId);
    }
  }, [wikiId]);

  async function loadWikis() {
    setLoading(true);
    try {
      const res = await getWikis();
      setWikis(res.data);
      if (!wikiId && res.data.length > 0) {
        navigate(`/wiki/${res.data[0].id}`, { replace: true });
      }
    } catch (err) {
      console.error('Failed to load wikis:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadWiki(id: string) {
    try {
      const res = await getWiki(id);
      setSelectedWiki(res.data);
    } catch (err) {
      console.error('Failed to load wiki:', err);
    }
  }

  async function handleCreateWiki() {
    if (!newWikiName.trim()) return;
    try {
      await createWiki({ name: newWikiName });
      setNewWikiName('');
      setShowNewWiki(false);
      loadWikis();
    } catch (err) {
      console.error('Failed to create wiki:', err);
    }
  }

  async function handleCreatePage() {
    if (!newPageTitle.trim() || !wikiId) return;
    try {
      const res = await createPage(wikiId, { title: newPageTitle, status: 'draft' }) as any;
      setNewPageTitle('');
      setShowNewPage(false);
      navigate(`/wiki/${wikiId}/pages/${res.data.id}`);
    } catch (err) {
      console.error('Failed to create page:', err);
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim() || !wikiId) return;
    try {
      const res = await searchWiki(wikiId, searchQuery);
      setSearchResults(res.data);
    } catch (err) {
      console.error('Search failed:', err);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p style={{ color: 'var(--text-secondary)' }}>Loading wikis...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Header
        title="Wiki"
        subtitle={selectedWiki ? selectedWiki.name : 'Knowledge base'}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => setShowNewWiki(true)}>
              New Wiki
            </Button>
            {wikiId && (
              <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowNewPage(true)}>
                New Page
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-12 gap-6">
        {/* Wiki selector sidebar */}
        <div className="col-span-3">
          <Panel title="Wikis" noPadding>
            <div className="py-1">
              {wikis.map((wiki) => (
                <div
                  key={wiki.id}
                  className="flex items-center gap-2 px-4 py-2.5 cursor-pointer transition-colors"
                  style={{
                    background: wiki.id === wikiId ? 'var(--bg-hover)' : 'transparent',
                    borderLeft: wiki.id === wikiId ? '2px solid var(--accent)' : '2px solid transparent',
                  }}
                  onClick={() => navigate(`/wiki/${wiki.id}`)}
                >
                  <BookOpen size={14} style={{ color: 'var(--accent)' }} />
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{wiki.name}</span>
                </div>
              ))}
              {wikis.length === 0 && (
                <p className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  No wikis yet. Create one to get started.
                </p>
              )}
            </div>
          </Panel>
        </div>

        {/* Page tree */}
        <div className="col-span-9">
          {/* Search bar */}
          {wikiId && (
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Search pages..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); if (!e.target.value) setSearchResults(null); }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 rounded-lg px-3 py-2 text-sm"
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-primary)',
                }}
              />
              <Button variant="secondary" size="sm" icon={<Search size={14} />} onClick={handleSearch}>
                Search
              </Button>
            </div>
          )}

          {/* Search results or page tree */}
          {searchResults ? (
            <Panel title={`Search results (${searchResults.length})`}>
              {searchResults.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}
                  onClick={() => navigate(`/wiki/${wikiId}/pages/${page.id}`)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <FileText size={14} style={{ color: 'var(--text-muted)' }} />
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{page.title}</span>
                </div>
              ))}
              {searchResults.length === 0 && (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No results found.</p>
              )}
            </Panel>
          ) : selectedWiki ? (
            <Panel title="Pages" noPadding>
              <div className="py-1">
                {selectedWiki.pages && selectedWiki.pages.length > 0 ? (
                  selectedWiki.pages.map((node: PageTreeNode) => (
                    <PageTreeItem key={node.id} node={node} wikiId={wikiId!} />
                  ))
                ) : (
                  <div className="px-5 py-8 text-center">
                    <FolderOpen size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      No pages yet. Create the first page.
                    </p>
                  </div>
                )}
              </div>
            </Panel>
          ) : (
            <Panel>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Select a wiki from the sidebar or create a new one.
              </p>
            </Panel>
          )}
        </div>
      </div>

      {/* New Wiki Modal */}
      {showNewWiki && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="rounded-xl p-6 w-96" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-primary)' }}>
            <h3 className="font-display text-lg mb-4" style={{ color: 'var(--text-primary)' }}>Create Wiki</h3>
            <input
              type="text"
              placeholder="Wiki name"
              value={newWikiName}
              onChange={(e) => setNewWikiName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateWiki()}
              className="w-full rounded-lg px-3 py-2 text-sm mb-4"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowNewWiki(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreateWiki}>Create</Button>
            </div>
          </div>
        </div>
      )}

      {/* New Page Modal */}
      {showNewPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="rounded-xl p-6 w-96" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-primary)' }}>
            <h3 className="font-display text-lg mb-4" style={{ color: 'var(--text-primary)' }}>Create Page</h3>
            <input
              type="text"
              placeholder="Page title"
              value={newPageTitle}
              onChange={(e) => setNewPageTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreatePage()}
              className="w-full rounded-lg px-3 py-2 text-sm mb-4"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowNewPage(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreatePage}>Create</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
