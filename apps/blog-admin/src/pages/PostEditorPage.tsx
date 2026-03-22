/**
 * Post Editor — Markdown editor with live preview, SEO panel, scheduling,
 * cover image upload, category/tag selection, and featured toggle.
 */

import { useState } from 'react';
import { Save, Eye, Clock, Star, Sparkles } from 'lucide-react';

export default function PostEditorPage() {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [status, setStatus] = useState('draft');
  const [featured, setFeatured] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const autoSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-editorial text-3xl text-editorial-ink">
          {title || 'New Post'}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 border border-editorial-border rounded-lg hover:bg-editorial-warm transition-colors text-editorial-ink"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-editorial-accent text-white rounded-lg hover:opacity-90 transition-opacity">
            <Save className="w-4 h-4" />
            Save Draft
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main editor */}
        <div className="col-span-2 space-y-4">
          <input
            type="text"
            placeholder="Post title"
            value={title}
            onChange={(e) => { setTitle(e.target.value); if (!slug) setSlug(''); }}
            className="w-full px-4 py-3 text-2xl font-editorial border border-editorial-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-editorial-accent/30"
          />

          <div className="flex items-center gap-2 text-sm text-editorial-muted">
            <span>Slug:</span>
            <input
              type="text"
              value={slug || autoSlug}
              onChange={(e) => setSlug(e.target.value)}
              className="flex-1 px-2 py-1 border border-editorial-border rounded bg-editorial-warm text-editorial-ink text-sm"
            />
          </div>

          <textarea
            placeholder="Write your post in Markdown..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={24}
            className="w-full px-4 py-3 border border-editorial-border rounded-lg bg-white font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-editorial-accent/30"
          />

          <div>
            <label className="block text-sm font-medium text-editorial-muted mb-1">Excerpt</label>
            <div className="flex gap-2">
              <textarea
                placeholder="Short summary for previews and feeds..."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
                className="flex-1 px-4 py-2 border border-editorial-border rounded-lg bg-white text-sm resize-y focus:outline-none focus:ring-2 focus:ring-editorial-accent/30"
              />
              <button
                className="px-3 py-2 border border-editorial-border rounded-lg hover:bg-editorial-warm transition-colors text-editorial-muted self-start"
                title="AI Generate Excerpt"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status */}
          <div className="bg-white rounded-lg border border-editorial-border p-4">
            <h3 className="font-medium text-editorial-ink mb-3">Publish</h3>
            <div className="space-y-3">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-editorial-border rounded-lg bg-white text-sm"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
              </select>

              {status === 'scheduled' && (
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-editorial-border rounded-lg bg-white text-sm"
                />
              )}

              <label className="flex items-center gap-2 text-sm text-editorial-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="rounded border-editorial-border"
                />
                <Star className="w-4 h-4 text-editorial-accent" />
                Featured Post
              </label>
            </div>
          </div>

          {/* Cover Image */}
          <div className="bg-white rounded-lg border border-editorial-border p-4">
            <h3 className="font-medium text-editorial-ink mb-3">Cover Image</h3>
            <div className="border-2 border-dashed border-editorial-border rounded-lg p-6 text-center text-editorial-muted">
              <p className="text-sm">Drop image or click to upload</p>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white rounded-lg border border-editorial-border p-4">
            <h3 className="font-medium text-editorial-ink mb-3">Categories</h3>
            <p className="text-sm text-editorial-muted">Select categories for this post</p>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-lg border border-editorial-border p-4">
            <h3 className="font-medium text-editorial-ink mb-3">Tags</h3>
            <p className="text-sm text-editorial-muted">Add tags to help with discovery</p>
          </div>

          {/* SEO */}
          <div className="bg-white rounded-lg border border-editorial-border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-editorial-ink">SEO</h3>
              <button className="text-editorial-muted hover:text-editorial-accent" title="AI Generate SEO">
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Meta title (max 60 chars)"
                maxLength={60}
                className="w-full px-3 py-2 border border-editorial-border rounded-lg bg-white text-sm"
              />
              <textarea
                placeholder="Meta description (max 155 chars)"
                maxLength={155}
                rows={2}
                className="w-full px-3 py-2 border border-editorial-border rounded-lg bg-white text-sm resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
