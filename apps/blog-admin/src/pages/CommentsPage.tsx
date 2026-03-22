/**
 * Comments Moderation — approve/reject/delete queue with threaded view.
 */

import { MessageCircle, CheckCircle, Trash2 } from 'lucide-react';

export default function CommentsPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-editorial text-3xl text-editorial-ink">Comments</h1>
      </div>

      <div className="flex gap-3 mb-6">
        {['Pending', 'Approved', 'All'].map((tab) => (
          <button
            key={tab}
            className="px-4 py-2 border border-editorial-border rounded-lg hover:bg-editorial-warm transition-colors text-sm text-editorial-ink"
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-editorial-border overflow-hidden">
        <div className="px-4 py-12 text-center text-editorial-muted">
          <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p>No comments to moderate. Comments will appear here when visitors submit them.</p>
        </div>
      </div>
    </div>
  );
}
