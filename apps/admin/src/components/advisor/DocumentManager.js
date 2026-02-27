import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef } from 'react';
import { Upload, FileText, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@netrun-cms/ui';
import { uploadDocument, deleteDocument, } from '../../lib/advisor';
const ACCEPT = '.pdf,.doc,.docx,.txt,.md,.rtf,.csv,.json,.html,.xml,.pptx,.xlsx';
export function DocumentManager({ documents, sessionId, onDocumentsChange }) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [expanded, setExpanded] = useState(true);
    const fileInputRef = useRef(null);
    const handleUpload = async (files) => {
        if (!files?.length)
            return;
        setError(null);
        setUploading(true);
        try {
            const results = [];
            for (const file of Array.from(files)) {
                const doc = await uploadDocument(file, sessionId);
                results.push(doc);
            }
            onDocumentsChange([...documents, ...results]);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        }
        finally {
            setUploading(false);
            if (fileInputRef.current)
                fileInputRef.current.value = '';
        }
    };
    const handleDelete = async (fileId) => {
        try {
            await deleteDocument(fileId, sessionId);
            onDocumentsChange(documents.filter((d) => d.name !== fileId));
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Delete failed');
        }
    };
    const handleDrop = (e) => {
        e.preventDefault();
        handleUpload(e.dataTransfer.files);
    };
    return (_jsxs("div", { className: "border-b border-border", children: [_jsxs("button", { onClick: () => setExpanded(!expanded), className: "flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors", children: [_jsxs("span", { className: "flex items-center gap-2", children: [_jsx(FileText, { className: "h-4 w-4" }), "Documents ", documents.length > 0 && `(${documents.length})`] }), expanded ? _jsx(ChevronUp, { className: "h-4 w-4" }) : _jsx(ChevronDown, { className: "h-4 w-4" })] }), expanded && (_jsxs("div", { className: "px-4 pb-3 space-y-2", children: [_jsxs("div", { onDragOver: (e) => e.preventDefault(), onDrop: handleDrop, onClick: () => fileInputRef.current?.click(), className: cn('flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border p-3', 'text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors'), children: [uploading ? (_jsx(Loader2, { className: "h-4 w-4 animate-spin" })) : (_jsx(Upload, { className: "h-4 w-4" })), uploading ? 'Uploading...' : 'Drop files or click to upload'] }), _jsx("input", { ref: fileInputRef, type: "file", accept: ACCEPT, multiple: true, onChange: (e) => handleUpload(e.target.files), className: "hidden" }), error && _jsx("p", { className: "text-xs text-red-400", children: error }), documents.map((doc) => (_jsxs("div", { className: "flex items-center justify-between rounded-lg bg-muted px-3 py-2", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "truncate text-xs font-medium text-foreground", children: doc.displayName }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [doc.mimeType.split('/').pop(), doc.sizeBytes && ` · ${formatBytes(parseInt(doc.sizeBytes))}`] })] }), _jsx("button", { onClick: () => handleDelete(doc.name), className: "ml-2 shrink-0 rounded p-1 text-muted-foreground hover:bg-red-500/20 hover:text-red-400 transition-colors", title: "Remove document", children: _jsx(Trash2, { className: "h-3.5 w-3.5" }) })] }, doc.name)))] }))] }));
}
function formatBytes(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
//# sourceMappingURL=DocumentManager.js.map