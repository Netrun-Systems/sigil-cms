/**
 * Blog management — powered by the Sigil @netrun/blog plugin.
 *
 * Manages research articles, case studies, and technical blog posts
 * for the Netrun Systems corporate website.
 */

import Header from '../components/common/Header';
import Panel from '../components/common/Panel';

export default function BlogPage() {
  return (
    <div>
      <Header
        title="Blog"
        subtitle="Research articles, case studies, and technical insights"
        actions={
          <button
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--accent)', color: 'var(--bg-base)' }}
          >
            New Post
          </button>
        }
      />
      <div className="p-4 md:p-8 space-y-6">
        <Panel title="Published Posts">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Blog posts powered by the Sigil blog plugin. 12 articles imported from the
            original NetrunSite blog. Supports markdown content, cover images, categories,
            tags, and AI-powered excerpts and SEO suggestions.
          </p>
        </Panel>
        <Panel title="Drafts & Scheduled">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Scheduled posts auto-publish at the configured time via the Sigil content scheduler.
          </p>
        </Panel>
        <Panel title="Categories & Tags">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Organize posts by technology area, product, or topic. Categories support
            nested hierarchies. Tags are flat for cross-cutting themes.
          </p>
        </Panel>
      </div>
    </div>
  );
}
