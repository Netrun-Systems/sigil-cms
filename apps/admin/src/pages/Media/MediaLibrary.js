import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useParams, Link } from 'react-router-dom';
import { Image, Video, FileText, File, Upload, Search, LayoutGrid, List, Trash2, Copy, Eye, ArrowLeft, Check, Globe, } from 'lucide-react';
import { Card, CardContent, Button, Input, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Tabs, TabsList, TabsTrigger, TabsContent, cn, } from '@netrun-cms/ui';
import { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import { usePermissions } from '../../hooks/usePermissions';
import { StockImageBrowser } from './StockImageBrowser';
function formatFileSize(bytes) {
    if (bytes < 1024)
        return bytes + ' B';
    if (bytes < 1024 * 1024)
        return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
function getFileIcon(mimeType) {
    if (mimeType.startsWith('image/'))
        return Image;
    if (mimeType.startsWith('video/'))
        return Video;
    if (mimeType === 'application/pdf')
        return FileText;
    return File;
}
function MediaCard({ file, isSelected, onSelect, onDelete, viewMode, showDelete = true, }) {
    const [showPreview, setShowPreview] = useState(false);
    const Icon = getFileIcon(file.mimeType);
    const isImage = file.mimeType.startsWith('image/');
    const isVideo = file.mimeType.startsWith('video/');
    if (viewMode === 'list') {
        return (_jsxs("div", { className: cn('group flex items-center gap-4 rounded-lg border p-3 transition-all hover:bg-accent/50', isSelected && 'border-primary bg-primary/5'), children: [_jsx("button", { onClick: onSelect, className: cn('flex h-5 w-5 items-center justify-center rounded border', isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border'), children: isSelected && _jsx(Check, { className: "h-3 w-3" }) }), _jsx("div", { className: "flex h-12 w-12 items-center justify-center rounded-lg bg-muted", children: isImage && file.thumbnailUrl ? (_jsx("img", { src: file.thumbnailUrl, alt: file.altText || file.filename, className: "h-full w-full rounded-lg object-cover" })) : (_jsx(Icon, { className: "h-6 w-6 text-muted-foreground" })) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "truncate font-medium", children: file.filename }), _jsxs("p", { className: "text-sm text-muted-foreground", children: [formatFileSize(file.fileSize), file.width && file.height && ` - ${file.width}x${file.height}`] })] }), _jsx(Badge, { variant: "secondary", className: "capitalize", children: file.folder }), _jsxs("div", { className: "flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100", children: [(isImage || isVideo) && (_jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: () => setShowPreview(true), children: _jsx(Eye, { className: "h-4 w-4" }) })), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: () => navigator.clipboard.writeText(file.url), children: _jsx(Copy, { className: "h-4 w-4" }) }), showDelete && (_jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 text-destructive hover:text-destructive", onClick: onDelete, children: _jsx(Trash2, { className: "h-4 w-4" }) }))] })] }));
    }
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: cn('group relative aspect-square cursor-pointer overflow-hidden rounded-lg border bg-muted transition-all hover:border-primary', isSelected && 'border-primary ring-2 ring-primary/20'), onClick: onSelect, children: [isImage && file.thumbnailUrl ? (_jsx("img", { src: file.thumbnailUrl, alt: file.altText || file.filename, className: "h-full w-full object-cover" })) : (_jsxs("div", { className: "flex h-full w-full flex-col items-center justify-center gap-2 p-4", children: [_jsx(Icon, { className: "h-10 w-10 text-muted-foreground" }), _jsx("p", { className: "truncate text-center text-xs text-muted-foreground", children: file.filename })] })), _jsx("div", { className: cn('absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors', isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-white/50 bg-black/20 opacity-0 group-hover:opacity-100'), children: isSelected && _jsx(Check, { className: "h-3 w-3" }) }), _jsxs("div", { className: "absolute bottom-0 left-0 right-0 flex justify-center gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100", children: [(isImage || isVideo) && (_jsx(Button, { variant: "secondary", size: "icon", className: "h-7 w-7", onClick: (e) => {
                                    e.stopPropagation();
                                    setShowPreview(true);
                                }, children: _jsx(Eye, { className: "h-3 w-3" }) })), _jsx(Button, { variant: "secondary", size: "icon", className: "h-7 w-7", onClick: (e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(file.url);
                                }, children: _jsx(Copy, { className: "h-3 w-3" }) }), showDelete && _jsx(Button, { variant: "destructive", size: "icon", className: "h-7 w-7", onClick: (e) => {
                                    e.stopPropagation();
                                    onDelete();
                                }, children: _jsx(Trash2, { className: "h-3 w-3" }) })] })] }), showPreview && (_jsx(Dialog, { open: showPreview, onOpenChange: setShowPreview, children: _jsxs(DialogContent, { className: "max-w-4xl", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: file.filename }), _jsxs(DialogDescription, { children: [formatFileSize(file.fileSize), file.width && file.height && ` - ${file.width}x${file.height}`] })] }), _jsxs("div", { className: "flex items-center justify-center bg-muted rounded-lg p-4", children: [isImage && (_jsx("img", { src: file.thumbnailUrl || file.url, alt: file.altText || file.filename, className: "max-h-[60vh] object-contain" })), isVideo && (_jsx("video", { src: file.url, controls: true, className: "max-h-[60vh]" }))] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setShowPreview(false), children: "Close" }), _jsxs(Button, { onClick: () => navigator.clipboard.writeText(file.url), children: [_jsx(Copy, { className: "mr-2 h-4 w-4" }), "Copy URL"] })] })] }) }))] }));
}
export function MediaLibrary() {
    const { siteId } = useParams();
    const { canCreate, canDelete } = usePermissions();
    const [media, setMedia] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [selectedType, setSelectedType] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [selectedFiles, setSelectedFiles] = useState(new Set());
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [uploadFolder, setUploadFolder] = useState('uploads');
    const fileInputRef = useRef(null);
    const loadMedia = async () => {
        if (!siteId)
            return;
        setIsLoading(true);
        try {
            const res = await api.get('/sites/' + siteId + '/media?limit=100');
            setMedia(res.data || []);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load media');
        }
        finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        loadMedia();
    }, [siteId]);
    const folders = [...new Set(media.map((m) => m.folder).filter(Boolean))];
    const filteredMedia = media.filter((file) => {
        const matchesSearch = file.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
            file.originalFilename.toLowerCase().includes(searchQuery.toLowerCase()) ||
            file.altText?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFolder = !selectedFolder || file.folder === selectedFolder;
        const matchesType = !selectedType ||
            (selectedType === 'image' && file.mimeType.startsWith('image/')) ||
            (selectedType === 'video' && file.mimeType.startsWith('video/')) ||
            (selectedType === 'document' &&
                (file.mimeType === 'application/pdf' ||
                    file.mimeType.startsWith('application/')));
        return matchesSearch && matchesFolder && matchesType;
    });
    const handleSelect = (fileId) => {
        setSelectedFiles((prev) => {
            const next = new Set(prev);
            if (next.has(fileId)) {
                next.delete(fileId);
            }
            else {
                next.add(fileId);
            }
            return next;
        });
    };
    const handleDelete = async (fileId) => {
        if (confirm('Are you sure you want to delete this file?')) {
            try {
                await api.delete('/sites/' + siteId + '/media/' + fileId);
                setMedia((prev) => prev.filter((m) => m.id !== fileId));
                setSelectedFiles((prev) => {
                    const next = new Set(prev);
                    next.delete(fileId);
                    return next;
                });
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'Delete failed');
            }
        }
    };
    const handleDeleteSelected = async () => {
        if (confirm(`Are you sure you want to delete ${selectedFiles.size} files?`)) {
            try {
                const ids = Array.from(selectedFiles);
                await Promise.all(ids.map((id) => api.delete('/sites/' + siteId + '/media/' + id)));
                setMedia((prev) => prev.filter((m) => !selectedFiles.has(m.id)));
                setSelectedFiles(new Set());
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'Delete failed');
            }
        }
    };
    const handleFileUpload = async (files) => {
        if (!files || !siteId)
            return;
        setError(null);
        for (const file of Array.from(files)) {
            try {
                const mediaRecord = {
                    filename: file.name,
                    originalFilename: file.name,
                    mimeType: file.type,
                    fileSize: file.size,
                    url: '/uploads/' + file.name,
                    folder: uploadFolder,
                };
                await api.post('/sites/' + siteId + '/media', mediaRecord);
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'Upload failed for ' + file.name);
            }
        }
        setShowUploadDialog(false);
        loadMedia();
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [siteId && (_jsx(Button, { variant: "ghost", size: "icon", asChild: true, children: _jsx(Link, { to: `/sites/${siteId}`, children: _jsx(ArrowLeft, { className: "h-5 w-5" }) }) })), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Media Library" }), _jsx("p", { className: "text-muted-foreground", children: siteId ? 'Manage media for this site' : 'Manage all media files' })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [error && (_jsx("span", { className: "text-sm text-destructive", children: error })), selectedFiles.size > 0 && canDelete && (_jsxs(Button, { variant: "destructive", onClick: handleDeleteSelected, children: [_jsx(Trash2, { className: "mr-2 h-4 w-4" }), "Delete (", selectedFiles.size, ")"] })), canCreate && (_jsxs(Button, { onClick: () => setShowUploadDialog(true), children: [_jsx(Upload, { className: "mr-2 h-4 w-4" }), "Upload Files"] }))] })] }), _jsxs(Tabs, { defaultValue: "my-media", children: [_jsxs(TabsList, { children: [_jsxs(TabsTrigger, { value: "my-media", children: [_jsx(Image, { className: "mr-2 h-4 w-4" }), "My Media"] }), _jsxs(TabsTrigger, { value: "stock", children: [_jsx(Globe, { className: "mr-2 h-4 w-4" }), "Stock Images"] })] }), _jsx(TabsContent, { value: "stock", className: "mt-4", children: _jsx(StockImageBrowser, {}) }), _jsxs(TabsContent, { value: "my-media", className: "mt-4", children: [_jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between", children: [_jsxs("div", { className: "flex flex-1 gap-4", children: [_jsxs("div", { className: "relative flex-1 max-w-md", children: [_jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), _jsx(Input, { placeholder: "Search files...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "pl-9" })] }), _jsxs(Select, { value: selectedFolder || 'all', onValueChange: (v) => setSelectedFolder(v === 'all' ? null : v), children: [_jsx(SelectTrigger, { className: "w-[150px]", children: _jsx(SelectValue, { placeholder: "All folders" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All folders" }), folders.map((folder) => (_jsx(SelectItem, { value: folder, className: "capitalize", children: folder }, folder)))] })] }), _jsxs(Select, { value: selectedType || 'all', onValueChange: (v) => setSelectedType(v === 'all' ? null : v), children: [_jsx(SelectTrigger, { className: "w-[150px]", children: _jsx(SelectValue, { placeholder: "All types" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All types" }), _jsx(SelectItem, { value: "image", children: "Images" }), _jsx(SelectItem, { value: "video", children: "Videos" }), _jsx(SelectItem, { value: "document", children: "Documents" })] })] })] }), _jsxs("div", { className: "flex gap-1", children: [_jsx(Button, { variant: viewMode === 'grid' ? 'secondary' : 'ghost', size: "icon", onClick: () => setViewMode('grid'), children: _jsx(LayoutGrid, { className: "h-4 w-4" }) }), _jsx(Button, { variant: viewMode === 'list' ? 'secondary' : 'ghost', size: "icon", onClick: () => setViewMode('list'), children: _jsx(List, { className: "h-4 w-4" }) })] })] }) }) }), filteredMedia.length > 0 ? (viewMode === 'grid' ? (_jsx("div", { className: "grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5", children: filteredMedia.map((file) => (_jsx(MediaCard, { file: file, isSelected: selectedFiles.has(file.id), onSelect: () => handleSelect(file.id), onDelete: () => handleDelete(file.id), viewMode: viewMode, showDelete: canDelete }, file.id))) })) : (_jsx(Card, { children: _jsx(CardContent, { className: "p-4 space-y-2", children: filteredMedia.map((file) => (_jsx(MediaCard, { file: file, isSelected: selectedFiles.has(file.id), onSelect: () => handleSelect(file.id), onDelete: () => handleDelete(file.id), viewMode: viewMode, showDelete: canDelete }, file.id))) }) }))) : (_jsx(Card, { children: _jsxs(CardContent, { className: "flex flex-col items-center justify-center py-12", children: [_jsx("div", { className: "flex h-16 w-16 items-center justify-center rounded-full bg-muted", children: _jsx(Image, { className: "h-8 w-8 text-muted-foreground" }) }), _jsx("h3", { className: "mt-4 text-lg font-semibold", children: "No files found" }), _jsx("p", { className: "mt-2 text-center text-sm text-muted-foreground", children: searchQuery || selectedFolder || selectedType
                                                ? 'Try adjusting your search or filter criteria.'
                                                : 'Upload your first file to get started.' }), !searchQuery && !selectedFolder && !selectedType && canCreate && (_jsxs(Button, { className: "mt-4", onClick: () => setShowUploadDialog(true), children: [_jsx(Upload, { className: "mr-2 h-4 w-4" }), "Upload Files"] }))] }) })), _jsx(Dialog, { open: showUploadDialog, onOpenChange: setShowUploadDialog, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Upload Files" }), _jsx(DialogDescription, { children: "Drag and drop files or click to browse" })] }), _jsx("input", { ref: fileInputRef, type: "file", multiple: true, accept: "image/*,video/*,application/pdf", className: "hidden", onChange: (e) => handleFileUpload(e.target.files) }), _jsxs("div", { className: "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center cursor-pointer", onClick: () => fileInputRef.current?.click(), children: [_jsx(Upload, { className: "h-10 w-10 text-muted-foreground" }), _jsx("p", { className: "mt-4 text-sm font-medium", children: "Click to browse for files" }), _jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "PNG, JPG, GIF, SVG, PDF, MP4 up to 50MB" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Upload to folder" }), _jsxs(Select, { value: uploadFolder, onValueChange: setUploadFolder, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "uploads", children: "uploads" }), folders.filter((f) => f !== 'uploads').map((folder) => (_jsx(SelectItem, { value: folder, className: "capitalize", children: folder }, folder)))] })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setShowUploadDialog(false), children: "Cancel" }), _jsxs(Button, { onClick: () => fileInputRef.current?.click(), children: [_jsx(Upload, { className: "mr-2 h-4 w-4" }), "Select Files"] })] })] }) })] })] })] }));
}
function Label({ children, ...props }) {
    return (_jsx("label", { className: "text-sm font-medium", ...props, children: children }));
}
//# sourceMappingURL=MediaLibrary.js.map