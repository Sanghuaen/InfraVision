import type { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  progress?: number;
  status?: 'healthy' | 'warning' | 'critical';
}

const statusStyles = {
  healthy: {
    icon: 'text-emerald-400',
    progress: 'bg-emerald-400',
    glow: 'hover:border-emerald-500/30',
  },
  warning: {
    icon: 'text-amber-400',
    progress: 'bg-amber-400',
    glow: 'hover:border-amber-500/30',
  },
  critical: {
    icon: 'text-red-400',
    progress: 'bg-red-400',
    glow: 'hover:border-red-500/30',
  },
};

export function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  progress,
  status = 'healthy',
}: SummaryCardProps) {
  const progressValue = Math.min(
    Math.max(progress ?? 0, 0),
    100,
  );

  const styles = statusStyles[status];

  return (
    <div
      className={`group rounded-xl border border-slate-800 bg-slate-900 p-5 transition-all duration-300 hover:-translate-y-1 hover:bg-slate-900/90 ${styles.glow}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">

        <div>
          <p className="text-sm text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-white transition-colors">
            {value}
          </p>
        </div>

        <div
          className={`rounded-lg border border-slate-800 bg-slate-950 p-2.5 transition-transform duration-300 group-hover:scale-110 ${styles.icon}`}
        >
          <Icon className="h-5 w-5" />
        </div>

      </div>

      {/* Progress */}
      {progress !== undefined && (
        <div className="mt-5">

          <div className="flex justify-between text-[11px] text-slate-500">
            <span>Usage</span>
            <span>{progressValue.toFixed(1)}%</span>
          </div>

          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">

            <div
              className={`h-full rounded-full transition-all duration-700 ${styles.progress}`}
              style={{
                width: `${progressValue}%`,
              }}
            />

          </div>

        </div>
      )}

      {/* Description */}
      <div className="mt-4 flex items-center gap-2">

        <span
          className={`h-1.5 w-1.5 rounded-full ${styles.progress}`}
        />

        <p className="text-xs text-slate-500">
          {description}
        </p>

      </div>
    </div>
  );
}