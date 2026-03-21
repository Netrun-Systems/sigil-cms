import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Save, Trash2, ExternalLink, ArrowLeft, FileText, Image, Palette, } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Textarea, Tabs, TabsContent, TabsList, TabsTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Separator, } from '@netrun-cms/ui';
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { usePermissions } from '../../hooks/usePermissions';
import { DomainManager } from '../../components/DomainManager';
const defaultFormData = {
    name: '',
    slug: '',
    domain: '',
    defaultLanguage: 'en',
    status: 'draft',
    description: '',
    favicon: '',
    logo: '',
    logoDark: '',
    googleAnalyticsId: '',
    metaTitle: '',
    metaDescription: '',
};
export function SiteEditor() {
    const { siteId } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(siteId);
    const { canEdit, canDelete } = usePermissions();
    const [formData, setFormData] = useState(defaultFormData);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!siteId)
            return;
        api.get('/sites/' + siteId).then((res) => {
            const s = res.data;
            const settings = (s.settings || {});
            setFormData({
                name: s.name || '',
                slug: s.slug || '',
                domain: s.domain || '',
                defaultLanguage: s.defaultLanguage || 'en',
                status: s.status || 'draft',
                description: settings.description || '',
                favicon: settings.favicon || '',
                logo: settings.logo || '',
                logoDark: settings.logoDark || '',
                googleAnalyticsId: settings.googleAnalyticsId || '',
                metaTitle: settings.metaTitle || '',
                metaDescription: settings.metaDescription || '',
            });
        }).catch((err) => setError(err.message));
    }, [siteId]);
    const handleChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
            // Auto-generate slug from name if creating new site
            ...(field === 'name' && !isEditing
                ? {
                    slug: value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-|-$/g, ''),
                }
                : {}),
        }));
    };
    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        try {
            const payload = {
                name: formData.name,
                slug: formData.slug,
                domain: formData.domain,
                defaultLanguage: formData.defaultLanguage,
                status: formData.status,
                settings: {
                    description: formData.description,
                    favicon: formData.favicon,
                    logo: formData.logo,
                    logoDark: formData.logoDark,
                    googleAnalyticsId: formData.googleAnalyticsId,
                    metaTitle: formData.metaTitle,
                    metaDescription: formData.metaDescription,
                },
            };
            if (isEditing) {
                await api.put('/sites/' + siteId, payload);
            }
            else {
                const res = await api.post('/sites', payload);
                navigate('/sites/' + res.data.id);
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Save failed');
        }
        finally {
            setIsSaving(false);
        }
    };
    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this site?')) {
            try {
                await api.delete('/sites/' + siteId);
                navigate('/sites');
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'Delete failed');
            }
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Button, { variant: "ghost", size: "icon", onClick: () => navigate(-1), children: _jsx(ArrowLeft, { className: "h-5 w-5" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight", children: isEditing ? formData.name : 'Create New Site' }), _jsx("p", { className: "text-muted-foreground", children: isEditing
                                            ? 'Manage site settings and configuration'
                                            : 'Set up a new website' })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [!canEdit && (_jsx("span", { className: "rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300", children: "View Only" })), isEditing && canDelete && (_jsxs(Button, { variant: "destructive", onClick: handleDelete, children: [_jsx(Trash2, { className: "mr-2 h-4 w-4" }), "Delete"] })), _jsxs(Button, { onClick: handleSave, disabled: isSaving || !canEdit, children: [_jsx(Save, { className: "mr-2 h-4 w-4" }), isSaving ? 'Saving...' : 'Save Changes'] })] })] }), error && (_jsx("div", { className: "rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive", children: error })), isEditing && (_jsxs("div", { className: "flex gap-3", children: [_jsx(Button, { variant: "outline", size: "sm", asChild: true, children: _jsxs(Link, { to: `/sites/${siteId}/pages`, children: [_jsx(FileText, { className: "mr-2 h-4 w-4" }), "Pages"] }) }), _jsx(Button, { variant: "outline", size: "sm", asChild: true, children: _jsxs(Link, { to: `/sites/${siteId}/media`, children: [_jsx(Image, { className: "mr-2 h-4 w-4" }), "Media"] }) }), _jsx(Button, { variant: "outline", size: "sm", asChild: true, children: _jsxs(Link, { to: `/sites/${siteId}/themes`, children: [_jsx(Palette, { className: "mr-2 h-4 w-4" }), "Theme"] }) }), formData.domain && (_jsx(Button, { variant: "outline", size: "sm", asChild: true, children: _jsxs("a", { href: `https://${formData.domain}`, target: "_blank", rel: "noopener noreferrer", children: [_jsx(ExternalLink, { className: "mr-2 h-4 w-4" }), "View Site"] }) }))] })), _jsxs(Tabs, { defaultValue: "general", className: "space-y-6", children: [_jsxs(TabsList, { children: [_jsx(TabsTrigger, { value: "general", children: "General" }), _jsx(TabsTrigger, { value: "branding", children: "Branding" }), _jsx(TabsTrigger, { value: "seo", children: "SEO" }), _jsx(TabsTrigger, { value: "analytics", children: "Analytics" }), isEditing && _jsx(TabsTrigger, { value: "domain", children: "Domain" })] }), _jsx(TabsContent, { value: "general", className: "space-y-6", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Site Information" }), _jsx(CardDescription, { children: "Basic information about your website" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "name", children: "Site Name" }), _jsx(Input, { id: "name", value: formData.name, onChange: (e) => handleChange('name', e.target.value), placeholder: "My Awesome Site" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "slug", children: "Slug" }), _jsx(Input, { id: "slug", value: formData.slug, onChange: (e) => handleChange('slug', e.target.value), placeholder: "my-awesome-site" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Used in URLs and internal references" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "description", children: "Description" }), _jsx(Textarea, { id: "description", value: formData.description, onChange: (e) => handleChange('description', e.target.value), placeholder: "A brief description of your site", rows: 3 })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "domain", children: "Custom Domain" }), _jsx(Input, { id: "domain", value: formData.domain, onChange: (e) => handleChange('domain', e.target.value), placeholder: "example.com" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "language", children: "Default Language" }), _jsxs(Select, { value: formData.defaultLanguage, onValueChange: (value) => handleChange('defaultLanguage', value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select language" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "en", children: "English" }), _jsx(SelectItem, { value: "es", children: "Spanish" }), _jsx(SelectItem, { value: "fr", children: "French" }), _jsx(SelectItem, { value: "de", children: "German" }), _jsx(SelectItem, { value: "ja", children: "Japanese" })] })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "status", children: "Status" }), _jsxs(Select, { value: formData.status, onValueChange: (value) => handleChange('status', value), children: [_jsx(SelectTrigger, { className: "w-[200px]", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "draft", children: "Draft" }), _jsx(SelectItem, { value: "published", children: "Published" }), _jsx(SelectItem, { value: "archived", children: "Archived" })] })] })] })] })] }) }), _jsx(TabsContent, { value: "branding", className: "space-y-6", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Branding" }), _jsx(CardDescription, { children: "Logo and visual identity for your site" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "favicon", children: "Favicon URL" }), _jsx(Input, { id: "favicon", value: formData.favicon, onChange: (e) => handleChange('favicon', e.target.value), placeholder: "/favicon.ico" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Recommended: 32x32 or 16x16 PNG or ICO file" })] }), _jsx(Separator, {}), _jsxs("div", { className: "grid gap-6 md:grid-cols-2", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "logo", children: "Logo (Light Mode)" }), _jsxs("div", { className: "flex items-center gap-4", children: [formData.logo && (_jsx("div", { className: "flex h-16 w-32 items-center justify-center rounded-lg border bg-white p-2", children: _jsx("img", { src: formData.logo, alt: "Logo preview", className: "max-h-full max-w-full" }) })), _jsx(Input, { id: "logo", value: formData.logo, onChange: (e) => handleChange('logo', e.target.value), placeholder: "/logo.svg", className: "flex-1" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "logoDark", children: "Logo (Dark Mode)" }), _jsxs("div", { className: "flex items-center gap-4", children: [formData.logoDark && (_jsx("div", { className: "flex h-16 w-32 items-center justify-center rounded-lg border bg-gray-900 p-2", children: _jsx("img", { src: formData.logoDark, alt: "Dark logo preview", className: "max-h-full max-w-full" }) })), _jsx(Input, { id: "logoDark", value: formData.logoDark, onChange: (e) => handleChange('logoDark', e.target.value), placeholder: "/logo-dark.svg", className: "flex-1" })] })] })] })] })] }) }), _jsx(TabsContent, { value: "seo", className: "space-y-6", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "SEO Settings" }), _jsx(CardDescription, { children: "Search engine optimization defaults for your site" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "metaTitle", children: "Default Meta Title" }), _jsx(Input, { id: "metaTitle", value: formData.metaTitle, onChange: (e) => handleChange('metaTitle', e.target.value), placeholder: "Your Site Name - Tagline", maxLength: 60 }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [formData.metaTitle.length, "/60 characters (recommended)"] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "metaDescription", children: "Default Meta Description" }), _jsx(Textarea, { id: "metaDescription", value: formData.metaDescription, onChange: (e) => handleChange('metaDescription', e.target.value), placeholder: "A compelling description of your site for search results", rows: 3, maxLength: 160 }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [formData.metaDescription.length, "/160 characters (recommended)"] })] }), _jsx(Separator, {}), _jsxs("div", { className: "rounded-lg border bg-muted/50 p-4", children: [_jsx("p", { className: "mb-2 text-sm font-medium", children: "Search Preview" }), _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-lg text-blue-600 hover:underline", children: formData.metaTitle || 'Your Site Title' }), _jsx("p", { className: "text-sm text-green-700", children: formData.domain || 'example.com' }), _jsx("p", { className: "text-sm text-muted-foreground", children: formData.metaDescription ||
                                                                'Your meta description will appear here...' })] })] })] })] }) }), _jsx(TabsContent, { value: "analytics", className: "space-y-6", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Analytics & Tracking" }), _jsx(CardDescription, { children: "Configure analytics and tracking services" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "googleAnalyticsId", children: "Google Analytics ID" }), _jsx(Input, { id: "googleAnalyticsId", value: formData.googleAnalyticsId, onChange: (e) => handleChange('googleAnalyticsId', e.target.value), placeholder: "G-XXXXXXXXXX or UA-XXXXXXXX-X" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Your Google Analytics 4 or Universal Analytics tracking ID" })] }), _jsx(Separator, {}), _jsx("div", { className: "rounded-lg border p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium", children: "Cookie Consent Banner" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Show a GDPR-compliant cookie consent banner" })] }), _jsx(Switch, {})] }) })] })] }) }), isEditing && siteId && (_jsx(TabsContent, { value: "domain", className: "space-y-6", children: _jsx(DomainManager, { siteId: siteId, currentDomain: formData.domain, onDomainChange: (d) => setFormData((prev) => ({ ...prev, domain: d })) }) }))] })] }));
}
//# sourceMappingURL=SiteEditor.js.map