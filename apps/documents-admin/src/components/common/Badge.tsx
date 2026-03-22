import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'accent';
}

const variantStyles: Record<string, { bg: string; color: string }> = {
  default: { bg: 'rgba(168,162,158,0.15)', color: '#a8a29e' },
  success: { bg: 'rgba(34,197,94,0.15)', color: '#22c55e' },
  warning: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  error: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
  info: { bg: 'rgba(217,119,6,0.15)', color: '#d97706' },
  accent: { bg: 'rgba(180,83,9,0.15)', color: '#b45309' },
};

export default function Badge({ children, variant = 'default' }: BadgeProps) {
  const style = variantStyles[variant] || variantStyles.default;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: style.bg, color: style.color }}
    >
      {children}
    </span>
  );
}
