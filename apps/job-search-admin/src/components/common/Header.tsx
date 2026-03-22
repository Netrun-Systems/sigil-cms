interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function Header({ title, subtitle, action }: HeaderProps) {
  return (
    <header className="px-4 md:px-8 py-4 md:py-5 flex items-center justify-between"
      style={{ borderBottom: '1px solid var(--border-primary)' }}>
      <div>
        <h2 className="font-display text-lg md:text-xl" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs md:text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </header>
  );
}
