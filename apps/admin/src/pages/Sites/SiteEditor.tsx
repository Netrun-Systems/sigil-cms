import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Globe,
  Save,
  Trash2,
  ExternalLink,
  ArrowLeft,
  Settings,
  FileText,
  Image,
  Palette,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Textarea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Separator,
  cn,
} from '@netrun-cms/ui';
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { usePermissions } from '../../hooks/usePermissions';
import { DomainManager } from '../../components/DomainManager';

interface SiteFormData {
  name: string;
  slug: string;
  domain: string;
  defaultLanguage: string;
  status: 'draft' | 'published' | 'archived';
  description: string;
  favicon: string;
  logo: string;
  logoDark: string;
  googleAnalyticsId: string;
  metaTitle: string;
  metaDescription: string;
}

const defaultFormData: SiteFormData = {
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

  const [formData, setFormData] = useState<SiteFormData>(defaultFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!siteId) return;
    api.get<{ data: Record<string, unknown> }>('/sites/' + siteId).then((res) => {
      const s = res.data;
      const settings = (s.settings || {}) as Record<string, string>;
      setFormData({
        name: (s.name as string) || '',
        slug: (s.slug as string) || '',
        domain: (s.domain as string) || '',
        defaultLanguage: (s.defaultLanguage as string) || 'en',
        status: (s.status as SiteFormData['status']) || 'draft',
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

  const handleChange = (field: keyof SiteFormData, value: string) => {
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
      } else {
        const res = await api.post<{ data: { id: string } }>('/sites', payload);
        navigate('/sites/' + res.data.id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this site?')) {
      try {
        await api.delete('/sites/' + siteId);
        navigate('/sites');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Delete failed');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isEditing ? formData.name : 'Create New Site'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing
                ? 'Manage site settings and configuration'
                : 'Set up a new website'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!canEdit && (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              View Only
            </span>
          )}
          {isEditing && canDelete && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving || !canEdit}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Quick Links for existing site */}
      {isEditing && (
        <div className="flex gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/sites/${siteId}/pages`}>
              <FileText className="mr-2 h-4 w-4" />
              Pages
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/sites/${siteId}/media`}>
              <Image className="mr-2 h-4 w-4" />
              Media
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/sites/${siteId}/themes`}>
              <Palette className="mr-2 h-4 w-4" />
              Theme
            </Link>
          </Button>
          {formData.domain && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={`https://${formData.domain}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View Site
              </a>
            </Button>
          )}
        </div>
      )}

      {/* Form Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          {isEditing && <TabsTrigger value="domain">Domain</TabsTrigger>}
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Site Information</CardTitle>
              <CardDescription>
                Basic information about your website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Site Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="My Awesome Site"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleChange('slug', e.target.value)}
                    placeholder="my-awesome-site"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used in URLs and internal references
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="A brief description of your site"
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="domain">Custom Domain</Label>
                  <Input
                    id="domain"
                    value={formData.domain}
                    onChange={(e) => handleChange('domain', e.target.value)}
                    placeholder="example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Default Language</Label>
                  <Select
                    value={formData.defaultLanguage}
                    onValueChange={(value) => handleChange('defaultLanguage', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    handleChange('status', value as SiteFormData['status'])
                  }
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>
                Logo and visual identity for your site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="favicon">Favicon URL</Label>
                <Input
                  id="favicon"
                  value={formData.favicon}
                  onChange={(e) => handleChange('favicon', e.target.value)}
                  placeholder="/favicon.ico"
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 32x32 or 16x16 PNG or ICO file
                </p>
              </div>

              <Separator />

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo (Light Mode)</Label>
                  <div className="flex items-center gap-4">
                    {formData.logo && (
                      <div className="flex h-16 w-32 items-center justify-center rounded-lg border bg-white p-2">
                        <img
                          src={formData.logo}
                          alt="Logo preview"
                          className="max-h-full max-w-full"
                        />
                      </div>
                    )}
                    <Input
                      id="logo"
                      value={formData.logo}
                      onChange={(e) => handleChange('logo', e.target.value)}
                      placeholder="/logo.svg"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logoDark">Logo (Dark Mode)</Label>
                  <div className="flex items-center gap-4">
                    {formData.logoDark && (
                      <div className="flex h-16 w-32 items-center justify-center rounded-lg border bg-gray-900 p-2">
                        <img
                          src={formData.logoDark}
                          alt="Dark logo preview"
                          className="max-h-full max-w-full"
                        />
                      </div>
                    )}
                    <Input
                      id="logoDark"
                      value={formData.logoDark}
                      onChange={(e) => handleChange('logoDark', e.target.value)}
                      placeholder="/logo-dark.svg"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>
                Search engine optimization defaults for your site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Default Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={formData.metaTitle}
                  onChange={(e) => handleChange('metaTitle', e.target.value)}
                  placeholder="Your Site Name - Tagline"
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.metaTitle.length}/60 characters (recommended)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaDescription">Default Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={formData.metaDescription}
                  onChange={(e) => handleChange('metaDescription', e.target.value)}
                  placeholder="A compelling description of your site for search results"
                  rows={3}
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.metaDescription.length}/160 characters (recommended)
                </p>
              </div>

              <Separator />

              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="mb-2 text-sm font-medium">Search Preview</p>
                <div className="space-y-1">
                  <p className="text-lg text-blue-600 hover:underline">
                    {formData.metaTitle || 'Your Site Title'}
                  </p>
                  <p className="text-sm text-green-700">
                    {formData.domain || 'example.com'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formData.metaDescription ||
                      'Your meta description will appear here...'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics & Tracking</CardTitle>
              <CardDescription>
                Configure analytics and tracking services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="googleAnalyticsId">Google Analytics ID</Label>
                <Input
                  id="googleAnalyticsId"
                  value={formData.googleAnalyticsId}
                  onChange={(e) =>
                    handleChange('googleAnalyticsId', e.target.value)
                  }
                  placeholder="G-XXXXXXXXXX or UA-XXXXXXXX-X"
                />
                <p className="text-xs text-muted-foreground">
                  Your Google Analytics 4 or Universal Analytics tracking ID
                </p>
              </div>

              <Separator />

              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Cookie Consent Banner</p>
                    <p className="text-sm text-muted-foreground">
                      Show a GDPR-compliant cookie consent banner
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Domain Tab */}
        {isEditing && siteId && (
          <TabsContent value="domain" className="space-y-6">
            <DomainManager
              siteId={siteId}
              currentDomain={formData.domain}
              onDomainChange={(d) => setFormData((prev) => ({ ...prev, domain: d }))}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
