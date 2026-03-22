/**
 * Authors — author profiles with bio editor, social links, and post counts.
 */

import { Users } from 'lucide-react';

export default function AuthorsPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-editorial text-3xl text-editorial-ink">Authors</h1>
      </div>

      <div className="bg-white rounded-lg border border-editorial-border overflow-hidden">
        <div className="px-4 py-12 text-center text-editorial-muted">
          <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p>No authors yet. Authors are automatically created when users publish posts.</p>
        </div>
      </div>
    </div>
  );
}
