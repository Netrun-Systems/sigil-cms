import type { ReactNode } from 'react';

interface PanelProps {
  children: ReactNode;
  title?: string;
  action?: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export default function Panel({ children, title, action, className = '', noPadding }: PanelProps) {
  return (
    <div
      className={`rounded-xl ${className}`}
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-primary)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
      }}
    >
      {title && (
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border-primary)' }}>
          <h3 className="font-display text-sm" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h3>
          {action}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>
        {children}
      </div>
    </div>
  );
}
