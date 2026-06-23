import { ReactNode } from 'react';
import { Search, LucideIcon } from 'lucide-react';

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-line bg-surface px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-8 sm:py-6">
      <div>
        <h1 className="font-display text-lg font-bold sm:text-xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative w-full sm:w-72">
      <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
      <input
        className="input pl-9"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = 'default',
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'warning';
  icon?: LucideIcon;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
        {Icon && (
          <span className={`rounded-md p-1.5 ${tone === 'warning' ? 'bg-danger-tint text-danger' : 'bg-accent-tint text-accent-dark'}`}>
            <Icon size={14} />
          </span>
        )}
      </div>
      <p className={`mt-2 font-mono text-2xl font-semibold tabular-nums ${tone === 'warning' ? 'text-danger' : 'text-ink'}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
      <p className="font-display text-base font-semibold text-ink">{title}</p>
      {hint && <p className="mt-1 text-sm text-ink-muted">{hint}</p>}
    </div>
  );
}

export function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'success' | 'danger' | 'accent' }) {
  const tones: Record<string, string> = {
    default: 'bg-black/5 text-ink-muted',
    success: 'bg-success-tint text-success',
    danger: 'bg-danger-tint text-danger',
    accent: 'bg-accent-tint text-accent-dark',
  };
  return <span className={`badge ${tones[tone]}`}>{children}</span>;
}
