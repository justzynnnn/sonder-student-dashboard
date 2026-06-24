export default function StatPill({ icon: Icon, label, value, accent = 'rgb(var(--brand))', tone = 'default' }) {
  return (
    <span
      className={`stat-pill ${tone === 'soft' ? 'stat-pill-soft' : ''}`}
      style={{ '--pill-accent': accent }}
    >
      {Icon ? <Icon size={14} strokeWidth={2.4} /> : null}
      <span className="min-w-0 truncate">{label}</span>
      {value ? <strong>{value}</strong> : null}
    </span>
  );
}
