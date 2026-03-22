/**
 * Blog Dashboard — overview with quick stats and recent posts.
 */

import { useEffect, useState } from 'react';
import { FileText, FolderTree, Tags, Users, MessageCircle, Rss } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState({ posts: 0, categories: 0, tags: 0, authors: 0 });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="font-editorial text-3xl text-editorial-ink mb-2">Blog Dashboard</h1>
      <p className="text-editorial-muted mb-8">Manage your blog content, authors, and engagement.</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[
          { label: 'Posts', icon: FileText, value: '--', href: '/posts' },
          { label: 'Categories', icon: FolderTree, value: '--', href: '/categories' },
          { label: 'Tags', icon: Tags, value: '--', href: '/tags' },
          { label: 'Authors', icon: Users, value: '--', href: '/authors' },
          { label: 'Comments', icon: MessageCircle, value: '--', href: '/comments' },
          { label: 'RSS Feed', icon: Rss, value: 'Active', href: '#' },
        ].map((stat) => (
          <a
            key={stat.label}
            href={stat.href}
            className="bg-white rounded-lg border border-editorial-border p-4 hover:shadow-md transition-shadow"
          >
            <stat.icon className="w-5 h-5 text-editorial-accent mb-2" />
            <div className="text-2xl font-bold text-editorial-ink">{stat.value}</div>
            <div className="text-sm text-editorial-muted">{stat.label}</div>
          </a>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-editorial-border p-6">
        <h2 className="font-editorial text-xl text-editorial-ink mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <a href="/posts/new" className="px-4 py-2 bg-editorial-accent text-white rounded-lg hover:opacity-90 transition-opacity">
            New Post
          </a>
          <a href="/categories" className="px-4 py-2 border border-editorial-border rounded-lg hover:bg-editorial-warm transition-colors text-editorial-ink">
            Manage Categories
          </a>
          <a href="/comments" className="px-4 py-2 border border-editorial-border rounded-lg hover:bg-editorial-warm transition-colors text-editorial-ink">
            Moderate Comments
          </a>
        </div>
      </div>
    </div>
  );
}
