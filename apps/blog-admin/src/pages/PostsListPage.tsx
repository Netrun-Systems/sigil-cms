/**
 * Posts List — table with status badges, search, filters, and bulk actions.
 */

import { useState } from 'react';
import { FileText, Plus, Search, Filter } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  published: 'bg-green-100 text-green-700',
  scheduled: 'bg-blue-100 text-blue-700',
  archived: 'bg-yellow-100 text-yellow-700',
};

export default function PostsListPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-editorial text-3xl text-editorial-ink">Posts</h1>
        <a
          href="/posts/new"
          className="flex items-center gap-2 px-4 py-2 bg-editorial-accent text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          New Post
        </a>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-editorial-muted" />
          <input
            type="text"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-editorial-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-editorial-accent/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-editorial-border rounded-lg bg-white text-editorial-ink"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="scheduled">Scheduled</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="bg-white rounded-lg border border-editorial-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-editorial-warm">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-editorial-muted">Title</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-editorial-muted">Author</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-editorial-muted">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-editorial-muted">Published</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-editorial-muted">Reading</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-editorial-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} className="px-4 py-12 text-center text-editorial-muted">
                <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No posts yet. Create your first blog post.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
