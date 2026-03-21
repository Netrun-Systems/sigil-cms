import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Save,
  Trash2,
  Eye,
  ArrowLeft,
  Settings,
  Plus,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Copy,
  X,
  Type,
  Image,
  Video,
  LayoutGrid,
  MessageSquare,
  Star,
  HelpCircle,
  Code,
  Mail,
  BarChart,
  Clock,
  Calendar,
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
  Badge,
  cn,
} from '@netrun-cms/ui';
import { useState, useEffect } from 'react';
import type { BlockType } from '@netrun-cms/core';
import { api } from '../../lib/api';
import { BlockContentEditor } from '../../components/BlockContentEditor';
import { LanguageSelector } from '../../components/LanguageSelector';
import { RevisionHistory } from '../../components/RevisionHistory';
import { usePermissions } from '../../hooks/usePermissions';

interface ContentBlock {
  id: string;
  type: BlockType;
  content: Record<string, unknown>;
  isVisible: boolean;
}

interface PageFormData {
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  template: string;
  parentId: string | null;
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string;
}

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
] as const;

const defaultFormData: PageFormData = {
  title: '',
  slug: '',
  status: 'draft',
  template: 'default',
  parentId: null,
  metaTitle: '',
  metaDescription: '',
  ogImageUrl: '',
};

/** Convert an ISO date string to a local datetime-local input value */
function toLocalDatetime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Format a remaining duration for countdown display */
function formatCountdown(targetDate: string): string {
  const target = new Date(targetDate);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return 'now';
  const hours = Math.floor(diffMs / 3_600_000);
  const minutes = Math.floor((diffMs % 3_600_000) / 60_000);
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `in ${days}d ${hours % 24}h`;
  }
  return `in ${hours}h ${minutes}m`;
}

function BlockPreview({ block, isSelected, onEdit, onDelete, onToggleVisibility, onMoveUp, onMoveDown }: {
  block: ContentBlock;
  isSelected?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const blockType = blockTypes.find((b) => b.type === block.type);
  const Icon = blockType?.icon || Type;

  return (
    <div
      className={cn(
        'group relative rounded-lg border bg-card transition-all hover:border-primary',
        isSelected && 'border-primary ring-1 ring-primary',
        !block.isVisible && 'opacity-50'
      )}
    >
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={onEdit}>
        <div className="cursor-grab">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            'bg-primary/10 text-primary'
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-medium">{blockType?.label || block.type}</p>
          <p className="text-sm text-muted-foreground">
            {blockType?.description || 'Content block'}
          </p>
        </div>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
          >
            {block.isVisible ? (
              <Eye className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function AddBlockButton({ onAdd }: { onAdd: (type: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="w-full border-dashed"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Block
      </Button>
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-lg border bg-popover p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-medium">Choose Block Type</p>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {blockTypes.map((blockType) => (
              <button
                key={blockType.type}
                onClick={() => {
                  onAdd(blockType.type);
                  setIsOpen(false);
                }}
                className="flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-colors hover:bg-accent"
              >
                <blockType.icon className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{blockType.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function PageEditor() {
  const { siteId, pageId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(pageId);
  const { canEdit, canDelete, canPublish } = usePermissions();

  const [formData, setFormData] = useState<PageFormData>(defaultFormData);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [error, setError] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [pageLanguage, setPageLanguage] = useState<string>('en');
  const [publishAt, setPublishAt] = useState<string>('');
  const [unpublishAt, setUnpublishAt] = useState<string>('');
  const [showSchedulePanel, setShowSchedulePanel] = useState(false);

  const handleBlockContentChange = (blockId: string, content: Record<string, unknown>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, content } : b))
    );
  };

  useEffect(() => {
    if (!siteId || !pageId) return;
    // Load page data
    api.get<{ data: Record<string, unknown> }>('/sites/' + siteId + '/pages/' + pageId).then((res) => {
      const p = res.data;
      const seo = (p.seo || {}) as Record<string, string>;
      setFormData({
        title: (p.title as string) || '',
        slug: (p.slug as string) || '',
        status: (p.status as PageFormData['status']) || 'draft',
        template: (p.template as string) || 'default',
        parentId: (p.parentId as string) || null,
        metaTitle: seo.metaTitle || (p.metaTitle as string) || '',
        metaDescription: seo.metaDescription || (p.metaDescription as string) || '',
        ogImageUrl: seo.ogImageUrl || (p.ogImageUrl as string) || '',
      });
      setPageLanguage((p.language as string) || 'en');
      // Load schedule fields
      if (p.publishAt) {
        setPublishAt(toLocalDatetime(p.publishAt as string));
      }
      if (p.unpublishAt) {
        setUnpublishAt(toLocalDatetime(p.unpublishAt as string));
      }
    }).catch((err) => setError(err.message));

    // Load blocks
    api.get<{ data: Array<Record<string, unknown>> }>('/sites/' + siteId + '/pages/' + pageId + '/blocks').then((res) => {
      const loaded = (res.data || []).map((b) => ({
        id: b.id as string,
        type: (b.blockType as BlockType) || (b.type as BlockType),
        content: (b.content as Record<string, unknown>) || {},
        isVisible: b.isVisible !== false,
      }));
      setBlocks(loaded);
    }).catch((err) => setError(err.message));
  }, [siteId, pageId]);

  const handleChange = (field: keyof PageFormData, value: string | null) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      // Auto-generate slug from title if creating new page
      ...(field === 'title' && !isEditing
        ? {
            slug: (value as string)
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, ''),
          }
        : {}),
    }));
  };

  const handleAddBlock = (type: string) => {
    const newBlock: ContentBlock = {
      id: Date.now().toString(),
      type: type as BlockType,
      content: {},
      isVisible: true,
    };
    setBlocks((prev) => [...prev, newBlock]);
  };

  const handleDeleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleToggleBlockVisibility = (id: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isVisible: !b.isVisible } : b))
    );
  };

  const handleMoveBlock = (id: string, direction: 'up' | 'down') => {
    setBlocks((prev) => {
      const index = prev.findIndex((b) => b.id === id);
      if (
        (direction === 'up' && index === 0) ||
        (direction === 'down' && index === prev.length - 1)
      ) {
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
    setError(null);
    try {
      const pagePayload = {
        title: formData.title,
        slug: formData.slug,
        status: formData.status,
        template: formData.template,
        parentId: formData.parentId,
        seo: {
          metaTitle: formData.metaTitle,
          metaDescription: formData.metaDescription,
          ogImageUrl: formData.ogImageUrl,
        },
      };

      let savedPageId = pageId;

      if (isEditing) {
        await api.put('/sites/' + siteId + '/pages/' + pageId, pagePayload);
      } else {
        const res = await api.post<{ data: { id: string } }>('/sites/' + siteId + '/pages', pagePayload);
        savedPageId = res.data.id;
      }

      // Save blocks
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const blockPayload = {
          blockType: block.type,
          content: block.content,
          sortOrder: i,
          isVisible: block.isVisible,
        };
        // Existing blocks have UUID ids, new ones have timestamp ids
        const isExistingBlock = block.id.includes('-');
        if (isExistingBlock) {
          await api.put('/sites/' + siteId + '/pages/' + savedPageId + '/blocks/' + block.id, blockPayload);
        } else {
          const res = await api.post<{ data: { id: string } }>('/sites/' + siteId + '/pages/' + savedPageId + '/blocks', blockPayload);
          block.id = res.data.id;
        }
      }

      if (!isEditing && savedPageId) {
        navigate('/sites/' + siteId + '/pages/' + savedPageId);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSchedule = async () => {
    if (!siteId || !pageId) return;
    setIsScheduling(true);
    setError(null);
    try {
      // Save the page first to persist any pending changes
      await handleSave();

      const body: Record<string, string | null> = {};
      if (publishAt) {
        body.publishAt = new Date(publishAt).toISOString();
      } else {
        body.publishAt = null;
      }
      if (unpublishAt) {
        body.unpublishAt = new Date(unpublishAt).toISOString();
      } else {
        body.unpublishAt = null;
      }

      const res = await api.patch<{ data: Record<string, unknown> }>(
        '/sites/' + siteId + '/pages/' + pageId + '/schedule',
        body
      );
      const updated = res.data;
      setFormData((prev) => ({
        ...prev,
        status: (updated.status as PageFormData['status']) || prev.status,
      }));
      setShowSchedulePanel(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Schedule failed');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleClearSchedule = async () => {
    if (!siteId || !pageId) return;
    setIsScheduling(true);
    setError(null);
    try {
      const res = await api.patch<{ data: Record<string, unknown> }>(
        '/sites/' + siteId + '/pages/' + pageId + '/schedule',
        { publishAt: null, unpublishAt: null }
      );
      const updated = res.data;
      setFormData((prev) => ({
        ...prev,
        status: (updated.status as PageFormData['status']) || prev.status,
      }));
      setPublishAt('');
      setUnpublishAt('');
      setShowSchedulePanel(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Clear schedule failed');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this page?')) {
      try {
        await api.delete('/sites/' + siteId + '/pages/' + pageId);
        navigate('/sites/' + siteId + '/pages');
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
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/sites/${siteId}/pages`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isEditing ? formData.title : 'Create New Page'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? 'Edit page content and settings' : 'Add a new page to your site'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!canEdit && (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              View Only
            </span>
          )}
          {isEditing && (
            <>
              <Button variant="outline">
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              {canDelete && (
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
            </>
          )}
          {isEditing && canPublish && (
            <Button
              variant="outline"
              onClick={() => setShowSchedulePanel(!showSchedulePanel)}
            >
              <Clock className="mr-2 h-4 w-4" />
              Schedule
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving || !canEdit}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Main Editor Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Content Editor - Main Area */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="content">Content Blocks</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>

            {/* Content Blocks Tab */}
            <TabsContent value="content" className="space-y-4 mt-4">
              {blocks.length > 0 ? (
                <div className="space-y-3">
                  {blocks.map((block) => (
                    <div key={block.id}>
                      <BlockPreview
                        block={block}
                        isSelected={selectedBlockId === block.id}
                        onEdit={() =>
                          setSelectedBlockId(
                            selectedBlockId === block.id ? null : block.id
                          )
                        }
                        onDelete={() => {
                          handleDeleteBlock(block.id);
                          if (selectedBlockId === block.id) setSelectedBlockId(null);
                        }}
                        onToggleVisibility={() => handleToggleBlockVisibility(block.id)}
                        onMoveUp={() => handleMoveBlock(block.id, 'up')}
                        onMoveDown={() => handleMoveBlock(block.id, 'down')}
                      />
                      {selectedBlockId === block.id && (
                        <Card className="mt-2 border-primary/30">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">
                                Edit {blockTypes.find((b) => b.type === block.type)?.label || block.type} Content
                              </CardTitle>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setSelectedBlockId(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <BlockContentEditor
                              blockType={block.type}
                              content={block.content}
                              onChange={(content) => handleBlockContentChange(block.id, content)}
                            />
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                      <LayoutGrid className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">No content blocks yet</h3>
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                      Start building your page by adding content blocks
                    </p>
                  </CardContent>
                </Card>
              )}
              <AddBlockButton onAdd={handleAddBlock} />
            </TabsContent>

            {/* SEO Tab */}
            <TabsContent value="seo" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>SEO Settings</CardTitle>
                  <CardDescription>
                    Search engine optimization for this page
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="metaTitle">Meta Title</Label>
                    <Input
                      id="metaTitle"
                      value={formData.metaTitle}
                      onChange={(e) => handleChange('metaTitle', e.target.value)}
                      placeholder={formData.title || 'Page Title'}
                      maxLength={60}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.metaTitle.length}/60 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="metaDescription">Meta Description</Label>
                    <Textarea
                      id="metaDescription"
                      value={formData.metaDescription}
                      onChange={(e) => handleChange('metaDescription', e.target.value)}
                      placeholder="A compelling description for search results"
                      rows={3}
                      maxLength={160}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.metaDescription.length}/160 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ogImageUrl">Social Image URL</Label>
                    <Input
                      id="ogImageUrl"
                      value={formData.ogImageUrl}
                      onChange={(e) => handleChange('ogImageUrl', e.target.value)}
                      placeholder="/images/og-image.jpg"
                    />
                    <p className="text-xs text-muted-foreground">
                      Image shown when shared on social media (1200x630px recommended)
                    </p>
                  </div>

                  <Separator />

                  <div className="rounded-lg border bg-muted/50 p-4">
                    <p className="mb-2 text-sm font-medium">Search Preview</p>
                    <div className="space-y-1">
                      <p className="text-lg text-blue-600 hover:underline">
                        {formData.metaTitle || formData.title || 'Page Title'}
                      </p>
                      <p className="text-sm text-green-700">
                        netrunsystems.com/{formData.slug || 'page-slug'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formData.metaDescription || 'Meta description will appear here...'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - Page Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Page Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Page Title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground">/</span>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleChange('slug', e.target.value)}
                    placeholder="page-slug"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    handleChange('status', value as PageFormData['status'])
                  }
                  disabled={!canPublish}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                {!canPublish && (
                  <p className="text-xs text-muted-foreground">
                    Only admins and editors can change publish status
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="template">Template</Label>
                <Select
                  value={formData.template}
                  onValueChange={(value) => handleChange('template', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="landing">Landing Page</SelectItem>
                    <SelectItem value="blog">Blog</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="contact">Contact</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parent">Parent Page</Label>
                <Select
                  value={formData.parentId || 'none'}
                  onValueChange={(value) =>
                    handleChange('parentId', value === 'none' ? null : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No parent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No parent (root level)</SelectItem>
                    <SelectItem value="services">Services</SelectItem>
                    <SelectItem value="about">About</SelectItem>
                    <SelectItem value="blog">Blog</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Content Scheduling */}
          {showSchedulePanel && isEditing && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Content Schedule
                </CardTitle>
                <CardDescription>
                  Automatically publish or unpublish this page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.status === 'scheduled' && publishAt && (
                  <div className="rounded-lg bg-primary/10 p-3 text-sm">
                    <div className="flex items-center gap-2 font-medium text-primary">
                      <Clock className="h-4 w-4" />
                      Scheduled to publish {formatCountdown(publishAt)}
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      {new Date(publishAt).toLocaleString()}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="publishAt">Publish At</Label>
                  <Input
                    id="publishAt"
                    type="datetime-local"
                    value={publishAt}
                    onChange={(e) => setPublishAt(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to publish manually
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unpublishAt">Unpublish At (optional)</Label>
                  <Input
                    id="unpublishAt"
                    type="datetime-local"
                    value={unpublishAt}
                    onChange={(e) => setUnpublishAt(e.target.value)}
                    min={publishAt || undefined}
                  />
                  <p className="text-xs text-muted-foreground">
                    Page will be archived at this time
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSchedule}
                    disabled={isScheduling || !publishAt}
                    className="flex-1"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {isScheduling ? 'Scheduling...' : 'Set Schedule'}
                  </Button>
                  {(formData.status === 'scheduled' || publishAt || unpublishAt) && (
                    <Button
                      variant="outline"
                      onClick={handleClearSchedule}
                      disabled={isScheduling}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Block Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Content Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Blocks</span>
                  <Badge variant="secondary">{blocks.length}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Visible Blocks</span>
                  <Badge variant="secondary">
                    {blocks.filter((b) => b.isVisible).length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Hidden Blocks</span>
                  <Badge variant="secondary">
                    {blocks.filter((b) => !b.isVisible).length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Language / Translations */}
          {isEditing && siteId && pageId && (
            <Card>
              <CardHeader>
                <CardTitle>Languages</CardTitle>
              </CardHeader>
              <CardContent>
                <LanguageSelector
                  siteId={siteId}
                  pageId={pageId}
                  currentLanguage={pageLanguage}
                />
              </CardContent>
            </Card>
          )}

          {/* Revision History */}
          {isEditing && siteId && pageId && (
            <RevisionHistory
              siteId={siteId}
              pageId={pageId}
              onReverted={() => {
                // Reload page data after revert
                window.location.reload();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
