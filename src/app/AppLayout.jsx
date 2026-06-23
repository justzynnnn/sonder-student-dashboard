import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sun, Moon, Settings } from 'lucide-react';
import TabBar from './TabBar';
import Fab from '../components/Fab';
import QuickAdd from './QuickAdd';
import StreakBadge from '../components/StreakBadge';
import { useTheme } from '../hooks/useTheme';
import AppIcon from '../components/AppIcon';

// Decorative ambient blobs — brand glow without imagery.
function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand/15 blur-3xl animate-float" />
      <div className="absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-brand-2/10 blur-3xl animate-float [animation-delay:2s]" />
    </div>
  );
}

export default function AppLayout({ streak = 0, tabs = {} }) {
  const { theme, toggle } = useTheme();
  const [quickOpen, setQuickOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen">
      <Backdrop />

      <header className="sticky top-0 z-20 border-b border-line/70 bg-surface/70 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <AppIcon />
            <span className="font-display text-lg font-extrabold tracking-tight">Sonder</span>
          </div>
          <div className="flex items-center gap-2">
            <StreakBadge count={streak} />
            <button onClick={toggle} aria-label="Toggle theme" className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-surface text-muted transition hover:text-ink">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => navigate('/settings')} aria-label="Settings" className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-surface text-muted transition hover:text-ink">
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
