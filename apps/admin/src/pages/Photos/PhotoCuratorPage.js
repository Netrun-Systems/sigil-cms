import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Photo Curator Page — AI-powered photo management.
 *
 * Backported from frost. Handles bulk upload to Azure Blob Storage,
 * Gemini vision AI curation (score, select, tag), and manual selection.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Upload, Sparkles, Trash2, CheckCircle2, XCircle, Loader2, ImageIcon, Check, X, Star, } from 'lucide-react';
import { uploadPhotos, curatePhotos, listPhotos, updatePhotoSelection, deletePhoto, } from '../../lib/photos';
export function PhotoCuratorPage() {
    const { siteId = '' } = useParams();
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [curating, setCurating] = useState(false);
    const [error, setError] = useState(null);
    const [curationSummary, setCurationSummary] = useState(null);
    const [viewMode, setViewMode] = useState('all');
    const fileInputRef = useRef(null);
    // Load photos on mount
    useEffect(() => {
        if (!siteId)
            return;
        listPhotos(siteId)
            .then(setPhotos)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [siteId]);
    // Upload handler
    const handleUpload = useCallback(async (files) => {
        if (!siteId)
            return;
        const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
        if (imageFiles.length === 0)
            return;
        setUploading(true);
        setError(null);
        try {
            const newPhotos = await uploadPhotos(siteId, imageFiles);
            setPhotos((prev) => [...newPhotos, ...prev]);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        }
        finally {
            setUploading(false);
            if (fileInputRef.current)
                fileInputRef.current.value = '';
        }
    }, [siteId]);
    // AI Curation
    const handleCurate = useCallback(async () => {
        if (!siteId)
            return;
        const uncurated = photos.filter((p) => p.aiScore === undefined);
        const ids = uncurated.length > 0 ? uncurated.map((p) => p.id) : photos.map((p) => p.id);
        if (ids.length === 0)
            return;
        setCurating(true);
        setError(null);
        setCurationSummary(null);
        try {
            const result = await curatePhotos(siteId, ids);
            setCurationSummary(result.summary);
            // Merge updated photos back
            setPhotos((prev) => prev.map((p) => {
                const updated = result.photos.find((u) => u.id === p.id);
                return updated ?? p;
            }));
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Curation failed');
        }
        finally {
            setCurating(false);
        }
    }, [photos, siteId]);
    // Toggle photo selection
    const handleToggleSelect = useCallback(async (photo) => {
        if (!siteId)
            return;
        const newSelected = !photo.selected;
        try {
            const updated = await updatePhotoSelection(siteId, photo.id, newSelected);
            setPhotos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Update failed');
        }
    }, [siteId]);
    // Delete photo
    const handleDelete = useCallback(async (id) => {
        if (!siteId)
            return;
        try {
            await deletePhoto(siteId, id);
            setPhotos((prev) => prev.filter((p) => p.id !== id));
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Delete failed');
        }
    }, [siteId]);
    // Delete all unselected
    const handleDeleteUnselected = useCallback(async () => {
        if (!siteId)
            return;
        const unselected = photos.filter((p) => !p.selected);
        for (const photo of unselected) {
            await deletePhoto(siteId, photo.id).catch(() => { });
        }
        setPhotos((prev) => prev.filter((p) => p.selected));
    }, [photos, siteId]);
    // Drag and drop
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        handleUpload(e.dataTransfer.files);
    }, [handleUpload]);
    // Filter photos by view mode
    const filteredPhotos = photos.filter((p) => {
        if (viewMode === 'selected')
            return p.selected;
        if (viewMode === 'rejected')
            return !p.selected && p.aiScore !== undefined;
        return true;
    });
    const selectedCount = photos.filter((p) => p.selected).length;
    const curatedCount = photos.filter((p) => p.aiScore !== undefined).length;
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-semibold text-foreground", children: "Photo Curator" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Upload photos and let AI select the best ones" })] }), _jsx("div", { className: "flex items-center gap-2", children: photos.length > 0 && (_jsxs("button", { onClick: handleCurate, disabled: curating || photos.length === 0, className: "flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50", children: [curating ? (_jsx(Loader2, { className: "h-4 w-4 animate-spin" })) : (_jsx(Sparkles, { className: "h-4 w-4" })), curating ? 'Curating...' : 'AI Curate'] })) })] }), error && (_jsx("div", { className: "rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive", children: error })), curationSummary && (_jsx("div", { className: "rounded-lg border border-primary/30 bg-primary/5 p-4", children: _jsxs("div", { className: "flex items-start gap-2", children: [_jsx(Sparkles, { className: "mt-0.5 h-4 w-4 text-primary" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-foreground", children: "AI Curation Complete" }), _jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: curationSummary })] })] }) })), photos.length > 0 && (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("span", { className: "text-sm text-muted-foreground", children: [photos.length, " photos"] }), curatedCount > 0 && (_jsxs(_Fragment, { children: [_jsxs("span", { className: "text-sm text-muted-foreground", children: [_jsx(CheckCircle2, { className: "mr-1 inline h-3.5 w-3.5 text-green-500" }), selectedCount, " selected"] }), _jsxs("span", { className: "text-sm text-muted-foreground", children: [_jsx(XCircle, { className: "mr-1 inline h-3.5 w-3.5 text-red-400" }), curatedCount - selectedCount, " rejected"] })] }))] }), _jsxs("div", { className: "flex items-center gap-1", children: [['all', 'selected', 'rejected'].map((mode) => (_jsx("button", { onClick: () => setViewMode(mode), className: `rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === mode
                                    ? 'bg-accent text-accent-foreground'
                                    : 'text-muted-foreground hover:bg-accent/50'}`, children: mode.charAt(0).toUpperCase() + mode.slice(1) }, mode))), photos.some((p) => !p.selected && p.aiScore !== undefined) && (_jsxs("button", { onClick: handleDeleteUnselected, className: "ml-2 flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10", children: [_jsx(Trash2, { className: "h-3 w-3" }), "Delete Rejected"] }))] })] })), _jsxs("div", { onDragOver: (e) => e.preventDefault(), onDrop: handleDrop, onClick: () => fileInputRef.current?.click(), className: `flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors ${uploading
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border hover:border-primary hover:bg-primary/5'}`, children: [uploading ? (_jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" })) : (_jsx(Upload, { className: "h-8 w-8 text-muted-foreground" })), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-sm font-medium text-foreground", children: uploading ? 'Uploading photos...' : 'Drop photos here or click to upload' }), _jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "Supports JPEG, PNG, WebP, HEIC. Up to 100 photos at once." })] }), _jsx("input", { ref: fileInputRef, type: "file", accept: "image/*", multiple: true, onChange: (e) => e.target.files && handleUpload(e.target.files), className: "hidden" })] }), loading ? (_jsx("div", { className: "flex h-64 items-center justify-center", children: _jsx(Loader2, { className: "h-6 w-6 animate-spin text-muted-foreground" }) })) : filteredPhotos.length === 0 ? (_jsxs("div", { className: "flex h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border", children: [_jsx(ImageIcon, { className: "h-8 w-8 text-muted-foreground/50" }), _jsx("p", { className: "text-sm text-muted-foreground", children: photos.length === 0
                            ? 'No photos yet. Upload some photos to get started.'
                            : `No ${viewMode} photos to show.` })] })) : (_jsx("div", { className: "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5", children: filteredPhotos.map((photo) => (_jsx(PhotoCard, { photo: photo, onToggleSelect: handleToggleSelect, onDelete: handleDelete }, photo.id))) }))] }));
}
// ── Photo Card Component ─────────────────────────
function PhotoCard({ photo, onToggleSelect, onDelete, }) {
    const hasCuration = photo.aiScore !== undefined;
    return (_jsxs("div", { className: "group relative overflow-hidden rounded-lg border border-border bg-card", children: [_jsxs("div", { className: "relative aspect-square", children: [_jsx("img", { src: photo.blobUrl || '', alt: photo.filename, loading: "lazy", className: "h-full w-full object-cover" }), hasCuration && (_jsx("div", { className: `absolute inset-0 transition-colors ${photo.selected
                            ? 'ring-2 ring-inset ring-green-500'
                            : 'ring-2 ring-inset ring-red-400/50'}` })), hasCuration && (_jsxs("div", { className: `absolute left-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold shadow-sm ${photo.aiScore >= 70
                            ? 'bg-green-500/90 text-white'
                            : photo.aiScore >= 40
                                ? 'bg-yellow-500/90 text-white'
                                : 'bg-red-500/90 text-white'}`, children: [_jsx(Star, { className: "h-3 w-3" }), photo.aiScore] })), photo.selected && (_jsx("div", { className: "absolute right-2 top-2 rounded-full bg-green-500 p-1 shadow-sm", children: _jsx(Check, { className: "h-3 w-3 text-white" }) })), _jsxs("div", { className: "absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100", children: [_jsx("button", { onClick: () => onToggleSelect(photo), className: `rounded-full p-2 shadow-sm transition-colors ${photo.selected
                                    ? 'bg-red-500/90 text-white hover:bg-red-600'
                                    : 'bg-green-500/90 text-white hover:bg-green-600'}`, title: photo.selected ? 'Deselect' : 'Select', children: photo.selected ? _jsx(X, { className: "h-4 w-4" }) : _jsx(Check, { className: "h-4 w-4" }) }), _jsx("button", { onClick: () => onDelete(photo.id), className: "rounded-full bg-red-500/90 p-2 text-white shadow-sm transition-colors hover:bg-red-600", title: "Delete", children: _jsx(Trash2, { className: "h-4 w-4" }) })] })] }), _jsxs("div", { className: "p-2", children: [_jsx("p", { className: "truncate text-xs font-medium text-foreground", children: photo.filename }), photo.aiReason && (_jsx("p", { className: "mt-0.5 line-clamp-2 text-xs text-muted-foreground", children: photo.aiReason })), photo.tags && photo.tags.length > 0 && (_jsx("div", { className: "mt-1 flex flex-wrap gap-1", children: photo.tags.map((tag) => (_jsx("span", { className: "rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground", children: tag }, tag))) }))] })] }));
}
//# sourceMappingURL=PhotoCuratorPage.js.map