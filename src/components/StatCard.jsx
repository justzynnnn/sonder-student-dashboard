import { ChevronRight } from 'lucide-react';

// Compact KPI card with an accent icon and optional tap-through chevron.
export default function StatCard({ icon: Icon, accent = 'rgb(var(--brand))', label, value, sub, onClick }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag onClick={onClick} className={`card p-4 text-left transition ${onClick ? 'active:scale-[0.98]' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="grid h-9 w-9 place-items-center rounded-2xl" style={{ background: `color-mix(in srgb, ${accent} 16%, transparent)`, color: accent }}>
          {Icon && <Icon size={18} strokeWidth={2.4} />}
        </span>
        {onClick && <ChevronRight size={18} className="text-muted" />}
      </div>
      <p className="mt-3 text-[15px] font-extrabold tracking-tight text-ink">{value}</p>
      <p className="section-title mt-0.5">{label}</p>
      {sub && <p className="mt-0.5 truncate text-xs text-muted">{sub}</p>}
    </Tag>
  );
}
