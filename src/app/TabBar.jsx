import { NavLink } from 'react-router-dom';
import { Home, Wallet, ListChecks, Dumbbell, Target, Clock3 } from 'lucide-react';

const ALL_TABS = [
  { to: '/', icon: Home, label: 'Today', accent: 'rgb(var(--brand))', end: true, always: true },
  { to: '/money', id: 'money', icon: Wallet, label: 'Money', accent: 'rgb(var(--money))' },
  { to: '/tasks', id: 'tasks', icon: ListChecks, label: 'Tasks', accent: 'rgb(var(--tasks))' },
  { to: '/time', id: 'time', icon: Clock3, label: 'Time', accent: 'rgb(var(--time))' },
  { to: '/gym', id: 'gym', icon: Dumbbell, label: 'Gym', accent: 'rgb(var(--gym))' },
  { to: '/goals', id: 'goals', icon: Target, label: 'Goals', accent: 'rgb(var(--goals))' },
];

export default function TabBar({ tabs = {} }) {
  const visible = ALL_TABS.filter((tab) => tab.always || tabs[tab.id]);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2">
      <div className="mx-auto flex max-w-md items-center gap-1 rounded-[1.75rem] border border-line/80 bg-surface/92 p-1.5 shadow-card backdrop-blur-xl">
        {visible.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className="relative min-w-0 flex-1 rounded-[1.35rem] transition active:scale-95"
            >
              {({ isActive }) => (
                <span
                  className={`flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-[1.35rem] px-1 transition duration-300 ${isActive ? 'bg-surface-2 shadow-sm' : ''}`}
                  style={{ color: isActive ? tab.accent : 'rgb(var(--muted))' }}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.7 : 2.1} />
                  <span className="truncate text-[10px] font-extrabold leading-none">{tab.label}</span>
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
