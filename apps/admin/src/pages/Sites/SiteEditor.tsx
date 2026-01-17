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
import { useState } from 'react';

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

  // Mock data for existing site
  const existingSite: SiteFormData | null = isEditing
    ? {
        name: 'Netrun Systems',
        slug: 'netrun-systems',
        domain: 'netrunsystems.com',
        defaultLanguage: 'en',
        status: 'published',
        description: 'Netrun Systems corporate website',
        favicon: '/favicon.ico',
        logo: '/logo.svg',
        logoDark: '/logo-dark.svg',
        googleAnalyticsId: 'G-XXXXXXXXXX',
        metaTitle: 'Netrun Systems - Cloud Infrastructure & DevSecOps',
        metaDescription:
          'Netrun Systems provides enterprise cloud infrastructure, DevSecOps, and multi-tenant management platforms.',
      }
    : null;

  const [formData, setFormData] = useState<SiteFormData>(
    existingSite || defaultFormData
  );
  const [isSaving, setIsSaving] = useState(false);

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
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    if (!isEditing) {
      navigate('/sites');
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this site?')) {
      // Delete site
      navigate('/sites');
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
          {isEditing && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

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
      </Tabs>
    </div>
  );
}
