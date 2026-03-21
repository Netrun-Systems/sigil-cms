/**
 * Gallery page — photo management via the Sigil photos plugin.
 * Uses AI curation (Gemini) for auto-tagging and organization.
 */

import Header from '../components/common/Header';
import Panel from '../components/common/Panel';

export default function GalleryPage() {
  return (
    <div>
      <Header
        title="Gallery"
        subtitle="Manage artist work photos and gallery collections"
        actions={
          <button
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: 'var(--accent)' }}
          >
            Upload Photos
          </button>
        }
      />
      <div className="p-4 md:p-8">
        <Panel>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Gallery powered by the Sigil photos plugin with AI curation via Gemini.
            Upload artist work, organize into collections, auto-tag with AI.
          </p>
        </Panel>
      </div>
    </div>
  );
}
