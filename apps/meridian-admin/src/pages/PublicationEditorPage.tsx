/**
 * Publication editor — create/edit a publication, manage its flipbooks.
 */

import { ArrowLeft, Save, Upload, Eye, Globe } from 'lucide-react';

export default function PublicationEditorPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <a href="/publications" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </a>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">New Publication</h1>
          <p className="mt-1 text-gray-600">Create a new digital publication.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-meridian-indigo text-white rounded-lg hover:bg-meridian-navy transition-colors">
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Details</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                placeholder="My Publication"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-meridian-sky/50 focus:border-meridian-sky"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-600">/flipbooks/</span>
                <input
                  type="text"
                  placeholder="my-publication"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-meridian-sky/50 focus:border-meridian-sky"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows={3}
                placeholder="Describe this publication..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-meridian-sky/50 focus:border-meridian-sky resize-none"
              />
            </div>
          </div>

          {/* PDF Upload */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Flipbook PDF</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-meridian-sky transition-colors cursor-pointer">
              <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
              <p className="text-sm font-medium text-gray-700">Drop a PDF here or click to upload</p>
              <p className="text-xs text-gray-600 mt-1">PDF files up to 100MB</p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Status</h2>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-meridian-sky/50">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Globe className="w-4 h-4" />
              Publish Now
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Cover Image</h2>
            <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
              <span className="text-sm text-gray-600">No cover</span>
            </div>
            <button className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              Upload Cover
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
