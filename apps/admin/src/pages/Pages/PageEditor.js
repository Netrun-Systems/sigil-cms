import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Save, Trash2, Eye, ArrowLeft, Settings, Plus, GripVertical, ChevronDown, ChevronUp, X, Type, Image, Video, LayoutGrid, MessageSquare, Star, HelpCircle, Code, Mail, BarChart, } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Textarea, Tabs, TabsContent, TabsList, TabsTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Separator, Badge, cn, } from '@netrun-cms/ui';
import { useState } from 'react';
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
function BlockPreview({ block, onEdit, onDelete, onToggleVisibility, onMoveUp, onMoveDown }) {
    const blockType = blockTypes.find((b) => b.type === block.type);
    const Icon = blockType?.icon || Type;
    return (_jsx("div", { className: cn('group relative rounded-lg border bg-card transition-all hover:border-primary', !block.isVisible && 'opacity-50'), children: _jsxs("div", { className: "flex items-center gap-3 p-4", children: [_jsx("div", { className: "cursor-grab", children: _jsx(GripVertical, { className: "h-5 w-5 text-muted-foreground" }) }), _jsx("div", { className: cn('flex h-10 w-10 items-center justify-center rounded-lg', 'bg-primary/10 text-primary'), children: _jsx(Icon, { className: "h-5 w-5" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium", children: blockType?.label || block.type }), _jsx("p", { className: "text-sm text-muted-foreground", children: blockType?.description || 'Content block' })] }), _jsxs("div", { className: "flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: onMoveUp, children: _jsx(ChevronUp, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: onMoveDown, children: _jsx(ChevronDown, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: onToggleVisibility, children: block.isVisible ? (_jsx(Eye, { className: "h-4 w-4" })) : (_jsx(Eye, { className: "h-4 w-4 text-muted-foreground" })) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: onEdit, children: _jsx(Settings, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 text-destructive hover:text-destructive", onClick: onDelete, children: _jsx(Trash2, { className: "h-4 w-4" }) })] })] }) }));
}
function AddBlockButton({ onAdd }) {
    const [isOpen, setIsOpen] = useState(false);
    return (_jsxs("div", { className: "relative", children: [_jsxs(Button, { variant: "outline", className: "w-full border-dashed", onClick: () => setIsOpen(!isOpen), children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "Add Block"] }), isOpen && (_jsxs("div", { className: "absolute left-0 right-0 top-full z-50 mt-2 rounded-lg border bg-popover p-4 shadow-lg", children: [_jsxs("div", { className: "mb-3 flex items-center justify-between", children: [_jsx("p", { className: "font-medium", children: "Choose Block Type" }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-6 w-6", onClick: () => setIsOpen(false), children: _jsx(X, { className: "h-4 w-4" }) })] }), _jsx("div", { className: "grid grid-cols-3 gap-2", children: blockTypes.map((blockType) => (_jsxs("button", { onClick: () => {
                                onAdd(blockType.type);
                                setIsOpen(false);
                            }, className: "flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-colors hover:bg-accent", children: [_jsx(blockType.icon, { className: "h-5 w-5 text-primary" }), _jsx("span", { className: "text-sm font-medium", children: blockType.label })] }, blockType.type))) })] }))] }));
}
export function PageEditor() {
    const { siteId, pageId } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(pageId);
    // Mock data for existing page
    const existingPage = isEditing
        ? {
            title: 'About Us',
            slug: 'about',
            status: 'published',
            template: 'default',
            parentId: null,
            metaTitle: 'About Us - Netrun Systems',
            metaDescription: 'Learn about Netrun Systems and our mission to provide enterprise cloud infrastructure.',
            ogImageUrl: '',
        }
        : null;
    const [formData, setFormData] = useState(existingPage || defaultFormData);
    const [blocks, setBlocks] = useState(isEditing
        ? [
            {
                id: '1',
                type: 'hero',
                content: { headline: 'About Us', subheadline: 'Our Story' },
                isVisible: true,
            },
            {
                id: '2',
                type: 'text',
                content: { body: 'Welcome to Netrun Systems...' },
                isVisible: true,
            },
            {
                id: '3',
                type: 'feature_grid',
                content: { features: [] },
                isVisible: true,
            },
            {
                id: '4',
                type: 'cta',
                content: { headline: 'Get Started', buttonText: 'Contact Us' },
                isVisible: true,
            },
        ]
        : []);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('content');
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
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsSaving(false);
        if (!isEditing) {
            navigate(`/sites/${siteId}/pages`);
        }
    };
    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this page?')) {
            navigate(`/sites/${siteId}/pages`);
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Button, { variant: "ghost", size: "icon", asChild: true, children: _jsx(Link, { to: `/sites/${siteId}/pages`, children: _jsx(ArrowLeft, { className: "h-5 w-5" }) }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight", children: isEditing ? formData.title : 'Create New Page' }), _jsx("p", { className: "text-muted-foreground", children: isEditing ? 'Edit page content and settings' : 'Add a new page to your site' })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [isEditing && (_jsxs(_Fragment, { children: [_jsxs(Button, { variant: "outline", children: [_jsx(Eye, { className: "mr-2 h-4 w-4" }), "Preview"] }), _jsxs(Button, { variant: "destructive", onClick: handleDelete, children: [_jsx(Trash2, { className: "mr-2 h-4 w-4" }), "Delete"] })] })), _jsxs(Button, { onClick: handleSave, disabled: isSaving, children: [_jsx(Save, { className: "mr-2 h-4 w-4" }), isSaving ? 'Saving...' : 'Save'] })] })] }), _jsxs("div", { className: "grid gap-6 lg:grid-cols-3", children: [_jsx("div", { className: "lg:col-span-2 space-y-6", children: _jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, children: [_jsxs(TabsList, { children: [_jsx(TabsTrigger, { value: "content", children: "Content Blocks" }), _jsx(TabsTrigger, { value: "seo", children: "SEO" })] }), _jsxs(TabsContent, { value: "content", className: "space-y-4 mt-4", children: [blocks.length > 0 ? (_jsx("div", { className: "space-y-3", children: blocks.map((block) => (_jsx(BlockPreview, { block: block, onEdit: () => { }, onDelete: () => handleDeleteBlock(block.id), onToggleVisibility: () => handleToggleBlockVisibility(block.id), onMoveUp: () => handleMoveBlock(block.id, 'up'), onMoveDown: () => handleMoveBlock(block.id, 'down') }, block.id))) })) : (_jsx(Card, { children: _jsxs(CardContent, { className: "flex flex-col items-center justify-center py-12", children: [_jsx("div", { className: "flex h-16 w-16 items-center justify-center rounded-full bg-muted", children: _jsx(LayoutGrid, { className: "h-8 w-8 text-muted-foreground" }) }), _jsx("h3", { className: "mt-4 text-lg font-semibold", children: "No content blocks yet" }), _jsx("p", { className: "mt-2 text-center text-sm text-muted-foreground", children: "Start building your page by adding content blocks" })] }) })), _jsx(AddBlockButton, { onAdd: handleAddBlock })] }), _jsx(TabsContent, { value: "seo", className: "space-y-4 mt-4", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "SEO Settings" }), _jsx(CardDescription, { children: "Search engine optimization for this page" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "metaTitle", children: "Meta Title" }), _jsx(Input, { id: "metaTitle", value: formData.metaTitle, onChange: (e) => handleChange('metaTitle', e.target.value), placeholder: formData.title || 'Page Title', maxLength: 60 }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [formData.metaTitle.length, "/60 characters"] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "metaDescription", children: "Meta Description" }), _jsx(Textarea, { id: "metaDescription", value: formData.metaDescription, onChange: (e) => handleChange('metaDescription', e.target.value), placeholder: "A compelling description for search results", rows: 3, maxLength: 160 }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [formData.metaDescription.length, "/160 characters"] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "ogImageUrl", children: "Social Image URL" }), _jsx(Input, { id: "ogImageUrl", value: formData.ogImageUrl, onChange: (e) => handleChange('ogImageUrl', e.target.value), placeholder: "/images/og-image.jpg" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Image shown when shared on social media (1200x630px recommended)" })] }), _jsx(Separator, {}), _jsxs("div", { className: "rounded-lg border bg-muted/50 p-4", children: [_jsx("p", { className: "mb-2 text-sm font-medium", children: "Search Preview" }), _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-lg text-blue-600 hover:underline", children: formData.metaTitle || formData.title || 'Page Title' }), _jsxs("p", { className: "text-sm text-green-700", children: ["netrunsystems.com/", formData.slug || 'page-slug'] }), _jsx("p", { className: "text-sm text-muted-foreground", children: formData.metaDescription || 'Meta description will appear here...' })] })] })] })] }) })] }) }), _jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Page Settings" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "title", children: "Title" }), _jsx(Input, { id: "title", value: formData.title, onChange: (e) => handleChange('title', e.target.value), placeholder: "Page Title" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "slug", children: "Slug" }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { className: "text-sm text-muted-foreground", children: "/" }), _jsx(Input, { id: "slug", value: formData.slug, onChange: (e) => handleChange('slug', e.target.value), placeholder: "page-slug", className: "flex-1" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "status", children: "Status" }), _jsxs(Select, { value: formData.status, onValueChange: (value) => handleChange('status', value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "draft", children: "Draft" }), _jsx(SelectItem, { value: "published", children: "Published" }), _jsx(SelectItem, { value: "scheduled", children: "Scheduled" }), _jsx(SelectItem, { value: "archived", children: "Archived" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "template", children: "Template" }), _jsxs(Select, { value: formData.template, onValueChange: (value) => handleChange('template', value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "default", children: "Default" }), _jsx(SelectItem, { value: "landing", children: "Landing Page" }), _jsx(SelectItem, { value: "blog", children: "Blog" }), _jsx(SelectItem, { value: "product", children: "Product" }), _jsx(SelectItem, { value: "contact", children: "Contact" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "parent", children: "Parent Page" }), _jsxs(Select, { value: formData.parentId || 'none', onValueChange: (value) => handleChange('parentId', value === 'none' ? null : value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "No parent" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "none", children: "No parent (root level)" }), _jsx(SelectItem, { value: "services", children: "Services" }), _jsx(SelectItem, { value: "about", children: "About" }), _jsx(SelectItem, { value: "blog", children: "Blog" })] })] })] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Content Summary" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: "Total Blocks" }), _jsx(Badge, { variant: "secondary", children: blocks.length })] }), _jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: "Visible Blocks" }), _jsx(Badge, { variant: "secondary", children: blocks.filter((b) => b.isVisible).length })] }), _jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: "Hidden Blocks" }), _jsx(Badge, { variant: "secondary", children: blocks.filter((b) => !b.isVisible).length })] })] }) })] })] })] })] }));
}
//# sourceMappingURL=PageEditor.js.map