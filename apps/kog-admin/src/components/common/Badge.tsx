interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'sage';
}

const variantStyles: Record<string, { bg: string; color: string; border: string }> = {
  default: { bg: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: 'var(--border-subtle)' },
  success: { bg: 'rgba(34,197,94,0.1)', color: 'var(--success)', border: 'rgba(34,197,94,0.3)' },
  warning: { bg: 'rgba(251,191,36,0.1)', color: 'var(--warning)', border: 'rgba(251,191,36,0.3)' },
  error: { bg: 'rgba(239,68,68,0.1)', color: 'var(--error)', border: 'rgba(239,68,68,0.3)' },
  info: { bg: 'rgba(59,130,246,0.1)', color: 'var(--info)', border: 'rgba(59,130,246,0.3)' },
  sage: { bg: 'rgba(144,185,171,0.1)', color: 'var(--netrun-green)', border: 'rgba(144,185,171,0.3)' },
};

export default function Badge({ label, variant = 'default' }: BadgeProps) {
  const style = variantStyles[variant];
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body"
      style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}
    >
      {label}
    </span>
  );
}
