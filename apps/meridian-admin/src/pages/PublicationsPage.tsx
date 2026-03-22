/**
 * Publications list page — CRUD for meridian_publications.
 */

import { BookOpen, Plus, Search, MoreVertical } from 'lucide-react';

export default function PublicationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Publications</h1>
          <p className="mt-1 text-gray-600">Manage your digital publications and their flipbooks.</p>
        </div>
        <a
          href="/publications/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-meridian-indigo text-white rounded-lg hover:bg-meridian-navy transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Publication
        </a>
      </div>

      {/* Search and filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search publications..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-meridian-sky/50 focus:border-meridian-sky"
          />
        </div>
        <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-meridian-sky/50">
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Publications list */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="text-center py-12 text-gray-600">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-700">No publications found</p>
          <p className="text-sm mt-1">Create your first publication to start publishing flipbooks.</p>
        </div>
      </div>
    </div>
  );
}
