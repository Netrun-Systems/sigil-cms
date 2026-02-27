import { useState, useRef } from 'react';
import { Upload, FileText, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@netrun-cms/ui';
import {
  uploadDocument,
  deleteDocument,
  type DocumentInfo,
} from '../../lib/advisor';

interface Props {
  documents: DocumentInfo[];
  sessionId: string;
  onDocumentsChange: (docs: DocumentInfo[]) => void;
}

const ACCEPT = '.pdf,.doc,.docx,.txt,.md,.rtf,.csv,.json,.html,.xml,.pptx,.xlsx';

export function DocumentManager({ documents, sessionId, onDocumentsChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    setUploading(true);

    try {
      const results: DocumentInfo[] = [];
      for (const file of Array.from(files)) {
        const doc = await uploadDocument(file, sessionId);
        results.push(doc);
      }
      onDocumentsChange([...documents, ...results]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      await deleteDocument(fileId, sessionId);
      onDocumentsChange(documents.filter((d) => d.name !== fileId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleUpload(e.dataTransfer.files);
  };

  return (
    <div className="border-b border-border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Documents {documents.length > 0 && `(${documents.length})`}
        </span>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-2">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border p-3',
              'text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors'
            )}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? 'Uploading...' : 'Drop files or click to upload'}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            multiple
            onChange={(e) => handleUpload(e.target.files)}
            className="hidden"
          />

          {error && <p className="text-xs text-red-400">{error}</p>}

          {documents.map((doc) => (
            <div
              key={doc.name}
              className="flex items-center justify-between rounded-lg bg-muted px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">
                  {doc.displayName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {doc.mimeType.split('/').pop()}
                  {doc.sizeBytes && ` · ${formatBytes(parseInt(doc.sizeBytes))}`}
                </p>
              </div>
              <button
                onClick={() => handleDelete(doc.name)}
                className="ml-2 shrink-0 rounded p-1 text-muted-foreground hover:bg-red-500/20 hover:text-red-400 transition-colors"
                title="Remove document"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
