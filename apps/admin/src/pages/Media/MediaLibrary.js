import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useParams, Link } from 'react-router-dom';
import { Image, Video, FileText, File, Upload, Search, LayoutGrid, List, Trash2, Copy, Eye, FolderPlus, ArrowLeft, Check, } from 'lucide-react';
import { Card, CardContent, Button, Input, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, cn, } from '@netrun-cms/ui';
import { useState } from 'react';
const mockMedia = [
    {
        id: '1',
        filename: 'hero-banner.jpg',
        originalFilename: 'hero-banner.jpg',
        mimeType: 'image/jpeg',
        fileSize: 245000,
        url: '/uploads/hero-banner.jpg',
        thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300',
        altText: 'Hero banner image',
        folder: 'banners',
        width: 1920,
        height: 1080,
        createdAt: '2026-01-15',
    },
    {
        id: '2',
        filename: 'logo.svg',
        originalFilename: 'netrun-logo.svg',
        mimeType: 'image/svg+xml',
        fileSize: 4500,
        url: '/uploads/logo.svg',
        thumbnailUrl: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300',
        altText: 'Company logo',
        folder: 'branding',
        createdAt: '2026-01-10',
    },
    {
        id: '3',
        filename: 'team-photo.jpg',
        originalFilename: 'team-photo.jpg',
        mimeType: 'image/jpeg',
        fileSize: 890000,
        url: '/uploads/team-photo.jpg',
        thumbnailUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300',
        altText: 'Team photo',
        folder: 'about',
        width: 2400,
        height: 1600,
        createdAt: '2026-01-08',
    },
    {
        id: '4',
        filename: 'product-demo.mp4',
        originalFilename: 'product-demo.mp4',
        mimeType: 'video/mp4',
        fileSize: 15000000,
        url: '/uploads/product-demo.mp4',
        folder: 'videos',
        createdAt: '2026-01-05',
    },
    {
        id: '5',
        filename: 'whitepaper.pdf',
        originalFilename: 'cloud-infrastructure-guide.pdf',
        mimeType: 'application/pdf',
        fileSize: 2500000,
        url: '/uploads/whitepaper.pdf',
        folder: 'documents',
        createdAt: '2026-01-03',
    },
    {
        id: '6',
        filename: 'service-icon-1.png',
        originalFilename: 'cloud-icon.png',
        mimeType: 'image/png',
        fileSize: 12000,
        url: '/uploads/service-icon-1.png',
        thumbnailUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=300',
        altText: 'Cloud service icon',
        folder: 'icons',
        width: 256,
        height: 256,
        createdAt: '2025-12-28',
    },
    {
        id: '7',
        filename: 'office-photo.jpg',
        originalFilename: 'office-photo.jpg',
        mimeType: 'image/jpeg',
        fileSize: 456000,
        url: '/uploads/office-photo.jpg',
        thumbnailUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300',
        altText: 'Office photo',
        folder: 'about',
        width: 1800,
        height: 1200,
        createdAt: '2025-12-20',
    },
    {
        id: '8',
        filename: 'case-study-banner.jpg',
        originalFilename: 'case-study-banner.jpg',
        mimeType: 'image/jpeg',
        fileSize: 320000,
        url: '/uploads/case-study-banner.jpg',
        thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300',
        altText: 'Case study banner',
        folder: 'banners',
        width: 1600,
        height: 900,
        createdAt: '2025-12-15',
    },
];
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
function MediaCard({ file, isSelected, onSelect, onDelete, viewMode, }) {
    const [showPreview, setShowPreview] = useState(false);
    const Icon = getFileIcon(file.mimeType);
    const isImage = file.mimeType.startsWith('image/');
    const isVideo = file.mimeType.startsWith('video/');
    if (viewMode === 'list') {
        return (_jsxs("div", { className: cn('group flex items-center gap-4 rounded-lg border p-3 transition-all hover:bg-accent/50', isSelected && 'border-primary bg-primary/5'), children: [_jsx("button", { onClick: onSelect, className: cn('flex h-5 w-5 items-center justify-center rounded border', isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border'), children: isSelected && _jsx(Check, { className: "h-3 w-3" }) }), _jsx("div", { className: "flex h-12 w-12 items-center justify-center rounded-lg bg-muted", children: isImage && file.thumbnailUrl ? (_jsx("img", { src: file.thumbnailUrl, alt: file.altText || file.filename, className: "h-full w-full rounded-lg object-cover" })) : (_jsx(Icon, { className: "h-6 w-6 text-muted-foreground" })) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "truncate font-medium", children: file.filename }), _jsxs("p", { className: "text-sm text-muted-foreground", children: [formatFileSize(file.fileSize), file.width && file.height && ` - ${file.width}x${file.height}`] })] }), _jsx(Badge, { variant: "secondary", className: "capitalize", children: file.folder }), _jsxs("div", { className: "flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100", children: [(isImage || isVideo) && (_jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: () => setShowPreview(true), children: _jsx(Eye, { className: "h-4 w-4" }) })), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: () => navigator.clipboard.writeText(file.url), children: _jsx(Copy, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 text-destructive hover:text-destructive", onClick: onDelete, children: _jsx(Trash2, { className: "h-4 w-4" }) })] })] }));
    }
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: cn('group relative aspect-square cursor-pointer overflow-hidden rounded-lg border bg-muted transition-all hover:border-primary', isSelected && 'border-primary ring-2 ring-primary/20'), onClick: onSelect, children: [isImage && file.thumbnailUrl ? (_jsx("img", { src: file.thumbnailUrl, alt: file.altText || file.filename, className: "h-full w-full object-cover" })) : (_jsxs("div", { className: "flex h-full w-full flex-col items-center justify-center gap-2 p-4", children: [_jsx(Icon, { className: "h-10 w-10 text-muted-foreground" }), _jsx("p", { className: "truncate text-center text-xs text-muted-foreground", children: file.filename })] })), _jsx("div", { className: cn('absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors', isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-white/50 bg-black/20 opacity-0 group-hover:opacity-100'), children: isSelected && _jsx(Check, { className: "h-3 w-3" }) }), _jsxs("div", { className: "absolute bottom-0 left-0 right-0 flex justify-center gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100", children: [(isImage || isVideo) && (_jsx(Button, { variant: "secondary", size: "icon", className: "h-7 w-7", onClick: (e) => {
                                    e.stopPropagation();
                                    setShowPreview(true);
                                }, children: _jsx(Eye, { className: "h-3 w-3" }) })), _jsx(Button, { variant: "secondary", size: "icon", className: "h-7 w-7", onClick: (e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(file.url);
                                }, children: _jsx(Copy, { className: "h-3 w-3" }) }), _jsx(Button, { variant: "destructive", size: "icon", className: "h-7 w-7", onClick: (e) => {
                                    e.stopPropagation();
                                    onDelete();
                                }, children: _jsx(Trash2, { className: "h-3 w-3" }) })] })] }), showPreview && (_jsx(Dialog, { open: showPreview, onOpenChange: setShowPreview, children: _jsxs(DialogContent, { className: "max-w-4xl", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: file.filename }), _jsxs(DialogDescription, { children: [formatFileSize(file.fileSize), file.width && file.height && ` - ${file.width}x${file.height}`] })] }), _jsxs("div", { className: "flex items-center justify-center bg-muted rounded-lg p-4", children: [isImage && (_jsx("img", { src: file.thumbnailUrl || file.url, alt: file.altText || file.filename, className: "max-h-[60vh] object-contain" })), isVideo && (_jsx("video", { src: file.url, controls: true, className: "max-h-[60vh]" }))] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setShowPreview(false), children: "Close" }), _jsxs(Button, { onClick: () => navigator.clipboard.writeText(file.url), children: [_jsx(Copy, { className: "mr-2 h-4 w-4" }), "Copy URL"] })] })] }) }))] }));
}
export function MediaLibrary() {
    const { siteId } = useParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [selectedType, setSelectedType] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [selectedFiles, setSelectedFiles] = useState(new Set());
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const folders = [...new Set(mockMedia.map((m) => m.folder))];
    const filteredMedia = mockMedia.filter((file) => {
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
    const handleDelete = (fileId) => {
        if (confirm('Are you sure you want to delete this file?')) {
            // Delete file
            setSelectedFiles((prev) => {
                const next = new Set(prev);
                next.delete(fileId);
                return next;
            });
        }
    };
    const handleDeleteSelected = () => {
        if (confirm(`Are you sure you want to delete ${selectedFiles.size} files?`)) {
            // Delete files
            setSelectedFiles(new Set());
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [siteId && (_jsx(Button, { variant: "ghost", size: "icon", asChild: true, children: _jsx(Link, { to: `/sites/${siteId}`, children: _jsx(ArrowLeft, { className: "h-5 w-5" }) }) })), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Media Library" }), _jsx("p", { className: "text-muted-foreground", children: siteId ? 'Manage media for this site' : 'Manage all media files' })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [selectedFiles.size > 0 && (_jsxs(Button, { variant: "destructive", onClick: handleDeleteSelected, children: [_jsx(Trash2, { className: "mr-2 h-4 w-4" }), "Delete (", selectedFiles.size, ")"] })), _jsxs(Button, { onClick: () => setShowUploadDialog(true), children: [_jsx(Upload, { className: "mr-2 h-4 w-4" }), "Upload Files"] })] })] }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between", children: [_jsxs("div", { className: "flex flex-1 gap-4", children: [_jsxs("div", { className: "relative flex-1 max-w-md", children: [_jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), _jsx(Input, { placeholder: "Search files...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "pl-9" })] }), _jsxs(Select, { value: selectedFolder || 'all', onValueChange: (v) => setSelectedFolder(v === 'all' ? null : v), children: [_jsx(SelectTrigger, { className: "w-[150px]", children: _jsx(SelectValue, { placeholder: "All folders" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All folders" }), folders.map((folder) => (_jsx(SelectItem, { value: folder, className: "capitalize", children: folder }, folder)))] })] }), _jsxs(Select, { value: selectedType || 'all', onValueChange: (v) => setSelectedType(v === 'all' ? null : v), children: [_jsx(SelectTrigger, { className: "w-[150px]", children: _jsx(SelectValue, { placeholder: "All types" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All types" }), _jsx(SelectItem, { value: "image", children: "Images" }), _jsx(SelectItem, { value: "video", children: "Videos" }), _jsx(SelectItem, { value: "document", children: "Documents" })] })] })] }), _jsxs("div", { className: "flex gap-1", children: [_jsx(Button, { variant: viewMode === 'grid' ? 'secondary' : 'ghost', size: "icon", onClick: () => setViewMode('grid'), children: _jsx(LayoutGrid, { className: "h-4 w-4" }) }), _jsx(Button, { variant: viewMode === 'list' ? 'secondary' : 'ghost', size: "icon", onClick: () => setViewMode('list'), children: _jsx(List, { className: "h-4 w-4" }) })] })] }) }) }), filteredMedia.length > 0 ? (viewMode === 'grid' ? (_jsx("div", { className: "grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5", children: filteredMedia.map((file) => (_jsx(MediaCard, { file: file, isSelected: selectedFiles.has(file.id), onSelect: () => handleSelect(file.id), onDelete: () => handleDelete(file.id), viewMode: viewMode }, file.id))) })) : (_jsx(Card, { children: _jsx(CardContent, { className: "p-4 space-y-2", children: filteredMedia.map((file) => (_jsx(MediaCard, { file: file, isSelected: selectedFiles.has(file.id), onSelect: () => handleSelect(file.id), onDelete: () => handleDelete(file.id), viewMode: viewMode }, file.id))) }) }))) : (_jsx(Card, { children: _jsxs(CardContent, { className: "flex flex-col items-center justify-center py-12", children: [_jsx("div", { className: "flex h-16 w-16 items-center justify-center rounded-full bg-muted", children: _jsx(Image, { className: "h-8 w-8 text-muted-foreground" }) }), _jsx("h3", { className: "mt-4 text-lg font-semibold", children: "No files found" }), _jsx("p", { className: "mt-2 text-center text-sm text-muted-foreground", children: searchQuery || selectedFolder || selectedType
                                ? 'Try adjusting your search or filter criteria.'
                                : 'Upload your first file to get started.' }), !searchQuery && !selectedFolder && !selectedType && (_jsxs(Button, { className: "mt-4", onClick: () => setShowUploadDialog(true), children: [_jsx(Upload, { className: "mr-2 h-4 w-4" }), "Upload Files"] }))] }) })), _jsx(Dialog, { open: showUploadDialog, onOpenChange: setShowUploadDialog, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Upload Files" }), _jsx(DialogDescription, { children: "Drag and drop files or click to browse" })] }), _jsxs("div", { className: "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center", children: [_jsx(Upload, { className: "h-10 w-10 text-muted-foreground" }), _jsx("p", { className: "mt-4 text-sm font-medium", children: "Drag and drop files here, or click to browse" }), _jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "PNG, JPG, GIF, SVG, PDF, MP4 up to 50MB" }), _jsxs(Button, { className: "mt-4", children: [_jsx(Upload, { className: "mr-2 h-4 w-4" }), "Select Files"] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Upload to folder" }), _jsxs(Select, { defaultValue: "uploads", children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [folders.map((folder) => (_jsx(SelectItem, { value: folder, className: "capitalize", children: folder }, folder))), _jsx(SelectItem, { value: "new", children: _jsxs("span", { className: "flex items-center gap-2", children: [_jsx(FolderPlus, { className: "h-4 w-4" }), "New folder..."] }) })] })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setShowUploadDialog(false), children: "Cancel" }), _jsx(Button, { children: "Upload" })] })] }) })] }));
}
function Label({ children, ...props }) {
    return (_jsx("label", { className: "text-sm font-medium", ...props, children: children }));
}
//# sourceMappingURL=MediaLibrary.js.map