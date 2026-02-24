import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Save, Loader2 } from 'lucide-react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  TagInput, KeyValueEditor, ImagePreview,
} from '@netrun-cms/ui';
import { api } from '../../lib/api';

interface ProfileForm {
  artistName: string;
  bio: string;
  photoUrl: string;
  genres: string[];
  socialLinks: Record<string, string>;
  bookingEmail: string;
  managementEmail: string;
}

const emptyForm: ProfileForm = {
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

  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get<{ data: ProfileForm }>(`${basePath}/artist-profile`)
      .then((res) => {
        if (res.data) setForm({ ...emptyForm, ...res.data });
      })
      .catch(() => { /* New profile - use empty form */ })
      .finally(() => setLoading(false));
  }, [siteId]);

  const update = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
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
        <h1 className="text-2xl font-semibold">Artist Profile</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}
      {success && (
        <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-500">Profile saved successfully</div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Basic Info</CardTitle>
              <CardDescription>Public artist information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Artist Name</label>
                <input
                  value={form.artistName}
                  onChange={(e) => update('artistName', e.target.value)}
                  placeholder="Stage name"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => update('bio', e.target.value)}
                  placeholder="Artist biography..."
                  rows={6}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                />
              </div>
              <TagInput label="Genres" tags={form.genres} onChange={(v) => update('genres', v)} placeholder="Add genre..." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social Links</CardTitle>
              <CardDescription>Links to social media profiles</CardDescription>
            </CardHeader>
            <CardContent>
              <KeyValueEditor
                entries={form.socialLinks}
                onChange={(v) => update('socialLinks', v)}
                keyPlaceholder="Platform (e.g. instagram)"
                valuePlaceholder="URL"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
              <CardDescription>Booking and management contact info</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Booking Email</label>
                <input
                  type="email"
                  value={form.bookingEmail}
                  onChange={(e) => update('bookingEmail', e.target.value)}
                  placeholder="booking@example.com"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Management Email</label>
                <input
                  type="email"
                  value={form.managementEmail}
                  onChange={(e) => update('managementEmail', e.target.value)}
                  placeholder="mgmt@example.com"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Photo</CardTitle>
            </CardHeader>
            <CardContent>
              <ImagePreview url={form.photoUrl} onChange={(v) => update('photoUrl', v)} placeholder="https://..." />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
