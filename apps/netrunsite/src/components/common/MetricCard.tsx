/**
 * Metric card — displays a single stat with optional trend.
 */

interface MetricCardProps {
  label: string;
  value: number | string;
  format?: 'number' | 'currency' | 'text';
  trend?: 'up' | 'down' | 'flat';
}

export default function MetricCard({ label, value, format = 'number', trend }: MetricCardProps) {
  const formatted = format === 'currency'
    ? `$${Number(value).toLocaleString()}`
    : format === 'number'
    ? Number(value).toLocaleString()
    : String(value);

  return (
    <div className="rounded-lg p-5" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-primary)' }}>
      <p className="text-xs uppercase tracking-wider mb-2 font-mono" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="text-2xl font-semibold" style={{ color: 'var(--accent)' }}>
        {formatted}
      </p>
      {trend && (
        <p className="text-xs mt-1" style={{ color: trend === 'up' ? 'var(--success)' : trend === 'down' ? 'var(--error)' : 'var(--text-muted)' }}>
          {trend === 'up' ? 'Trending up' : trend === 'down' ? 'Trending down' : 'Stable'}
        </p>
      )}
    </div>
  );
}
