/**
 * Page header component — title, subtitle, optional actions.
 */

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 md:px-8 py-6"
      style={{ borderBottom: '1px solid var(--border-primary)' }}>
      <div>
        <h1 className="font-display text-2xl" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
