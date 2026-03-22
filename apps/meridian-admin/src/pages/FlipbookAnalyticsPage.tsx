/**
 * Per-flipbook analytics — page heatmap, session details, engagement metrics.
 */

import { ArrowLeft, BarChart3, Eye, Clock, Layers } from 'lucide-react';

export default function FlipbookAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <a href="/reader-analytics" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </a>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Flipbook Analytics</h1>
          <p className="mt-1 text-gray-600">Per-page engagement heatmap and session details.</p>
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="bg-meridian-ice text-meridian-indigo p-2 rounded-lg"><Eye className="w-5 h-5" /></div>
            <div>
              <p className="text-sm text-gray-600">Total Sessions</p>
              <p className="text-xl font-bold text-gray-900">--</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="bg-meridian-ice text-meridian-indigo p-2 rounded-lg"><Layers className="w-5 h-5" /></div>
            <div>
              <p className="text-sm text-gray-600">Pages Viewed</p>
              <p className="text-xl font-bold text-gray-900">--</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="bg-meridian-ice text-meridian-indigo p-2 rounded-lg"><Clock className="w-5 h-5" /></div>
            <div>
              <p className="text-sm text-gray-600">Total Time Spent</p>
              <p className="text-xl font-bold text-gray-900">--</p>
            </div>
          </div>
        </div>
      </div>

      {/* Page heatmap */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Page Heatmap</h2>
          <p className="text-sm text-gray-600 mt-1">Which pages get read vs. skipped</p>
        </div>
        <div className="p-6">
          <div className="text-center py-8 text-gray-600">
            <BarChart3 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-700">No page data yet</p>
            <p className="text-sm mt-1">Per-page views, average time, and bounce rate will appear here.</p>
          </div>
        </div>
      </div>

      {/* Recent sessions */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Sessions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Session</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-700">Pages</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-700">Time</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-700">Last Page</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Referrer</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Started</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-600">
                  No sessions recorded yet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
