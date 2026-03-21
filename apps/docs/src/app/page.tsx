/**
 * Docs site home page
 *
 * Landing page with hero, quick-start cards, and navigation to doc sections.
 */

import Link from 'next/link';
import { getNavigation } from '@/lib/docs';
import { Sidebar } from '@/components/Sidebar';
import { SupportWidget } from '@/components/SupportWidget';

export default function HomePage() {
  const navigation = getNavigation();

  return (
    <div className="docs-layout">
      <Sidebar navigation={navigation} />
      <main className="docs-main">
        <div className="home-hero">
          <h1>
            <span>Sigil</span> CMS Documentation
          </h1>
          <p>
            Multi-tenant headless CMS framework with composable content blocks, a 19-plugin
            architecture, and a Design Playground. Built with TypeScript, React 18, Express.js, and
            PostgreSQL.
          </p>
          <div className="home-cta-row">
            <Link href="/docs/getting-started/quickstart/" className="btn-primary">
              Quick Start
            </Link>
            <Link href="/docs/developer-guide/rest-api/" className="btn-outline">
              API Reference
            </Link>
          </div>
        </div>

        <div className="home-cards">
          {navigation.map((cat) =>
            cat.items.slice(0, 3).map((item) => (
              <Link
                key={`${item.category}/${item.slug}`}
                href={`/docs/${item.category}/${item.slug}/`}
                className="home-card"
              >
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </Link>
            ))
          )}
        </div>
      </main>
      <SupportWidget />
    </div>
  );
}
