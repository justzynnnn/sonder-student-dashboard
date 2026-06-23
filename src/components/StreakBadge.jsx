import { Flame } from 'lucide-react';

export default function StreakBadge({ count = 0 }) {
  const lit = count > 0;
  return (
    <span
      className={`chip ${lit ? 'bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-glow' : 'bg-surface-2 text-muted'}`}
      title={`${count}-day streak`}
    >
      <Flame size={14} strokeWidth={2.6} className={lit ? 'fill-white/30' : ''} />
      {count}
    </span>
  );
}
