import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, KeyValueEditor, ImagePreview, } from '@netrun-cms/ui';
import { EMBED_PLATFORM, RELEASE_TYPE } from '@netrun-cms/core';
import { api } from '../../lib/api';
const emptyForm = {
    title: '',
    type: RELEASE_TYPE.SINGLE,
    releaseDate: new Date().toISOString().split('T')[0],
    coverUrl: '',
    embedUrl: '',
    embedPlatform: EMBED_PLATFORM.SPOTIFY,
    description: '',
    streamLinks: {},
    isPublished: false,
};
const typeOptions = [
    { value: RELEASE_TYPE.SINGLE, label: 'Single' },
    { value: RELEASE_TYPE.ALBUM, label: 'Album' },
    { value: RELEASE_TYPE.EP, label: 'EP' },
    { value: RELEASE_TYPE.MIXTAPE, label: 'Mixtape' },
];
const platformOptions = [
    { value: EMBED_PLATFORM.SPOTIFY, label: 'Spotify' },
    { value: EMBED_PLATFORM.YOUTUBE, label: 'YouTube' },
    { value: EMBED_PLATFORM.APPLE_MUSIC, label: 'Apple Music' },
    { value: EMBED_PLATFORM.SOUNDCLOUD, label: 'SoundCloud' },
    { value: EMBED_PLATFORM.BANDCAMP, label: 'Bandcamp' },
];
export function ReleaseEditor() {
    const { id, siteId } = useParams();
    const navigate = useNavigate();
    const isNew = !id;
    const basePath = siteId ? `/sites/${siteId}` : '';
    const listPath = siteId ? `/sites/${siteId}/releases` : '/releases';
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        if (!id)
            return;
        api.get(`${basePath}/releases/${id}`)
            .then((res) => {
            if (res.data) {
                setForm({
                    ...emptyForm,
                    ...res.data,
                    releaseDate: res.data.releaseDate?.split('T')[0] ?? emptyForm.releaseDate,
                });
            }
        })
            .catch(() => setError('Failed to load release'))
            .finally(() => setLoading(false));
    }, [id, siteId]);
    const update = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };
    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            if (isNew) {
                await api.post(`${basePath}/releases`, form);
            }
            else {
                await api.put(`${basePath}/releases/${id}`, form);
            }
            navigate(listPath);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Save failed');
        }
        finally {
            setSaving(false);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "flex h-64 items-center justify-center", children: _jsx(Loader2, { className: "h-6 w-6 animate-spin text-muted-foreground" }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { onClick: () => navigate(listPath), className: "rounded-md p-1.5 text-muted-foreground hover:bg-accent", children: _jsx(ArrowLeft, { className: "h-5 w-5" }) }), _jsx("h1", { className: "text-2xl font-semibold", children: isNew ? 'New Release' : 'Edit Release' })] }), _jsxs("button", { onClick: handleSave, disabled: saving || !form.title.trim(), className: "flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50", children: [saving ? _jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : _jsx(Save, { className: "h-4 w-4" }), "Save"] })] }), error && (_jsx("div", { className: "rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive", children: error })), _jsxs("div", { className: "grid gap-6 lg:grid-cols-3", children: [_jsxs("div", { className: "space-y-6 lg:col-span-2", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Details" }), _jsx(CardDescription, { children: "Basic release information" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Title" }), _jsx("input", { value: form.title, onChange: (e) => update('title', e.target.value), placeholder: "Release title", className: "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" })] }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Type" }), _jsx("select", { value: form.type, onChange: (e) => update('type', e.target.value), className: "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", children: typeOptions.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value))) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Release Date" }), _jsx("input", { type: "date", value: form.releaseDate, onChange: (e) => update('releaseDate', e.target.value), className: "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Description" }), _jsx("textarea", { value: form.description, onChange: (e) => update('description', e.target.value), placeholder: "Optional description...", rows: 3, className: "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y" })] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Embed" }), _jsx(CardDescription, { children: "Player embed for the release page" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Platform" }), _jsx("select", { value: form.embedPlatform, onChange: (e) => update('embedPlatform', e.target.value), className: "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", children: platformOptions.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value))) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Embed URL" }), _jsx("input", { value: form.embedUrl, onChange: (e) => update('embedUrl', e.target.value), placeholder: "https://open.spotify.com/embed/...", className: "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" })] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Stream Links" }), _jsx(CardDescription, { children: "Links to streaming platforms" })] }), _jsx(CardContent, { children: _jsx(KeyValueEditor, { entries: form.streamLinks, onChange: (v) => update('streamLinks', v), keyPlaceholder: "Platform (e.g. spotify)", valuePlaceholder: "URL" }) })] })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Publishing" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-0.5", children: [_jsx("label", { className: "text-sm font-medium", children: "Published" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Make this release visible on the site" })] }), _jsx("button", { role: "switch", "aria-checked": form.isPublished, onClick: () => update('isPublished', !form.isPublished), className: `relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${form.isPublished ? 'bg-primary' : 'bg-muted'}`, children: _jsx("span", { className: `pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${form.isPublished ? 'translate-x-4' : 'translate-x-0'}` }) })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Cover Art" }) }), _jsx(CardContent, { children: _jsx(ImagePreview, { url: form.coverUrl, onChange: (v) => update('coverUrl', v), placeholder: "https://..." }) })] })] })] })] }));
}
//# sourceMappingURL=ReleaseEditor.js.map