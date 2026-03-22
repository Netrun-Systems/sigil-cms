import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, History, Link2, Eye, Edit3, Trash2 } from 'lucide-react';
import Header from '../components/common/Header';
import Panel from '../components/common/Panel';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { getPage, updatePage, deletePage, getPageHistory, revertPage } from '../services/api';

export default function WikiEditorPage() {
  const { wikiId, pageId } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('draft');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (wikiId && pageId) loadPage();
  }, [wikiId, pageId]);

  async function loadPage() {
    setLoading(true);
    try {
      const res = await getPage(wikiId!, pageId!);
      setPage(res.data);
      setTitle(res.data.title);
      setContent(res.data.content || '');
      setStatus(res.data.status);
      setDirty(false);
    } catch (err) {
      console.error('Failed to load page:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSave = useCallback(async () => {
    if (!wikiId || !pageId || saving) return;
    setSaving(true);
    try {
      await updatePage(wikiId, pageId, { title, content, status });
      setDirty(false);
      // Reload to get updated backlinks/toc
      await loadPage();
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  }, [wikiId, pageId, title, content, status, saving]);

  // Ctrl+S to save
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleSave]);

  async function loadHistory() {
    try {
      const res = await getPageHistory(wikiId!, pageId!);
      setHistory(res.data);
      setShowHistory(true);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  }

  async function handleRevert(revisionId: string) {
    try {
      await revertPage(wikiId!, pageId!, revisionId);
      setShowHistory(false);
      loadPage();
    } catch (err) {
      console.error('Failed to revert:', err);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this page? This cannot be undone.')) return;
    try {
      await deletePage(wikiId!, pageId!);
      navigate(`/wiki/${wikiId}`);
    } catch (err) {
      console.error('Failed to delete page:', err);
    }
  }

  // Simple markdown to HTML (for preview)
  function renderMarkdown(md: string): string {
    return md
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code style="background:var(--bg-input);padding:2px 4px;border-radius:3px">$1</code>')
      .replace(/\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g, '<a style="color:var(--wiki-link)" href="#">$2$1</a>')
      .replace(/\n/g, '<br />');
  }

  if (loading) {
    return <div className="p-6"><p style={{ color: 'var(--text-secondary)' }}>Loading page...</p></div>;
  }

  if (!page) {
    return <div className="p-6"><p style={{ color: 'var(--text-secondary)' }}>Page not found.</p></div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Header
        title={title || 'Untitled'}
        action={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={() => navigate(`/wiki/${wikiId}`)}>
              Back
            </Button>
            <Button variant="secondary" size="sm" icon={<History size={14} />} onClick={loadHistory}>
              History
            </Button>
            <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={handleDelete}>
              Delete
            </Button>
            <Button
              size="sm"
              icon={<Save size={14} />}
              onClick={handleSave}
              disabled={!dirty || saving}
            >
              {saving ? 'Saving...' : dirty ? 'Save' : 'Saved'}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-12 gap-6">
        {/* Editor */}
        <div className="col-span-9">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
            className="w-full text-2xl font-display font-bold mb-4 px-0 py-2 bg-transparent border-0 outline-none"
            style={{ color: 'var(--text-primary)' }}
            placeholder="Page title"
          />

          {/* Status toggle */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Status:</span>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setDirty(true); }}
              className="text-xs rounded px-2 py-1"
              style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>

            <Button
              variant="ghost"
              size="sm"
              icon={showPreview ? <Edit3 size={14} /> : <Eye size={14} />}
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Edit' : 'Preview'}
            </Button>
          </div>

          {/* Content editor / preview */}
          {showPreview ? (
            <Panel>
              <div
                className="prose prose-invert max-w-none text-sm leading-relaxed"
                style={{ color: 'var(--text-primary)' }}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
              />
            </Panel>
          ) : (
            <textarea
              value={content}
              onChange={(e) => { setContent(e.target.value); setDirty(true); }}
              className="w-full rounded-xl p-5 text-sm font-mono leading-relaxed min-h-[500px] resize-y"
              style={{
                background: 'var(--bg-panel)',
                border: '1px solid var(--border-primary)',
                color: 'var(--text-primary)',
              }}
              placeholder="Write in markdown. Use [[Page Name]] to link to other wiki pages."
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="col-span-3 space-y-4">
          {/* Table of Contents */}
          {page.toc && page.toc.length > 0 && (
            <Panel title="Table of Contents" noPadding>
              <div className="py-2">
                {page.toc.map((entry: any, i: number) => (
                  <div
                    key={i}
                    className="px-4 py-1.5 text-xs truncate"
                    style={{
                      paddingLeft: `${16 + (entry.level - 1) * 12}px`,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {entry.text}
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {/* Backlinks */}
          <Panel title="Backlinks" noPadding>
            <div className="py-2">
              {page.backlinks && page.backlinks.length > 0 ? (
                page.backlinks.map((link: any) => (
                  <div
                    key={link.id}
                    className="flex items-center gap-2 px-4 py-2 cursor-pointer"
                    onClick={() => navigate(`/wiki/${wikiId}/pages/${link.id}`)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Link2 size={12} style={{ color: 'var(--wiki-link)' }} />
                    <span className="text-xs" style={{ color: 'var(--text-primary)' }}>{link.title}</span>
                  </div>
                ))
              ) : (
                <p className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  No pages link here yet.
                </p>
              )}
            </div>
          </Panel>

          {/* Page info */}
          <Panel title="Info">
            <div className="space-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <div>Created: {new Date(page.createdAt).toLocaleDateString()}</div>
              <div>Updated: {new Date(page.updatedAt).toLocaleDateString()}</div>
              <div>Slug: <code style={{ color: 'var(--accent)' }}>{page.slug}</code></div>
            </div>
          </Panel>
        </div>
      </div>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="rounded-xl p-6 w-[500px] max-h-[600px] overflow-y-auto" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-primary)' }}>
            <h3 className="font-display text-lg mb-4" style={{ color: 'var(--text-primary)' }}>Revision History</h3>
            {history.length > 0 ? (
              <div className="space-y-2">
                {history.map((rev) => (
                  <div
                    key={rev.id}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ background: 'var(--bg-input)' }}
                  >
                    <div>
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                        Revision {rev.revisionNumber}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(rev.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => handleRevert(rev.id)}>
                      Revert
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No revisions yet.</p>
            )}
            <div className="flex justify-end mt-4">
              <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
