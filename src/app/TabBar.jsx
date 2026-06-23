import { NavLink } from 'react-router-dom';
import { Home, Wallet, ListChecks, Dumbbell, Target } from 'lucide-react';

// Home/Today is always present; the rest are gated by settings.tabs.
const ALL_TABS = [
  { to: '/', icon: Home, label: 'Today', accent: 'rgb(var(--brand))', end: true, always: true },
  { to: '/money', id: 'money', icon: Wallet, label: 'Money', accent: 'rgb(var(--money))' },
  { to: '/tasks', id: 'tasks', icon: ListChecks, label: 'Tasks', accent: 'rgb(var(--tasks))' },
  { to: '/gym', id: 'gym', icon: Dumbbell, label: 'Gym', accent: 'rgb(var(--gym))' },
  { to: '/goals', id: 'goals', icon: Target, label: 'Goals', accent: 'rgb(var(--goals))' },
];

export default function TabBar({ tabs = {} }) {
  const visible = ALL_TABS.filter((t) => t.always || tabs[t.id]);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2">
      <div className="mx-auto flex max-w-md items-center gap-1 rounded-3xl border border-line bg-surface/90 p-1.5 shadow-card backdrop-blur-xl">
        {visible.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className="relative flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 text-[11px] font-bold"
            >
              {({ isActive }) => (
                <span
                  className="flex flex-col items-center gap-0.5 transition"
                  style={{ color: isActive ? tab.accent : 'rgb(var(--muted))' }}
                >
                  <span
                    className="grid h-8 w-10 place-items-center rounded-xl transition"
                    style={{ background: isActive ? `color-mix(in srgb, ${tab.accent} 16%, transparent)` : 'transparent' }}
                  >
                    <Icon size={20} strokeWidth={isActive ? 2.6 : 2} />
                  </span>
                  {tab.label}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
