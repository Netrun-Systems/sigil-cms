import { useParams, Link } from 'react-router-dom';
import {
  Image,
  Video,
  FileText,
  File,
  Upload,
  Search,
  LayoutGrid,
  List,
  Trash2,
  Download,
  Copy,
  Eye,
  X,
  FolderPlus,
  ArrowLeft,
  Check,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  cn,
} from '@netrun-cms/ui';
import { useState } from 'react';

interface MediaFile {
  id: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  url: string;
  thumbnailUrl?: string;
  altText?: string;
  folder: string;
  width?: number;
  height?: number;
  createdAt: string;
}

const mockMedia: MediaFile[] = [
  {
    id: '1',
    filename: 'hero-banner.jpg',
    originalFilename: 'hero-banner.jpg',
    mimeType: 'image/jpeg',
    fileSize: 245000,
    url: '/uploads/hero-banner.jpg',
    thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300',
    altText: 'Hero banner image',
    folder: 'banners',
    width: 1920,
    height: 1080,
    createdAt: '2026-01-15',
  },
  {
    id: '2',
    filename: 'logo.svg',
    originalFilename: 'netrun-logo.svg',
    mimeType: 'image/svg+xml',
    fileSize: 4500,
    url: '/uploads/logo.svg',
    thumbnailUrl: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300',
    altText: 'Company logo',
    folder: 'branding',
    createdAt: '2026-01-10',
  },
  {
    id: '3',
    filename: 'team-photo.jpg',
    originalFilename: 'team-photo.jpg',
    mimeType: 'image/jpeg',
    fileSize: 890000,
    url: '/uploads/team-photo.jpg',
    thumbnailUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300',
    altText: 'Team photo',
    folder: 'about',
    width: 2400,
    height: 1600,
    createdAt: '2026-01-08',
  },
  {
    id: '4',
    filename: 'product-demo.mp4',
    originalFilename: 'product-demo.mp4',
    mimeType: 'video/mp4',
    fileSize: 15000000,
    url: '/uploads/product-demo.mp4',
    folder: 'videos',
    createdAt: '2026-01-05',
  },
  {
    id: '5',
    filename: 'whitepaper.pdf',
    originalFilename: 'cloud-infrastructure-guide.pdf',
    mimeType: 'application/pdf',
    fileSize: 2500000,
    url: '/uploads/whitepaper.pdf',
    folder: 'documents',
    createdAt: '2026-01-03',
  },
  {
    id: '6',
    filename: 'service-icon-1.png',
    originalFilename: 'cloud-icon.png',
    mimeType: 'image/png',
    fileSize: 12000,
    url: '/uploads/service-icon-1.png',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=300',
    altText: 'Cloud service icon',
    folder: 'icons',
    width: 256,
    height: 256,
    createdAt: '2025-12-28',
  },
  {
    id: '7',
    filename: 'office-photo.jpg',
    originalFilename: 'office-photo.jpg',
    mimeType: 'image/jpeg',
    fileSize: 456000,
    url: '/uploads/office-photo.jpg',
    thumbnailUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300',
    altText: 'Office photo',
    folder: 'about',
    width: 1800,
    height: 1200,
    createdAt: '2025-12-20',
  },
  {
    id: '8',
    filename: 'case-study-banner.jpg',
    originalFilename: 'case-study-banner.jpg',
    mimeType: 'image/jpeg',
    fileSize: 320000,
    url: '/uploads/case-study-banner.jpg',
    thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300',
    altText: 'Case study banner',
    folder: 'banners',
    width: 1600,
    height: 900,
    createdAt: '2025-12-15',
  },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.startsWith('video/')) return Video;
  if (mimeType === 'application/pdf') return FileText;
  return File;
}

function MediaCard({
  file,
  isSelected,
  onSelect,
  onDelete,
  viewMode,
}: {
  file: MediaFile;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  viewMode: 'grid' | 'list';
}) {
  const [showPreview, setShowPreview] = useState(false);
  const Icon = getFileIcon(file.mimeType);
  const isImage = file.mimeType.startsWith('image/');
  const isVideo = file.mimeType.startsWith('video/');

  if (viewMode === 'list') {
    return (
      <div
        className={cn(
          'group flex items-center gap-4 rounded-lg border p-3 transition-all hover:bg-accent/50',
          isSelected && 'border-primary bg-primary/5'
        )}
      >
        <button
          onClick={onSelect}
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded border',
            isSelected
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border'
          )}
        >
          {isSelected && <Check className="h-3 w-3" />}
        </button>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
          {isImage && file.thumbnailUrl ? (
            <img
              src={file.thumbnailUrl}
              alt={file.altText || file.filename}
              className="h-full w-full rounded-lg object-cover"
            />
          ) : (
            <Icon className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate font-medium">{file.filename}</p>
          <p className="text-sm text-muted-foreground">
            {formatFileSize(file.fileSize)}
            {file.width && file.height && ` - ${file.width}x${file.height}`}
          </p>
        </div>
        <Badge variant="secondary" className="capitalize">
          {file.folder}
        </Badge>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {(isImage || isVideo) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowPreview(true)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigator.clipboard.writeText(file.url)}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          'group relative aspect-square cursor-pointer overflow-hidden rounded-lg border bg-muted transition-all hover:border-primary',
          isSelected && 'border-primary ring-2 ring-primary/20'
        )}
        onClick={onSelect}
      >
        {isImage && file.thumbnailUrl ? (
          <img
            src={file.thumbnailUrl}
            alt={file.altText || file.filename}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4">
            <Icon className="h-10 w-10 text-muted-foreground" />
            <p className="truncate text-center text-xs text-muted-foreground">
              {file.filename}
            </p>
          </div>
        )}
        {/* Selection indicator */}
        <div
          className={cn(
            'absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors',
            isSelected
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-white/50 bg-black/20 opacity-0 group-hover:opacity-100'
          )}
        >
          {isSelected && <Check className="h-3 w-3" />}
        </div>
        {/* Actions */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
          {(isImage || isVideo) && (
            <Button
              variant="secondary"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                setShowPreview(true);
              }}
            >
              <Eye className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="secondary"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(file.url);
            }}
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="destructive"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Preview Dialog */}
      {showPreview && (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{file.filename}</DialogTitle>
              <DialogDescription>
                {formatFileSize(file.fileSize)}
                {file.width && file.height && ` - ${file.width}x${file.height}`}
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center bg-muted rounded-lg p-4">
              {isImage && (
                <img
                  src={file.thumbnailUrl || file.url}
                  alt={file.altText || file.filename}
                  className="max-h-[60vh] object-contain"
                />
              )}
              {isVideo && (
                <video
                  src={file.url}
                  controls
                  className="max-h-[60vh]"
                />
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Close
              </Button>
              <Button onClick={() => navigator.clipboard.writeText(file.url)}>
                <Copy className="mr-2 h-4 w-4" />
                Copy URL
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export function MediaLibrary() {
  const { siteId } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const folders = [...new Set(mockMedia.map((m) => m.folder))];

  const filteredMedia = mockMedia.filter((file) => {
    const matchesSearch =
      file.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.originalFilename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.altText?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFolder = !selectedFolder || file.folder === selectedFolder;

    const matchesType =
      !selectedType ||
      (selectedType === 'image' && file.mimeType.startsWith('image/')) ||
      (selectedType === 'video' && file.mimeType.startsWith('video/')) ||
      (selectedType === 'document' &&
        (file.mimeType === 'application/pdf' ||
          file.mimeType.startsWith('application/')));

    return matchesSearch && matchesFolder && matchesType;
  });

  const handleSelect = (fileId: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  };

  const handleDelete = (fileId: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      // Delete file
      setSelectedFiles((prev) => {
        const next = new Set(prev);
        next.delete(fileId);
        return next;
      });
    }
  };

  const handleDeleteSelected = () => {
    if (
      confirm(`Are you sure you want to delete ${selectedFiles.size} files?`)
    ) {
      // Delete files
      setSelectedFiles(new Set());
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {siteId && (
            <Button variant="ghost" size="icon" asChild>
              <Link to={`/sites/${siteId}`}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
            <p className="text-muted-foreground">
              {siteId ? 'Manage media for this site' : 'Manage all media files'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedFiles.size > 0 && (
            <Button variant="destructive" onClick={handleDeleteSelected}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete ({selectedFiles.size})
            </Button>
          )}
          <Button onClick={() => setShowUploadDialog(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Files
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={selectedFolder || 'all'}
                onValueChange={(v) => setSelectedFolder(v === 'all' ? null : v)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All folders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All folders</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder} value={folder} className="capitalize">
                      {folder}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedType || 'all'}
                onValueChange={(v) => setSelectedType(v === 'all' ? null : v)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Media Grid/List */}
      {filteredMedia.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredMedia.map((file) => (
              <MediaCard
                key={file.id}
                file={file}
                isSelected={selectedFiles.has(file.id)}
                onSelect={() => handleSelect(file.id)}
                onDelete={() => handleDelete(file.id)}
                viewMode={viewMode}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-4 space-y-2">
              {filteredMedia.map((file) => (
                <MediaCard
                  key={file.id}
                  file={file}
                  isSelected={selectedFiles.has(file.id)}
                  onSelect={() => handleSelect(file.id)}
                  onDelete={() => handleDelete(file.id)}
                  viewMode={viewMode}
                />
              ))}
            </CardContent>
          </Card>
        )
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Image className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No files found</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {searchQuery || selectedFolder || selectedType
                ? 'Try adjusting your search or filter criteria.'
                : 'Upload your first file to get started.'}
            </p>
            {!searchQuery && !selectedFolder && !selectedType && (
              <Button className="mt-4" onClick={() => setShowUploadDialog(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Files
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
            <DialogDescription>
              Drag and drop files or click to browse
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-sm font-medium">
              Drag and drop files here, or click to browse
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              PNG, JPG, GIF, SVG, PDF, MP4 up to 50MB
            </p>
            <Button className="mt-4">
              <Upload className="mr-2 h-4 w-4" />
              Select Files
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Upload to folder</Label>
            <Select defaultValue="uploads">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {folders.map((folder) => (
                  <SelectItem key={folder} value={folder} className="capitalize">
                    {folder}
                  </SelectItem>
                ))}
                <SelectItem value="new">
                  <span className="flex items-center gap-2">
                    <FolderPlus className="h-4 w-4" />
                    New folder...
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button>Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Label({ children, ...props }: { children: React.ReactNode }) {
  return (
    <label className="text-sm font-medium" {...props}>
      {children}
    </label>
  );
}
