/**
 * Page-level header — replicates KOG frontend's Header component.
 * This sits inside the platform shell's content area (not the top bar).
 */

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="px-4 md:px-8 py-4 md:py-5"
      style={{ borderBottom: '1px solid var(--border-primary)' }}>
      <h2 className="font-display text-lg md:text-xl" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h2>
      {subtitle && (
        <p className="text-xs md:text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {subtitle}
        </p>
      )}
    </header>
  );
}
