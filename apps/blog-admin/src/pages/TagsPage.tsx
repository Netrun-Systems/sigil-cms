/**
 * Tags Manager — tag cloud with post counts, merge, and bulk delete.
 */

import { useState } from 'react';
import { Tags, Plus, X } from 'lucide-react';

export default function TagsPage() {
  const [newTag, setNewTag] = useState('');

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-editorial text-3xl text-editorial-ink">Tags</h1>
      </div>

      <div className="bg-white rounded-lg border border-editorial-border p-4 mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="New tag name"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            className="flex-1 px-3 py-2 border border-editorial-border rounded-lg bg-white text-sm"
          />
          <button className="px-4 py-2 bg-editorial-accent text-white rounded-lg text-sm hover:opacity-90">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-editorial-border overflow-hidden">
        <div className="px-4 py-12 text-center text-editorial-muted">
          <Tags className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p>No tags yet. Add tags to organize your blog posts.</p>
        </div>
      </div>
    </div>
  );
}
