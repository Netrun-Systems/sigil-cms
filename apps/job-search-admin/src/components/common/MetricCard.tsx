import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'flat';
  icon?: React.ReactNode;
}

export default function MetricCard({ label, value, change, trend, icon }: MetricCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'var(--success)' : trend === 'down' ? 'var(--error)' : 'var(--text-muted)';

  return (
    <div className="rounded-xl p-5"
      style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-primary)' }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {label}
        </p>
        {icon && <span style={{ color: 'var(--accent)' }}>{icon}</span>}
      </div>
      <div className="flex items-end justify-between">
        <span className="font-display text-3xl" style={{ color: 'var(--text-primary)' }}>
          {typeof value === 'number' && value >= 1000
            ? `${(value / 1000).toFixed(1)}k`
            : value}
        </span>
        {change !== undefined && (
          <span className="flex items-center gap-1 text-xs" style={{ color: trendColor }}>
            <TrendIcon size={14} />
            {change > 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
    </div>
  );
}
