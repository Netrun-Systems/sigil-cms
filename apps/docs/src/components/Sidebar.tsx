/**
 * Documentation sidebar navigation
 *
 * Renders categories and doc links from the content/ directory.
 * Active state is determined by matching the current path.
 */

import Link from 'next/link';
import type { NavCategory } from '@/lib/docs';

interface SidebarProps {
  navigation: NavCategory[];
  currentSlug?: string;
  currentCategory?: string;
}

export function Sidebar({ navigation, currentSlug, currentCategory }: SidebarProps) {
  return (
    <aside className="docs-sidebar">
      <div className="sidebar-logo">
        <h1>
          <span>Sigil</span> CMS
        </h1>
        <p>Documentation</p>
      </div>

      <nav>
        {navigation.map((cat) => (
          <div key={cat.slug} className="sidebar-category">
            <span className="sidebar-category-label">{cat.label}</span>
            {cat.items.map((item) => {
              const isActive = item.slug === currentSlug && item.category === currentCategory;
              return (
                <Link
                  key={`${item.category}/${item.slug}`}
                  href={`/docs/${item.category}/${item.slug}`}
                  className={`sidebar-link${isActive ? ' active' : ''}`}
                >
                  {item.title}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
