// Pill segmented control. options: [{ id, label, badge? }]
export default function SegmentedControl({ options, value, onChange, className = '' }) {
  return (
    <div className={`flex gap-1 rounded-2xl border border-line bg-surface-2 p-1 ${className}`}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${
              active ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink'
            }`}
          >
            {o.label}
            {o.badge != null && (
              <span className={`rounded-full px-1.5 text-[11px] ${active ? 'bg-brand/15 text-brand' : 'bg-line text-muted'}`}>
                {o.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
