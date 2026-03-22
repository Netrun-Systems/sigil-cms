import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  loading?: boolean;
}

const variants = {
  primary: {
    bg: 'var(--accent)',
    color: '#ffffff',
    border: 'var(--accent)',
    hoverBg: 'var(--accent-light)',
  },
  secondary: {
    bg: 'transparent',
    color: 'var(--text-secondary)',
    border: 'var(--border-primary)',
    hoverBg: 'var(--bg-hover)',
  },
  ghost: {
    bg: 'transparent',
    color: 'var(--text-muted)',
    border: 'transparent',
    hoverBg: 'var(--bg-hover)',
  },
  danger: {
    bg: 'rgba(239,68,68,0.1)',
    color: 'var(--error)',
    border: 'rgba(239,68,68,0.3)',
    hoverBg: 'rgba(239,68,68,0.2)',
  },
};

export default function Button({
  children, variant = 'primary', size = 'md', loading, disabled, ...props
}: ButtonProps) {
  const v = variants[variant];
  const padding = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-body transition-colors ${padding}`}
      style={{
        background: v.bg,
        color: v.color,
        border: `1px solid ${v.border}`,
        opacity: disabled || loading ? 0.5 : 1,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
      }}
      disabled={disabled || loading}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = v.hoverBg; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.background = v.bg; }}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
