import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mediaApi } from '@/lib/api';
import { toast } from 'sonner';
import { 
  Upload, Loader2, Image, Video, Trash2, Edit2, 
  Eye, EyeOff, GripVertical, Plus, X, Play, FileImage, FileVideo
} from 'lucide-react';

interface MediaItem {
  id: number;
  filename: string;
  original_name: string;
  file_type: 'image' | 'video';
  file_size: number;
  mime_type: string;
  category: string;
  title: string | null;
  description: string | null;
  is_active: number;
  display_order: number;
  url: string;
  uploader_name?: string;
  created_at: string;
}

const CATEGORIES = [
  { value: 'hero', label: 'Hero Section', description: 'Main banner background at the top of the homepage' },
  { value: 'gallery', label: 'Gallery', description: 'Photo gallery section on the homepage' },
  { value: 'products', label: 'Products', description: 'Product cards in the "Our Products" section' },
  { value: 'about', label: 'About / Farm Workers', description: 'Farm worker / team image in the "Why Choose Us" section' },
  { value: 'testimonials', label: 'Testimonials', description: 'Customer review section profile images' },
  { value: 'videos', label: 'Videos', description: 'Video gallery in "See Our Farm in Action" section' },
  { value: 'general', label: 'General', description: 'General media not tied to a specific section' },
];

export function MediaTab() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState('general');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const response = await mediaApi.getAdmin();
      setMedia(response.data);
    } catch (error) {
      toast.error('Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (100MB max)
      if (file.size > 100 * 1024 * 1024) {
        toast.error('File is too large. Maximum size is 100MB.');
        return;
      }
      setUploadFile(file);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error('Please select a file');
      return;
    }

    try {
      setUploading(true);
      await mediaApi.upload(uploadFile, {
        category: uploadCategory,
        title: uploadTitle,
        description: uploadDescription,
      });
      toast.success('Media uploaded successfully!');
      setUploadDialogOpen(false);
      resetUploadForm();
      loadMedia();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to upload media');
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadCategory('general');
    setUploadTitle('');
    setUploadDescription('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpdate = async (mediaItem: MediaItem, updates: { title?: string; description?: string; category?: string; is_active?: number; display_order?: number }) => {
    try {
      await mediaApi.update(mediaItem.id, updates);
      toast.success('Media updated successfully!');
      setEditingMedia(null);
      loadMedia();
    } catch (error) {
      toast.error('Failed to update media');
    }
  };

  const handleDelete = async (mediaItem: MediaItem) => {
    if (!confirm(`Are you sure you want to delete "${mediaItem.title || mediaItem.original_name}"?`)) {
      return;
    }

    try {
      await mediaApi.delete(mediaItem.id);
      toast.success('Media deleted successfully!');
      loadMedia();
    } catch (error) {
      toast.error('Failed to delete media');
    }
  };

  const toggleActive = async (mediaItem: MediaItem) => {
    await handleUpdate(mediaItem, { is_active: mediaItem.is_active ? 0 : 1 });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const filteredMedia = media.filter(m => {
    if (filterCategory !== 'all' && m.category !== filterCategory) return false;
    if (filterType !== 'all' && m.file_type !== filterType) return false;
    return true;
  });

  const images = filteredMedia.filter(m => m.file_type === 'image');
  const videos = filteredMedia.filter(m => m.file_type === 'video');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Media Management</h2>
          <p className="text-gray-600">Upload and manage images and videos for your website</p>
        </div>
        
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700">
              <Upload className="h-4 w-4 mr-2" />
              Upload Media
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload New Media</DialogTitle>
              <DialogDescription>
                Upload images or videos to display on your website
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* File Input */}
              <div className="space-y-2">
                <Label>File</Label>
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    uploadFile ? 'border-amber-500 bg-amber-50' : 'border-gray-300 hover:border-amber-400'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {uploadFile ? (
                    <div className="flex items-center justify-center gap-3">
                      {uploadFile.type.startsWith('image/') ? (
                        <FileImage className="h-8 w-8 text-amber-600" />
                      ) : (
                        <FileVideo className="h-8 w-8 text-amber-600" />
                      )}
                      <div className="text-left">
                        <p className="font-medium text-gray-800">{uploadFile.name}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(uploadFile.size)}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Click to select an image or video</p>
                      <p className="text-xs text-gray-400 mt-1">Max file size: 100MB</p>
                    </>
                  )}
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Website Section <span className="text-red-500">*</span></Label>
                <Select value={uploadCategory} onValueChange={setUploadCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose where this will appear" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{cat.label}</span>
                          <span className="text-xs text-gray-500">{cat.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {uploadCategory && (
                  <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                    📍 {CATEGORIES.find(c => c.value === uploadCategory)?.description}
                  </p>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label>Title (optional)</Label>
                <Input
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Enter a title"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Enter a description"
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={!uploadFile || uploading}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <Label className="text-sm text-gray-600">Section:</Label>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  <span>{cat.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-gray-600">Type:</Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto text-sm text-gray-500">
          {filteredMedia.length} items ({images.length} images, {videos.length} videos)
        </div>
      </div>

      {/* Media Grid */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-2">
            All ({filteredMedia.length})
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Images ({images.length})
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Videos ({videos.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <MediaGrid 
            items={filteredMedia} 
            onEdit={setEditingMedia}
            onDelete={handleDelete}
            onToggleActive={toggleActive}
            onPreview={setPreviewMedia}
            formatFileSize={formatFileSize}
          />
        </TabsContent>

        <TabsContent value="images" className="mt-4">
          <MediaGrid 
            items={images} 
            onEdit={setEditingMedia}
            onDelete={handleDelete}
            onToggleActive={toggleActive}
            onPreview={setPreviewMedia}
            formatFileSize={formatFileSize}
          />
        </TabsContent>

        <TabsContent value="videos" className="mt-4">
          <MediaGrid 
            items={videos} 
            onEdit={setEditingMedia}
            onDelete={handleDelete}
            onToggleActive={toggleActive}
            onPreview={setPreviewMedia}
            formatFileSize={formatFileSize}
          />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editingMedia} onOpenChange={(open) => !open && setEditingMedia(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Media</DialogTitle>
          </DialogHeader>
          {editingMedia && (
            <EditMediaForm
              media={editingMedia}
              onSave={(updates) => handleUpdate(editingMedia, updates)}
              onCancel={() => setEditingMedia(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewMedia} onOpenChange={(open) => !open && setPreviewMedia(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewMedia?.title || previewMedia?.original_name}</DialogTitle>
          </DialogHeader>
          {previewMedia && (
            <div className="flex justify-center">
              {previewMedia.file_type === 'image' ? (
                <img 
                  src={previewMedia.url} 
                  alt={previewMedia.title || 'Preview'} 
                  className="max-h-[70vh] object-contain rounded-lg"
                />
              ) : (
                <video 
                  src={previewMedia.url} 
                  controls 
                  className="max-h-[70vh] rounded-lg"
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Media Grid Component
function MediaGrid({ 
  items, 
  onEdit, 
  onDelete, 
  onToggleActive, 
  onPreview,
  formatFileSize 
}: {
  items: MediaItem[];
  onEdit: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
  onToggleActive: (item: MediaItem) => void;
  onPreview: (item: MediaItem) => void;
  formatFileSize: (bytes: number) => string;
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Image className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No media found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <Card 
          key={item.id} 
          className={`group relative overflow-hidden ${!item.is_active ? 'opacity-60' : ''}`}
        >
          {/* Media Preview */}
          <div 
            className="aspect-video bg-gray-100 cursor-pointer relative"
            onClick={() => onPreview(item)}
          >
            {item.file_type === 'image' ? (
              <img 
                src={item.url} 
                alt={item.title || item.original_name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
                <video src={item.url} className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play className="h-12 w-12 text-white" />
                </div>
              </div>
            )}
            
            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onEdit(item); }}>
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onToggleActive(item); }}>
                {item.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); onDelete(item); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Type badge */}
            <div className="absolute top-2 left-2">
              {item.file_type === 'image' ? (
                <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded">
                  <Image className="h-3 w-3 inline mr-1" />
                  Image
                </span>
              ) : (
                <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded">
                  <Video className="h-3 w-3 inline mr-1" />
                  Video
                </span>
              )}
            </div>

            {/* Active status */}
            {!item.is_active && (
              <div className="absolute top-2 right-2">
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded">
                  Hidden
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <CardContent className="p-3">
            <p className="font-medium text-sm truncate" title={item.title || item.original_name}>
              {item.title || item.original_name}
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
              <span className="capitalize">{item.category}</span>
              <span>{formatFileSize(item.file_size)}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Edit Form Component
function EditMediaForm({ 
  media, 
  onSave, 
  onCancel 
}: { 
  media: MediaItem; 
  onSave: (updates: { title?: string; description?: string; category?: string; is_active?: number; display_order?: number }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(media.title || '');
  const [description, setDescription] = useState(media.description || '');
  const [category, setCategory] = useState(media.category);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ title, description, category });
    setSaving(false);
  };

  return (
    <div className="space-y-4 py-4">
      {/* Preview */}
      <div className="flex justify-center">
        {media.file_type === 'image' ? (
          <img src={media.url} alt="Preview" className="h-32 object-contain rounded" />
        ) : (
          <video src={media.url} className="h-32 rounded" />
        )}
      </div>

      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter title"
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter description"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-amber-600 hover:bg-amber-700"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
        </Button>
      </DialogFooter>
    </div>
  );
}
