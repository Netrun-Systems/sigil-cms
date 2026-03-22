import type { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
}

export default function MetricCard({ label, value, icon, trend }: MetricCardProps) {
  return (
    <div
      className="rounded-xl p-4 flex items-center gap-4"
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-primary)',
      }}
    >
      <div className="p-2 rounded-lg" style={{ background: 'var(--bg-input)' }}>
        {icon}
      </div>
      <div>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        <p className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {value}
        </p>
        {trend && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{trend}</p>
        )}
      </div>
    </div>
  );
}
