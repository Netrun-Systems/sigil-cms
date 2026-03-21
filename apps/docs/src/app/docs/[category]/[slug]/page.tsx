/**
 * Documentation page route
 *
 * Renders a single markdown doc from content/{category}/{slug}.md
 * with sidebar navigation and prev/next links.
 */

import Link from 'next/link';
import { getAllDocSlugs, getDocBySlug, getNavigation } from '@/lib/docs';
import { Sidebar } from '@/components/Sidebar';
import { SupportWidget } from '@/components/SupportWidget';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ category: string; slug: string }>;
}

export async function generateStaticParams() {
  return getAllDocSlugs().map(({ category, slug }) => ({ category, slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const doc = await getDocBySlug(category, slug);
  return {
    title: `${doc.title} - Sigil CMS Docs`,
    description: doc.description,
  };
}

export default async function DocPage({ params }: PageProps) {
  const { category, slug } = await params;
  const doc = await getDocBySlug(category, slug);
  const navigation = getNavigation();

  // Build flat list for prev/next navigation
  const allDocs = navigation.flatMap((cat) =>
    cat.items.map((item) => ({
      ...item,
      path: `/docs/${item.category}/${item.slug}/`,
    }))
  );
  const currentIndex = allDocs.findIndex((d) => d.slug === slug && d.category === category);
  const prev = currentIndex > 0 ? allDocs[currentIndex - 1] : null;
  const next = currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : null;

  return (
    <div className="docs-layout">
      <Sidebar navigation={navigation} currentSlug={slug} currentCategory={category} />
      <main className="docs-main">
        <article className="docs-content">
          <header className="doc-header">
            <h1>{doc.title}</h1>
            {doc.description && <p>{doc.description}</p>}
          </header>

          <div className="prose" dangerouslySetInnerHTML={{ __html: doc.contentHtml }} />

          <nav className="doc-nav">
            {prev ? (
              <Link href={prev.path}>
                <span className="nav-label">Previous</span>
                <span className="nav-title">{prev.title}</span>
              </Link>
            ) : (
              <div />
            )}
            {next ? (
              <Link href={next.path} className="nav-next">
                <span className="nav-label">Next</span>
                <span className="nav-title">{next.title}</span>
              </Link>
            ) : (
              <div />
            )}
          </nav>
        </article>
      </main>
      <SupportWidget />
    </div>
  );
}
