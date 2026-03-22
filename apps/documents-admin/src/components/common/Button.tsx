import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  icon?: ReactNode;
  children: ReactNode;
}

const variants = {
  primary: {
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
  },
  secondary: {
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-primary)',
  },
  danger: {
    background: '#dc2626',
    color: '#fff',
    border: 'none',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: 'none',
  },
};

export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const style = variants[variant];
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-lg font-medium transition-opacity
        ${size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'}
        ${className}`}
      style={style}
      disabled={disabled}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
