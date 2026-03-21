import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Save, Trash2, Eye, ArrowLeft, Settings, Plus, GripVertical, ChevronDown, ChevronUp, X, Type, Image, Video, LayoutGrid, MessageSquare, Star, HelpCircle, Code, Mail, BarChart, Clock, Calendar, } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Textarea, Tabs, TabsContent, TabsList, TabsTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Separator, Badge, ResizablePanelGroup, ResizablePanel, ResizableHandle, cn, } from '@netrun-cms/ui';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../../lib/api';
import { BlockContentEditor } from '../../components/BlockContentEditor';
import { LanguageSelector } from '../../components/LanguageSelector';
import { RevisionHistory } from '../../components/RevisionHistory';
import { usePermissions } from '../../hooks/usePermissions';
import { LivePreviewPanel, PreviewModeToggle, } from '../../components/LivePreviewPanel';
import { usePreviewChannel, useDebouncedCallback } from '../../hooks/usePreviewChannel';
const blockTypes = [
    { type: 'hero', label: 'Hero', icon: LayoutGrid, description: 'Large header with CTA' },
    { type: 'text', label: 'Text', icon: Type, description: 'Rich text content' },
    { type: 'image', label: 'Image', icon: Image, description: 'Single image with caption' },
    { type: 'gallery', label: 'Gallery', icon: Image, description: 'Image gallery or carousel' },
    { type: 'video', label: 'Video', icon: Video, description: 'Embedded video' },
    { type: 'cta', label: 'Call to Action', icon: MessageSquare, description: 'Action button section' },
    { type: 'feature_grid', label: 'Features', icon: LayoutGrid, description: 'Feature grid layout' },
    { type: 'testimonial', label: 'Testimonial', icon: Star, description: 'Customer quotes' },
    { type: 'faq', label: 'FAQ', icon: HelpCircle, description: 'Questions and answers' },
    { type: 'code_block', label: 'Code', icon: Code, description: 'Code snippet' },
    { type: 'contact_form', label: 'Contact Form', icon: Mail, description: 'Contact form' },
    { type: 'stats_bar', label: 'Stats', icon: BarChart, description: 'Statistics display' },
];
const defaultFormData = {
    title: '',
    slug: '',
    status: 'draft',
    template: 'default',
    parentId: null,
    metaTitle: '',
    metaDescription: '',
    ogImageUrl: '',
};
/** Convert an ISO date string to a local datetime-local input value */
function toLocalDatetime(iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime()))
        return '';
    const pad = (n) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
/** Format a remaining duration for countdown display */
function formatCountdown(targetDate) {
    const target = new Date(targetDate);
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    if (diffMs <= 0)
        return 'now';
    const hours = Math.floor(diffMs / 3_600_000);
    const minutes = Math.floor((diffMs % 3_600_000) / 60_000);
    if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `in ${days}d ${hours % 24}h`;
    }
    return `in ${hours}h ${minutes}m`;
}
function BlockPreview({ block, isSelected, onEdit, onDelete, onToggleVisibility, onMoveUp, onMoveDown }) {
    const blockType = blockTypes.find((b) => b.type === block.type);
    const Icon = blockType?.icon || Type;
    return (_jsx("div", { className: cn('group relative rounded-lg border bg-card transition-all hover:border-primary', isSelected && 'border-primary ring-1 ring-primary', !block.isVisible && 'opacity-50'), children: _jsxs("div", { className: "flex items-center gap-3 p-4 cursor-pointer", onClick: onEdit, children: [_jsx("div", { className: "cursor-grab", children: _jsx(GripVertical, { className: "h-5 w-5 text-muted-foreground" }) }), _jsx("div", { className: cn('flex h-10 w-10 items-center justify-center rounded-lg', 'bg-primary/10 text-primary'), children: _jsx(Icon, { className: "h-5 w-5" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium", children: blockType?.label || block.type }), _jsx("p", { className: "text-sm text-muted-foreground", children: blockType?.description || 'Content block' })] }), _jsxs("div", { className: "flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: (e) => { e.stopPropagation(); onMoveUp(); }, children: _jsx(ChevronUp, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: (e) => { e.stopPropagation(); onMoveDown(); }, children: _jsx(ChevronDown, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: (e) => { e.stopPropagation(); onToggleVisibility(); }, children: block.isVisible ? (_jsx(Eye, { className: "h-4 w-4" })) : (_jsx(Eye, { className: "h-4 w-4 text-muted-foreground" })) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: (e) => { e.stopPropagation(); onEdit(); }, children: _jsx(Settings, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 text-destructive hover:text-destructive", onClick: (e) => { e.stopPropagation(); onDelete(); }, children: _jsx(Trash2, { className: "h-4 w-4" }) })] })] }) }));
}
function AddBlockButton({ onAdd }) {
    const [isOpen, setIsOpen] = useState(false);
    return (_jsxs("div", { className: "relative", children: [_jsxs(Button, { variant: "outline", className: "w-full border-dashed", onClick: () => setIsOpen(!isOpen), children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "Add Block"] }), isOpen && (_jsxs("div", { className: "absolute left-0 right-0 top-full z-50 mt-2 rounded-lg border bg-popover p-4 shadow-lg", children: [_jsxs("div", { className: "mb-3 flex items-center justify-between", children: [_jsx("p", { className: "font-medium", children: "Choose Block Type" }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-6 w-6", onClick: () => setIsOpen(false), children: _jsx(X, { className: "h-4 w-4" }) })] }), _jsx("div", { className: "grid grid-cols-3 gap-2", children: blockTypes.map((blockType) => (_jsxs("button", { onClick: () => {
                                onAdd(blockType.type);
                                setIsOpen(false);
                            }, className: "flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-colors hover:bg-accent", children: [_jsx(blockType.icon, { className: "h-5 w-5 text-primary" }), _jsx("span", { className: "text-sm font-medium", children: blockType.label })] }, blockType.type))) })] }))] }));
}
/**
 * Extracted editor content (blocks + SEO tabs) so it can be rendered
 * in both the default grid layout and the split-pane layout.
 */
function EditorContent({ activeTab, setActiveTab, blocks, selectedBlockId, setSelectedBlockId, handleDeleteBlock, handleToggleBlockVisibility, handleMoveBlock, handleBlockContentChange, handleAddBlock, formData, handleChange, }) {
    return (_jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, children: [_jsxs(TabsList, { children: [_jsx(TabsTrigger, { value: "content", children: "Content Blocks" }), _jsx(TabsTrigger, { value: "seo", children: "SEO" })] }), _jsxs(TabsContent, { value: "content", className: "space-y-4 mt-4", children: [blocks.length > 0 ? (_jsx("div", { className: "space-y-3", children: blocks.map((block) => (_jsxs("div", { children: [_jsx(BlockPreview, { block: block, isSelected: selectedBlockId === block.id, onEdit: () => setSelectedBlockId(selectedBlockId === block.id ? null : block.id), onDelete: () => {
                                        handleDeleteBlock(block.id);
                                        if (selectedBlockId === block.id)
                                            setSelectedBlockId(null);
                                    }, onToggleVisibility: () => handleToggleBlockVisibility(block.id), onMoveUp: () => handleMoveBlock(block.id, 'up'), onMoveDown: () => handleMoveBlock(block.id, 'down') }), selectedBlockId === block.id && (_jsxs(Card, { className: "mt-2 border-primary/30", children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(CardTitle, { className: "text-base", children: ["Edit ", blockTypes.find((b) => b.type === block.type)?.label || block.type, " Content"] }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", onClick: () => setSelectedBlockId(null), children: _jsx(X, { className: "h-4 w-4" }) })] }) }), _jsx(CardContent, { children: _jsx(BlockContentEditor, { blockType: block.type, content: block.content, onChange: (content) => handleBlockContentChange(block.id, content) }) })] }))] }, block.id))) })) : (_jsx(Card, { children: _jsxs(CardContent, { className: "flex flex-col items-center justify-center py-12", children: [_jsx("div", { className: "flex h-16 w-16 items-center justify-center rounded-full bg-muted", children: _jsx(LayoutGrid, { className: "h-8 w-8 text-muted-foreground" }) }), _jsx("h3", { className: "mt-4 text-lg font-semibold", children: "No content blocks yet" }), _jsx("p", { className: "mt-2 text-center text-sm text-muted-foreground", children: "Start building your page by adding content blocks" })] }) })), _jsx(AddBlockButton, { onAdd: handleAddBlock })] }), _jsx(TabsContent, { value: "seo", className: "space-y-4 mt-4", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "SEO Settings" }), _jsx(CardDescription, { children: "Search engine optimization for this page" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "metaTitle", children: "Meta Title" }), _jsx(Input, { id: "metaTitle", value: formData.metaTitle, onChange: (e) => handleChange('metaTitle', e.target.value), placeholder: formData.title || 'Page Title', maxLength: 60 }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [formData.metaTitle.length, "/60 characters"] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "metaDescription", children: "Meta Description" }), _jsx(Textarea, { id: "metaDescription", value: formData.metaDescription, onChange: (e) => handleChange('metaDescription', e.target.value), placeholder: "A compelling description for search results", rows: 3, maxLength: 160 }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [formData.metaDescription.length, "/160 characters"] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "ogImageUrl", children: "Social Image URL" }), _jsx(Input, { id: "ogImageUrl", value: formData.ogImageUrl, onChange: (e) => handleChange('ogImageUrl', e.target.value), placeholder: "/images/og-image.jpg" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Image shown when shared on social media (1200x630px recommended)" })] }), _jsx(Separator, {}), _jsxs("div", { className: "rounded-lg border bg-muted/50 p-4", children: [_jsx("p", { className: "mb-2 text-sm font-medium", children: "Search Preview" }), _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-lg text-blue-600 hover:underline", children: formData.metaTitle || formData.title || 'Page Title' }), _jsxs("p", { className: "text-sm text-green-700", children: ["netrunsystems.com/", formData.slug || 'page-slug'] }), _jsx("p", { className: "text-sm text-muted-foreground", children: formData.metaDescription || 'Meta description will appear here...' })] })] })] })] }) })] }));
}
export function PageEditor() {
    const { siteId, pageId } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(pageId);
    const { canEdit, canDelete, canPublish } = usePermissions();
    const [formData, setFormData] = useState(defaultFormData);
    const [blocks, setBlocks] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isScheduling, setIsScheduling] = useState(false);
    const [activeTab, setActiveTab] = useState('content');
    const [error, setError] = useState(null);
    const [selectedBlockId, setSelectedBlockId] = useState(null);
    const [pageLanguage, setPageLanguage] = useState('en');
    const [publishAt, setPublishAt] = useState('');
    const [unpublishAt, setUnpublishAt] = useState('');
    const [showSchedulePanel, setShowSchedulePanel] = useState(false);
    const [previewMode, setPreviewMode] = useState('edit');
    const [previewViewport, setPreviewViewport] = useState('desktop');
    // --- Live Preview Channel ---
    const { iframeRef, sendUpdate } = usePreviewChannel();
    const previewUrl = useMemo(() => {
        const base = import.meta.env
            ?.VITE_PREVIEW_URL;
        if (!base || !formData.slug)
            return null;
        return `${base.replace(/\/$/, '')}/${formData.slug}?preview=true`;
    }, [formData.slug]);
    // Debounced sender — fires 300ms after the last edit
    const debouncedSendPreview = useDebouncedCallback(useCallback((page, blks) => {
        sendUpdate(page, blks);
    }, [sendUpdate]), 300);
    // Send preview updates whenever blocks or page metadata change
    useEffect(() => {
        if (previewMode === 'edit')
            return; // No iframe visible, skip
        debouncedSendPreview({
            title: formData.title,
            slug: formData.slug,
            template: formData.template,
            status: formData.status,
        }, blocks);
    }, [formData.title, formData.slug, formData.template, formData.status, blocks, previewMode, debouncedSendPreview]);
    const handleBlockContentChange = (blockId, content) => {
        setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, content } : b)));
    };
    useEffect(() => {
        if (!siteId || !pageId)
            return;
        // Load page data
        api.get('/sites/' + siteId + '/pages/' + pageId).then((res) => {
            const p = res.data;
            const seo = (p.seo || {});
            setFormData({
                title: p.title || '',
                slug: p.slug || '',
                status: p.status || 'draft',
                template: p.template || 'default',
                parentId: p.parentId || null,
                metaTitle: seo.metaTitle || p.metaTitle || '',
                metaDescription: seo.metaDescription || p.metaDescription || '',
                ogImageUrl: seo.ogImageUrl || p.ogImageUrl || '',
            });
            setPageLanguage(p.language || 'en');
            // Load schedule fields
            if (p.publishAt) {
                setPublishAt(toLocalDatetime(p.publishAt));
            }
            if (p.unpublishAt) {
                setUnpublishAt(toLocalDatetime(p.unpublishAt));
            }
        }).catch((err) => setError(err.message));
        // Load blocks
        api.get('/sites/' + siteId + '/pages/' + pageId + '/blocks').then((res) => {
            const loaded = (res.data || []).map((b) => ({
                id: b.id,
                type: b.blockType || b.type,
                content: b.content || {},
                isVisible: b.isVisible !== false,
            }));
            setBlocks(loaded);
        }).catch((err) => setError(err.message));
    }, [siteId, pageId]);
    const handleChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
            // Auto-generate slug from title if creating new page
            ...(field === 'title' && !isEditing
                ? {
                    slug: value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-|-$/g, ''),
                }
                : {}),
        }));
    };
    const handleAddBlock = (type) => {
        const newBlock = {
            id: Date.now().toString(),
            type: type,
            content: {},
            isVisible: true,
        };
        setBlocks((prev) => [...prev, newBlock]);
    };
    const handleDeleteBlock = (id) => {
        setBlocks((prev) => prev.filter((b) => b.id !== id));
    };
    const handleToggleBlockVisibility = (id) => {
        setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, isVisible: !b.isVisible } : b)));
    };
    const handleMoveBlock = (id, direction) => {
        setBlocks((prev) => {
            const index = prev.findIndex((b) => b.id === id);
            if ((direction === 'up' && index === 0) ||
                (direction === 'down' && index === prev.length - 1)) {
                return prev;
            }
            const newBlocks = [...prev];
            const newIndex = direction === 'up' ? index - 1 : index + 1;
            [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
            return newBlocks;
        });
    };
    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        try {
            const pagePayload = {
                title: formData.title,
                slug: formData.slug,
                status: formData.status,
                template: formData.template,
                parentId: formData.parentId,
                seo: {
                    metaTitle: formData.metaTitle,
                    metaDescription: formData.metaDescription,
                    ogImageUrl: formData.ogImageUrl,
                },
            };
            let savedPageId = pageId;
            if (isEditing) {
                await api.put('/sites/' + siteId + '/pages/' + pageId, pagePayload);
            }
            else {
                const res = await api.post('/sites/' + siteId + '/pages', pagePayload);
                savedPageId = res.data.id;
            }
            // Save blocks
            for (let i = 0; i < blocks.length; i++) {
                const block = blocks[i];
                const blockPayload = {
                    blockType: block.type,
                    content: block.content,
                    sortOrder: i,
                    isVisible: block.isVisible,
                };
                // Existing blocks have UUID ids, new ones have timestamp ids
                const isExistingBlock = block.id.includes('-');
                if (isExistingBlock) {
                    await api.put('/sites/' + siteId + '/pages/' + savedPageId + '/blocks/' + block.id, blockPayload);
                }
                else {
                    const res = await api.post('/sites/' + siteId + '/pages/' + savedPageId + '/blocks', blockPayload);
                    block.id = res.data.id;
                }
            }
            if (!isEditing && savedPageId) {
                navigate('/sites/' + siteId + '/pages/' + savedPageId);
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Save failed');
        }
        finally {
            setIsSaving(false);
        }
    };
    const handleSchedule = async () => {
        if (!siteId || !pageId)
            return;
        setIsScheduling(true);
        setError(null);
        try {
            // Save the page first to persist any pending changes
            await handleSave();
            const body = {};
            if (publishAt) {
                body.publishAt = new Date(publishAt).toISOString();
            }
            else {
                body.publishAt = null;
            }
            if (unpublishAt) {
                body.unpublishAt = new Date(unpublishAt).toISOString();
            }
            else {
                body.unpublishAt = null;
            }
            const res = await api.patch('/sites/' + siteId + '/pages/' + pageId + '/schedule', body);
            const updated = res.data;
            setFormData((prev) => ({
                ...prev,
                status: updated.status || prev.status,
            }));
            setShowSchedulePanel(false);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Schedule failed');
        }
        finally {
            setIsScheduling(false);
        }
    };
    const handleClearSchedule = async () => {
        if (!siteId || !pageId)
            return;
        setIsScheduling(true);
        setError(null);
        try {
            const res = await api.patch('/sites/' + siteId + '/pages/' + pageId + '/schedule', { publishAt: null, unpublishAt: null });
            const updated = res.data;
            setFormData((prev) => ({
                ...prev,
                status: updated.status || prev.status,
            }));
            setPublishAt('');
            setUnpublishAt('');
            setShowSchedulePanel(false);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Clear schedule failed');
        }
        finally {
            setIsScheduling(false);
        }
    };
    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this page?')) {
            try {
                await api.delete('/sites/' + siteId + '/pages/' + pageId);
                navigate('/sites/' + siteId + '/pages');
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'Delete failed');
            }
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Button, { variant: "ghost", size: "icon", asChild: true, children: _jsx(Link, { to: `/sites/${siteId}/pages`, children: _jsx(ArrowLeft, { className: "h-5 w-5" }) }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight", children: isEditing ? formData.title : 'Create New Page' }), _jsx("p", { className: "text-muted-foreground", children: isEditing ? 'Edit page content and settings' : 'Add a new page to your site' })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [!canEdit && (_jsx("span", { className: "rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300", children: "View Only" })), isEditing && (_jsxs(_Fragment, { children: [_jsx(PreviewModeToggle, { mode: previewMode, onChange: setPreviewMode }), canDelete && (_jsxs(Button, { variant: "destructive", onClick: handleDelete, children: [_jsx(Trash2, { className: "mr-2 h-4 w-4" }), "Delete"] }))] })), isEditing && canPublish && (_jsxs(Button, { variant: "outline", onClick: () => setShowSchedulePanel(!showSchedulePanel), children: [_jsx(Clock, { className: "mr-2 h-4 w-4" }), "Schedule"] })), _jsxs(Button, { onClick: handleSave, disabled: isSaving || !canEdit, children: [_jsx(Save, { className: "mr-2 h-4 w-4" }), isSaving ? 'Saving...' : 'Save'] })] })] }), error && (_jsx("div", { className: "rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive", children: error })), previewMode === 'preview' ? (
            /* Full-width preview mode */
            _jsx("div", { className: "rounded-lg border overflow-hidden", style: { height: 'calc(100vh - 160px)' }, children: _jsx(LivePreviewPanel, { iframeRef: iframeRef, previewUrl: previewUrl, viewport: previewViewport, onViewportChange: setPreviewViewport }) })) : previewMode === 'split' ? (
            /* Split mode — editor left, preview right */
            _jsxs(ResizablePanelGroup, { direction: "horizontal", className: "rounded-lg border", style: { height: 'calc(100vh - 160px)' }, children: [_jsx(ResizablePanel, { defaultSize: 55, minSize: 30, children: _jsx("div", { className: "h-full overflow-y-auto p-6", children: _jsx(EditorContent, { activeTab: activeTab, setActiveTab: setActiveTab, blocks: blocks, selectedBlockId: selectedBlockId, setSelectedBlockId: setSelectedBlockId, handleDeleteBlock: handleDeleteBlock, handleToggleBlockVisibility: handleToggleBlockVisibility, handleMoveBlock: handleMoveBlock, handleBlockContentChange: handleBlockContentChange, handleAddBlock: handleAddBlock, formData: formData, handleChange: handleChange }) }) }), _jsx(ResizableHandle, { withHandle: true }), _jsx(ResizablePanel, { defaultSize: 45, minSize: 25, children: _jsx(LivePreviewPanel, { iframeRef: iframeRef, previewUrl: previewUrl, viewport: previewViewport, onViewportChange: setPreviewViewport }) })] })) : (
            /* Default edit mode — original layout */
            _jsxs("div", { className: "grid gap-6 lg:grid-cols-3", children: [_jsx("div", { className: "lg:col-span-2 space-y-6", children: _jsx(EditorContent, { activeTab: activeTab, setActiveTab: setActiveTab, blocks: blocks, selectedBlockId: selectedBlockId, setSelectedBlockId: setSelectedBlockId, handleDeleteBlock: handleDeleteBlock, handleToggleBlockVisibility: handleToggleBlockVisibility, handleMoveBlock: handleMoveBlock, handleBlockContentChange: handleBlockContentChange, handleAddBlock: handleAddBlock, formData: formData, handleChange: handleChange }) }), _jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Page Settings" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "title", children: "Title" }), _jsx(Input, { id: "title", value: formData.title, onChange: (e) => handleChange('title', e.target.value), placeholder: "Page Title" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "slug", children: "Slug" }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { className: "text-sm text-muted-foreground", children: "/" }), _jsx(Input, { id: "slug", value: formData.slug, onChange: (e) => handleChange('slug', e.target.value), placeholder: "page-slug", className: "flex-1" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "status", children: "Status" }), _jsxs(Select, { value: formData.status, onValueChange: (value) => handleChange('status', value), disabled: !canPublish, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "draft", children: "Draft" }), _jsx(SelectItem, { value: "published", children: "Published" }), _jsx(SelectItem, { value: "scheduled", children: "Scheduled" }), _jsx(SelectItem, { value: "archived", children: "Archived" })] })] }), !canPublish && (_jsx("p", { className: "text-xs text-muted-foreground", children: "Only admins and editors can change publish status" }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "template", children: "Template" }), _jsxs(Select, { value: formData.template, onValueChange: (value) => handleChange('template', value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "default", children: "Default" }), _jsx(SelectItem, { value: "landing", children: "Landing Page" }), _jsx(SelectItem, { value: "blog", children: "Blog" }), _jsx(SelectItem, { value: "product", children: "Product" }), _jsx(SelectItem, { value: "contact", children: "Contact" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "parent", children: "Parent Page" }), _jsxs(Select, { value: formData.parentId || 'none', onValueChange: (value) => handleChange('parentId', value === 'none' ? null : value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "No parent" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "none", children: "No parent (root level)" }), _jsx(SelectItem, { value: "services", children: "Services" }), _jsx(SelectItem, { value: "about", children: "About" }), _jsx(SelectItem, { value: "blog", children: "Blog" })] })] })] })] })] }), showSchedulePanel && isEditing && (_jsxs(Card, { className: "border-primary/30", children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Calendar, { className: "h-4 w-4" }), "Content Schedule"] }), _jsx(CardDescription, { children: "Automatically publish or unpublish this page" })] }), _jsxs(CardContent, { className: "space-y-4", children: [formData.status === 'scheduled' && publishAt && (_jsxs("div", { className: "rounded-lg bg-primary/10 p-3 text-sm", children: [_jsxs("div", { className: "flex items-center gap-2 font-medium text-primary", children: [_jsx(Clock, { className: "h-4 w-4" }), "Scheduled to publish ", formatCountdown(publishAt)] }), _jsx("p", { className: "mt-1 text-muted-foreground", children: new Date(publishAt).toLocaleString() })] })), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "publishAt", children: "Publish At" }), _jsx(Input, { id: "publishAt", type: "datetime-local", value: publishAt, onChange: (e) => setPublishAt(e.target.value) }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Leave empty to publish manually" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "unpublishAt", children: "Unpublish At (optional)" }), _jsx(Input, { id: "unpublishAt", type: "datetime-local", value: unpublishAt, onChange: (e) => setUnpublishAt(e.target.value), min: publishAt || undefined }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Page will be archived at this time" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { onClick: handleSchedule, disabled: isScheduling || !publishAt, className: "flex-1", children: [_jsx(Clock, { className: "mr-2 h-4 w-4" }), isScheduling ? 'Scheduling...' : 'Set Schedule'] }), (formData.status === 'scheduled' || publishAt || unpublishAt) && (_jsx(Button, { variant: "outline", onClick: handleClearSchedule, disabled: isScheduling, children: "Clear" }))] })] })] })), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Content Summary" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: "Total Blocks" }), _jsx(Badge, { variant: "secondary", children: blocks.length })] }), _jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: "Visible Blocks" }), _jsx(Badge, { variant: "secondary", children: blocks.filter((b) => b.isVisible).length })] }), _jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: "Hidden Blocks" }), _jsx(Badge, { variant: "secondary", children: blocks.filter((b) => !b.isVisible).length })] })] }) })] }), isEditing && siteId && pageId && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Languages" }) }), _jsx(CardContent, { children: _jsx(LanguageSelector, { siteId: siteId, pageId: pageId, currentLanguage: pageLanguage }) })] })), isEditing && siteId && pageId && (_jsx(RevisionHistory, { siteId: siteId, pageId: pageId, onReverted: () => {
                                    // Reload page data after revert
                                    window.location.reload();
                                } }))] })] }))] }));
}
//# sourceMappingURL=PageEditor.js.map