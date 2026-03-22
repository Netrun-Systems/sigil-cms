import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Folder, FileText, Search, ExternalLink, Eye, ChevronRight } from 'lucide-react';
import Header from '../components/common/Header';
import Panel from '../components/common/Panel';
import Button from '../components/common/Button';
import { getDriveFiles, getDriveFile, searchDriveFiles } from '../services/api';

function formatSize(bytes: number): string {
  if (bytes === 0) return '-';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getMimeIcon(mimeType: string | null): string {
  if (!mimeType) return 'file';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'doc';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'sheet';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'slides';
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('image')) return 'image';
  return 'file';
}

export default function DriveBrowserPage() {
  const { driveId } = useParams();
  const navigate = useNavigate();
  const [files, setFiles] = useState<any[]>([]);
  const [folderStack, setFolderStack] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (driveId) loadFiles();
  }, [driveId]);

  async function loadFiles(folderId?: string) {
    setLoading(true);
    setSearchResults(null);
    try {
      const res = await getDriveFiles(driveId!, folderId);
      setFiles(res.data);
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setLoading(false);
    }
  }

  function navigateToFolder(folderId: string, folderName: string) {
    setFolderStack((prev) => [...prev, { id: folderId, name: folderName }]);
    loadFiles(folderId);
  }

  function navigateBack() {
    const newStack = [...folderStack];
    newStack.pop();
    setFolderStack(newStack);
    const parentId = newStack.length > 0 ? newStack[newStack.length - 1].id : undefined;
    loadFiles(parentId);
  }

  function navigateToBreadcrumb(index: number) {
    const newStack = folderStack.slice(0, index + 1);
    setFolderStack(newStack);
    loadFiles(newStack[newStack.length - 1]?.id);
  }

  async function handleSearch() {
    if (!searchQuery.trim() || !driveId) return;
    try {
      const res = await searchDriveFiles(driveId, searchQuery);
      setSearchResults(res.data);
    } catch (err) {
      console.error('Search failed:', err);
    }
  }

  async function handleFileClick(file: any) {
    if (file.isFolder) {
      navigateToFolder(file.id, file.name);
      return;
    }
    setPreviewLoading(true);
    try {
      const res = await getDriveFile(driveId!, file.id);
      setSelectedFile(res.data);
    } catch (err) {
      console.error('Failed to get file details:', err);
    } finally {
      setPreviewLoading(false);
    }
  }

  const displayFiles = searchResults || files;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Header
        title="Drive Browser"
        action={
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={() => navigate('/documents/drives')}>
            Back to Drives
          </Button>
        }
      />

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 mb-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
        <span
          className="cursor-pointer hover:underline"
          onClick={() => { setFolderStack([]); loadFiles(); }}
        >
          Root
        </span>
        {folderStack.map((folder, i) => (
          <span key={folder.id} className="flex items-center gap-1">
            <ChevronRight size={12} />
            <span
              className="cursor-pointer hover:underline"
              onClick={() => navigateToBreadcrumb(i)}
            >
              {folder.name}
            </span>
          </span>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); if (!e.target.value) setSearchResults(null); }}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 rounded-lg px-3 py-2 text-sm"
          style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
        />
        <Button variant="secondary" size="sm" icon={<Search size={14} />} onClick={handleSearch}>Search</Button>
        {folderStack.length > 0 && (
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={navigateBack}>Up</Button>
        )}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* File list */}
        <div className={selectedFile ? 'col-span-7' : 'col-span-12'}>
          <Panel noPadding>
            {loading ? (
              <div className="p-5"><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</p></div>
            ) : displayFiles.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Name</th>
                    <th className="text-right px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Size</th>
                    <th className="text-right px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Modified</th>
                  </tr>
                </thead>
                <tbody>
                  {displayFiles.map((file) => (
                    <tr
                      key={file.id}
                      className="cursor-pointer"
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}
                      onClick={() => handleFileClick(file)}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td className="px-4 py-2.5 flex items-center gap-2">
                        {file.isFolder ? (
                          <Folder size={16} style={{ color: 'var(--accent)' }} />
                        ) : (
                          <FileText size={16} style={{ color: 'var(--text-muted)' }} />
                        )}
                        <span style={{ color: 'var(--text-primary)' }}>{file.name}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right" style={{ color: 'var(--text-muted)' }}>
                        {file.isFolder ? '-' : formatSize(file.size)}
                      </td>
                      <td className="px-4 py-2.5 text-right" style={{ color: 'var(--text-muted)' }}>
                        {file.lastModified ? new Date(file.lastModified).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center">
                <Folder size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>This folder is empty.</p>
              </div>
            )}
          </Panel>
        </div>

        {/* Preview panel */}
        {selectedFile && (
          <div className="col-span-5">
            <Panel title={selectedFile.name}>
              <div className="space-y-3">
                <div className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
                  <p>Type: {selectedFile.mimeType || 'Unknown'}</p>
                  <p>Size: {formatSize(selectedFile.size)}</p>
                  {selectedFile.lastModified && (
                    <p>Modified: {new Date(selectedFile.lastModified).toLocaleString()}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  {selectedFile.editUrl && (
                    <Button
                      size="sm"
                      icon={<ExternalLink size={14} />}
                      onClick={() => window.open(selectedFile.editUrl, '_blank')}
                    >
                      Open in Editor
                    </Button>
                  )}
                  {selectedFile.previewUrl && (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Eye size={14} />}
                      onClick={() => window.open(selectedFile.previewUrl, '_blank')}
                    >
                      Preview
                    </Button>
                  )}
                </div>

                {/* Inline preview */}
                {selectedFile.previewUrl && (
                  <div
                    className="rounded-lg overflow-hidden mt-3"
                    style={{ border: '1px solid var(--border-primary)' }}
                  >
                    <iframe
                      src={selectedFile.previewUrl}
                      className="w-full"
                      style={{ height: '400px', border: 'none', background: '#fff' }}
                      title={`Preview: ${selectedFile.name}`}
                    />
                  </div>
                )}

                <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
                  Close Preview
                </Button>
              </div>
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
}
