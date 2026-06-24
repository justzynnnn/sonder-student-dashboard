import { ChevronRight } from 'lucide-react';

// Compact KPI card with an accent icon and optional tap-through chevron.
export default function StatCard({
  icon: Icon,
  accent = 'rgb(var(--brand))',
  label,
  value,
  sub,
  meta,
  onClick,
  className = '',
  children,
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`soft-card group min-h-[9.25rem] p-4 text-left transition duration-300 ${onClick ? 'hover:-translate-y-0.5 active:scale-[0.985]' : ''} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl" style={{ background: `color-mix(in srgb, ${accent} 18%, transparent)`, color: accent }}>
          {Icon && <Icon size={18} strokeWidth={2.4} />}
        </span>
        {onClick && (
          <span className="grid h-8 w-8 place-items-center rounded-full bg-surface-2/80 text-muted transition group-hover:text-ink">
            <ChevronRight size={16} />
          </span>
        )}
      </div>
      <p className="section-title mt-4">{label}</p>
      <p className="mt-1 font-display text-2xl font-extrabold leading-none tracking-tight text-ink">{value}</p>
      {sub && <p className="mt-2 line-clamp-2 text-xs font-medium leading-relaxed text-muted">{sub}</p>}
      {meta ? <div className="mt-3">{meta}</div> : null}
      {children}
    </Tag>
  );
}
