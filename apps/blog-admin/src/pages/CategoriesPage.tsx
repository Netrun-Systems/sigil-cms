/**
 * Categories — Tree editor with nested categories, drag-to-reorder, and colors.
 */

import { useState } from 'react';
import { FolderTree, Plus, GripVertical, Pencil, Trash2 } from 'lucide-react';

export default function CategoriesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#c85a2e');

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-editorial text-3xl text-editorial-ink">Categories</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-editorial-accent text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          New Category
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-lg border border-editorial-border p-4 mb-6">
          <div className="grid grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Category name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-2 px-3 py-2 border border-editorial-border rounded-lg bg-white text-sm"
            />
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <button className="px-4 py-2 bg-editorial-accent text-white rounded-lg text-sm hover:opacity-90">
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-editorial-border overflow-hidden">
        <div className="px-4 py-12 text-center text-editorial-muted">
          <FolderTree className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p>No categories yet. Create your first blog category.</p>
        </div>
      </div>
    </div>
  );
}
