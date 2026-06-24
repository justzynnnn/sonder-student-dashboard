import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sun, Moon, Settings } from 'lucide-react';
import TabBar from './TabBar';
import Fab from '../components/Fab';
import QuickAdd from './QuickAdd';
import StreakBadge from '../components/StreakBadge';
import { useTheme } from '../hooks/useTheme';
import AppIcon from '../components/AppIcon';

function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(180deg,rgb(var(--surface-2)/0.5),transparent_24rem)]" />
  );
}

export default function AppLayout({ streak = 0, tabs = {} }) {
  const { theme, toggle } = useTheme();
  const [quickOpen, setQuickOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen">
      <Backdrop />

      <header className="sticky top-0 z-20 border-b border-line/60 bg-surface/78 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <AppIcon />
            <span className="font-display text-lg font-extrabold tracking-tight">Sonder</span>
          </div>
          <div className="flex items-center gap-2">
            <StreakBadge count={streak} />
            <button onClick={toggle} aria-label="Toggle theme" className="grid h-10 w-10 place-items-center rounded-2xl border border-line/80 bg-surface-2/70 text-muted transition hover:text-ink active:scale-95">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => navigate('/settings')} aria-label="Settings" className="grid h-10 w-10 place-items-center rounded-2xl border border-line/80 bg-surface-2/70 text-muted transition hover:text-ink active:scale-95">
              <Settings size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-5 pb-32">
        <Outlet />
      </main>

      <Fab onClick={() => setQuickOpen(true)} />
      <QuickAdd open={quickOpen} onClose={() => setQuickOpen(false)} tabs={tabs} />
      <TabBar tabs={tabs} />
    </div>
  );
}
