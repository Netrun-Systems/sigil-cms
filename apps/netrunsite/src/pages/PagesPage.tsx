/**
 * Pages management — Sigil CMS page editor for the corporate website.
 *
 * Lists all pages (Home, Products, Services, About, Contact, KAMERA)
 * and allows editing content blocks via the Sigil visual editor.
 */

import Header from '../components/common/Header';
import Panel from '../components/common/Panel';

const SITE_PAGES = [
  { title: 'Home', path: '/', blocks: 'hero, feature_grid, cta', status: 'published' },
  { title: 'Products', path: '/products', blocks: 'product_cards (x6)', status: 'published' },
  { title: 'Services', path: '/services', blocks: 'service_list, cta', status: 'published' },
  { title: 'About', path: '/about', blocks: 'hero, text, team_grid', status: 'published' },
  { title: 'Research & Blog', path: '/blog', blocks: 'blog_feed', status: 'published' },
  { title: 'Contact', path: '/contact', blocks: 'contact_form, map', status: 'published' },
  { title: 'KAMERA', path: '/kamera', blocks: 'hero, scan_viewer, pricing', status: 'published' },
];

export default function PagesPage() {
  return (
    <div>
      <Header
        title="Pages"
        subtitle="Manage corporate website pages and content blocks"
        actions={
          <button
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--accent)', color: 'var(--bg-base)' }}
          >
            New Page
          </button>
        }
      />
      <div className="p-4 md:p-8 space-y-6">
        <Panel title="Site Pages" noPadding>
          <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {SITE_PAGES.map((page) => (
              <div key={page.path} className="px-5 py-4 flex items-center justify-between hover:bg-opacity-50"
                style={{ cursor: 'pointer' }}>
                <div>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{page.title}</p>
                  <p className="text-xs font-mono mt-1" style={{ color: 'var(--text-muted)' }}>
                    {page.path} — {page.blocks}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded font-mono"
                  style={{ background: 'var(--bg-input)', color: 'var(--success)' }}>
                  {page.status}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
