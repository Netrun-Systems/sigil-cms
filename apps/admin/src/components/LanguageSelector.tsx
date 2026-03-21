/**
 * LanguageSelector Component
 *
 * Displays available translations for a page and allows creating new ones.
 * Shows which languages exist (with links) and which are missing.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Globe, Plus, Check, ExternalLink } from 'lucide-react';
import {
  Button,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@netrun-cms/ui';
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
] as const;

interface Translation {
  id: string;
  language: string;
  title: string;
  status: string;
}

interface LanguageSelectorProps {
  siteId: string;
  pageId: string;
  currentLanguage: string;
}

export function LanguageSelector({ siteId, pageId, currentLanguage }: LanguageSelectorProps) {
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedLang, setSelectedLang] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const existingLanguages = new Set(translations.map((t) => t.language));
  const missingLanguages = SUPPORTED_LANGUAGES.filter((l) => !existingLanguages.has(l.code));

  useEffect(() => {
    if (!siteId || !pageId) return;
    loadTranslations();
  }, [siteId, pageId]);

  async function loadTranslations() {
    try {
      const res = await api.get<{ data: Translation[] }>(
        '/sites/' + siteId + '/pages/' + pageId + '/translations'
      );
      setTranslations(res.data || []);
    } catch {
      // Translations endpoint may fail silently on new pages
    }
  }

  async function handleCreateTranslation() {
    if (!selectedLang) return;
    setIsCreating(true);
    setError(null);
    try {
      await api.post('/sites/' + siteId + '/pages/' + pageId + '/translate', {
        language: selectedLang,
      });
      setSelectedLang('');
      await loadTranslations();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create translation');
    } finally {
      setIsCreating(false);
    }
  }

  function getLanguageName(code: string): string {
    return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.name || code.toUpperCase();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Globe className="h-4 w-4" />
        <span>Translations</span>
        <Badge variant="secondary" className="ml-auto">
          {translations.length} / {SUPPORTED_LANGUAGES.length}
        </Badge>
      </div>

      {/* Existing translations */}
      <div className="space-y-1">
        {translations.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm"
          >
            <div className="flex items-center gap-2">
              {t.language === currentLanguage ? (
                <Check className="h-3.5 w-3.5 text-primary" />
              ) : (
                <span className="h-3.5 w-3.5" />
              )}
              <span className={t.language === currentLanguage ? 'font-medium' : ''}>
                {getLanguageName(t.language)}
              </span>
              <Badge
                variant={t.status === 'published' ? 'default' : 'secondary'}
                className="text-xs px-1.5 py-0"
              >
                {t.status}
              </Badge>
            </div>
            {t.language !== currentLanguage && (
              <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                <Link to={'/sites/' + siteId + '/pages/' + t.id}>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Add translation */}
      {missingLanguages.length > 0 && (
        <div className="flex items-center gap-2">
          <Select value={selectedLang} onValueChange={setSelectedLang}>
            <SelectTrigger className="flex-1 h-8 text-sm">
              <SelectValue placeholder="Add language..." />
            </SelectTrigger>
            <SelectContent>
              {missingLanguages.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  {l.name} ({l.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            disabled={!selectedLang || isCreating}
            onClick={handleCreateTranslation}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            {isCreating ? '...' : 'Add'}
          </Button>
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
