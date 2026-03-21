import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sigil CMS Documentation',
  description:
    'Multi-tenant headless CMS framework with composable blocks, a plugin architecture, and a Design Playground. TypeScript, React 18, Express.js, PostgreSQL.',
  metadataBase: new URL('https://docs.sigil-cms.com'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
