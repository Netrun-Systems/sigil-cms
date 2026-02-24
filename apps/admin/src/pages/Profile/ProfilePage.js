import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, TagInput, KeyValueEditor, ImagePreview, } from '@netrun-cms/ui';
import { api } from '../../lib/api';
const emptyForm = {
    artistName: '',
    bio: '',
    photoUrl: '',
    genres: [],
    socialLinks: {},
    bookingEmail: '',
    managementEmail: '',
};
export function ProfilePage() {
    const { siteId } = useParams();
    const basePath = siteId ? `/sites/${siteId}` : '';
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    useEffect(() => {
        api.get(`${basePath}/artist-profile`)
            .then((res) => {
            if (res.data)
                setForm({ ...emptyForm, ...res.data });
        })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [siteId]);
    const update = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setSuccess(false);
    };
    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSuccess(false);
        try {
            await api.put(`${basePath}/artist-profile`, form);
            setSuccess(true);
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
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Artist Profile" }), _jsxs("button", { onClick: handleSave, disabled: saving, className: "flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50", children: [saving ? _jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : _jsx(Save, { className: "h-4 w-4" }), "Save"] })] }), error && (_jsx("div", { className: "rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive", children: error })), success && (_jsx("div", { className: "rounded-lg border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-500", children: "Profile saved successfully" })), _jsxs("div", { className: "grid gap-6 lg:grid-cols-3", children: [_jsxs("div", { className: "space-y-6 lg:col-span-2", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Basic Info" }), _jsx(CardDescription, { children: "Public artist information" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Artist Name" }), _jsx("input", { value: form.artistName, onChange: (e) => update('artistName', e.target.value), placeholder: "Stage name", className: "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Bio" }), _jsx("textarea", { value: form.bio, onChange: (e) => update('bio', e.target.value), placeholder: "Artist biography...", rows: 6, className: "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y" })] }), _jsx(TagInput, { label: "Genres", tags: form.genres, onChange: (v) => update('genres', v), placeholder: "Add genre..." })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Social Links" }), _jsx(CardDescription, { children: "Links to social media profiles" })] }), _jsx(CardContent, { children: _jsx(KeyValueEditor, { entries: form.socialLinks, onChange: (v) => update('socialLinks', v), keyPlaceholder: "Platform (e.g. instagram)", valuePlaceholder: "URL" }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Contact" }), _jsx(CardDescription, { children: "Booking and management contact info" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Booking Email" }), _jsx("input", { type: "email", value: form.bookingEmail, onChange: (e) => update('bookingEmail', e.target.value), placeholder: "booking@example.com", className: "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Management Email" }), _jsx("input", { type: "email", value: form.managementEmail, onChange: (e) => update('managementEmail', e.target.value), placeholder: "mgmt@example.com", className: "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" })] })] })] })] }), _jsx("div", { children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Photo" }) }), _jsx(CardContent, { children: _jsx(ImagePreview, { url: form.photoUrl, onChange: (v) => update('photoUrl', v), placeholder: "https://..." }) })] }) })] })] }));
}
//# sourceMappingURL=ProfilePage.js.map