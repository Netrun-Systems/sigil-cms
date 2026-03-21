/**
 * Panel — a card container with optional title.
 */

interface PanelProps {
  title?: string;
  noPadding?: boolean;
  children: React.ReactNode;
}

export default function Panel({ title, noPadding, children }: PanelProps) {
  return (
    <div className="rounded-lg overflow-hidden"
      style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-primary)' }}>
      {title && (
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 className="font-display text-base" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h3>
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>
        {children}
      </div>
    </div>
  );
}
