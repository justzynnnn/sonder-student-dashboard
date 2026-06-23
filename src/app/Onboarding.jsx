import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { completeOnboarding, TOGGLEABLE_TABS, DEFAULT_TABS } from '../data/settings';
import { CURRENCIES } from '../lib/currency';
import { useTheme } from '../hooks/useTheme';
import AppIcon from '../components/AppIcon';

export default function Onboarding({ onDone }) {
  useTheme(); // ensure theme class applied
  const [name, setName] = useState('');
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [tabs, setTabs] = useState({ ...DEFAULT_TABS });
  const [busy, setBusy] = useState(false);

  const toggle = (id) => setTabs((t) => ({ ...t, [id]: !t[id] }));

  const start = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await completeOnboarding({ name, baseCurrency, tabs });
      onDone?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-brand/20 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-brand-2/20 blur-3xl" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
        <div className="mb-8 text-center">
          <AppIcon className="mx-auto mb-4 h-16 w-16 rounded-3xl shadow-glow-lg" />
          <h1 className="font-display text-2xl font-extrabold">Welcome to Sonder</h1>
          <p className="mt-1 text-sm text-muted">Live life more — while staying balanced. Let’s set you up.</p>
        </div>

        <div className="card-pad space-y-4">
          <div>
            <label className="label">What should we call you?</label>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="input" maxLength={40} />
          </div>
          <div>
            <label className="label">Your currency</label>
            <select value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value)} className="input">
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Which areas do you want?</label>
            <p className="mb-2 text-xs text-muted">Pick what matters to you. You can change these anytime in Settings.</p>
            <div className="grid grid-cols-2 gap-2">
              {TOGGLEABLE_TABS.map((t) => {
                const on = tabs[t.id];
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggle(t.id)}
                    className={`flex items-center justify-between rounded-2xl border px-3.5 py-3 text-sm font-semibold transition ${
                      on ? 'border-brand bg-brand/10 text-brand' : 'border-line bg-surface-2 text-muted'
                    }`}
                  >
                    {t.label}
                    <span className={`grid h-5 w-5 place-items-center rounded-full border-2 ${on ? 'border-brand bg-brand text-white' : 'border-line'}`}>
                      {on && <Check size={12} strokeWidth={3} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <button onClick={start} disabled={busy} className="btn-primary mt-6 w-full py-3.5 text-base">
          {busy ? 'Setting up…' : 'Start living'} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
