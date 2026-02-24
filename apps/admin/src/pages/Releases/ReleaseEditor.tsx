import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  KeyValueEditor, ImagePreview,
} from '@netrun-cms/ui';
import { EMBED_PLATFORM, RELEASE_TYPE } from '@netrun-cms/core';
import { api } from '../../lib/api';

interface ReleaseForm {
  title: string;
  type: string;
  releaseDate: string;
  coverUrl: string;
  embedUrl: string;
  embedPlatform: string;
  description: string;
  streamLinks: Record<string, string>;
  isPublished: boolean;
}

const emptyForm: ReleaseForm = {
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

  const [form, setForm] = useState<ReleaseForm>(emptyForm);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api.get<{ data: ReleaseForm }>(`${basePath}/releases/${id}`)
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

  const update = <K extends keyof ReleaseForm>(key: K, value: ReleaseForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (isNew) {
        await api.post(`${basePath}/releases`, form);
      } else {
        await api.put(`${basePath}/releases/${id}`, form);
      }
      navigate(listPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(listPath)} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-semibold">{isNew ? 'New Release' : 'Edit Release'}</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !form.title.trim()}
          className="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
              <CardDescription>Basic release information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                  placeholder="Release title"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => update('type', e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {typeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Release Date</label>
                  <input
                    type="date"
                    value={form.releaseDate}
                    onChange={(e) => update('releaseDate', e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  placeholder="Optional description..."
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Embed</CardTitle>
              <CardDescription>Player embed for the release page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Platform</label>
                <select
                  value={form.embedPlatform}
                  onChange={(e) => update('embedPlatform', e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {platformOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Embed URL</label>
                <input
                  value={form.embedUrl}
                  onChange={(e) => update('embedUrl', e.target.value)}
                  placeholder="https://open.spotify.com/embed/..."
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stream Links</CardTitle>
              <CardDescription>Links to streaming platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <KeyValueEditor
                entries={form.streamLinks}
                onChange={(v) => update('streamLinks', v)}
                keyPlaceholder="Platform (e.g. spotify)"
                valuePlaceholder="URL"
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Published</label>
                  <p className="text-xs text-muted-foreground">Make this release visible on the site</p>
                </div>
                <button
                  role="switch"
                  aria-checked={form.isPublished}
                  onClick={() => update('isPublished', !form.isPublished)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${
                    form.isPublished ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      form.isPublished ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cover Art</CardTitle>
            </CardHeader>
            <CardContent>
              <ImagePreview url={form.coverUrl} onChange={(v) => update('coverUrl', v)} placeholder="https://..." />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
