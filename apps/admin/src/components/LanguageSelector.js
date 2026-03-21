import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * LanguageSelector Component
 *
 * Displays available translations for a page and allows creating new ones.
 * Shows which languages exist (with links) and which are missing.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Globe, Plus, Check, ExternalLink } from 'lucide-react';
import { Button, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@netrun-cms/ui';
import { api } from '../lib/api';
const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
    { code: 'it', name: 'Italian' },
    { code: 'nl', name: 'Dutch' },
    { code: 'ru', name: 'Russian' },
    { code: 'sv', name: 'Swedish' },
    { code: 'pl', name: 'Polish' },
];
export function LanguageSelector({ siteId, pageId, currentLanguage }) {
    const [translations, setTranslations] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedLang, setSelectedLang] = useState('');
    const [error, setError] = useState(null);
    const existingLanguages = new Set(translations.map((t) => t.language));
    const missingLanguages = SUPPORTED_LANGUAGES.filter((l) => !existingLanguages.has(l.code));
    useEffect(() => {
        if (!siteId || !pageId)
            return;
        loadTranslations();
    }, [siteId, pageId]);
    async function loadTranslations() {
        try {
            const res = await api.get('/sites/' + siteId + '/pages/' + pageId + '/translations');
            setTranslations(res.data || []);
        }
        catch {
            // Translations endpoint may fail silently on new pages
        }
    }
    async function handleCreateTranslation() {
        if (!selectedLang)
            return;
        setIsCreating(true);
        setError(null);
        try {
            await api.post('/sites/' + siteId + '/pages/' + pageId + '/translate', {
                language: selectedLang,
            });
            setSelectedLang('');
            await loadTranslations();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create translation');
        }
        finally {
            setIsCreating(false);
        }
    }
    function getLanguageName(code) {
        return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.name || code.toUpperCase();
    }
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm font-medium", children: [_jsx(Globe, { className: "h-4 w-4" }), _jsx("span", { children: "Translations" }), _jsxs(Badge, { variant: "secondary", className: "ml-auto", children: [translations.length, " / ", SUPPORTED_LANGUAGES.length] })] }), _jsx("div", { className: "space-y-1", children: translations.map((t) => (_jsxs("div", { className: "flex items-center justify-between rounded-md px-2 py-1.5 text-sm", children: [_jsxs("div", { className: "flex items-center gap-2", children: [t.language === currentLanguage ? (_jsx(Check, { className: "h-3.5 w-3.5 text-primary" })) : (_jsx("span", { className: "h-3.5 w-3.5" })), _jsx("span", { className: t.language === currentLanguage ? 'font-medium' : '', children: getLanguageName(t.language) }), _jsx(Badge, { variant: t.status === 'published' ? 'default' : 'secondary', className: "text-xs px-1.5 py-0", children: t.status })] }), t.language !== currentLanguage && (_jsx(Button, { variant: "ghost", size: "icon", className: "h-6 w-6", asChild: true, children: _jsx(Link, { to: '/sites/' + siteId + '/pages/' + t.id, children: _jsx(ExternalLink, { className: "h-3.5 w-3.5" }) }) }))] }, t.id))) }), missingLanguages.length > 0 && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(Select, { value: selectedLang, onValueChange: setSelectedLang, children: [_jsx(SelectTrigger, { className: "flex-1 h-8 text-sm", children: _jsx(SelectValue, { placeholder: "Add language..." }) }), _jsx(SelectContent, { children: missingLanguages.map((l) => (_jsxs(SelectItem, { value: l.code, children: [l.name, " (", l.code, ")"] }, l.code))) })] }), _jsxs(Button, { size: "sm", variant: "outline", className: "h-8", disabled: !selectedLang || isCreating, onClick: handleCreateTranslation, children: [_jsx(Plus, { className: "h-3.5 w-3.5 mr-1" }), isCreating ? '...' : 'Add'] })] })), error && (_jsx("p", { className: "text-xs text-destructive", children: error }))] }));
}
//# sourceMappingURL=LanguageSelector.js.map