// Friendly empty state — doubles as an onboarding nudge (plan §7.4).
export default function EmptyState({ icon: Icon, title, hint, action }) {
  return (
    <div className="card-pad flex flex-col items-center py-10 text-center">
      <div className="mb-3 grid h-16 w-16 place-items-center rounded-3xl bg-brand/10 text-brand">
        {Icon && <Icon size={28} strokeWidth={2.2} />}
      </div>
      <p className="font-display text-base font-bold text-ink">{title}</p>
      {hint && <p className="mt-1 max-w-[16rem] text-sm text-muted">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
