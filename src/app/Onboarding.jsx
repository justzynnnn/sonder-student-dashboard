import { useState } from 'react';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { completeOnboarding, TOGGLEABLE_TABS, DEFAULT_TABS } from '../data/settings';
import { seedStarterData } from '../data/seed';
import { CURRENCIES } from '../lib/currency';
import { useTheme } from '../hooks/useTheme';
import AppIcon from '../components/AppIcon';

export default function Onboarding({ onDone }) {
  useTheme();
  const [name, setName] = useState('');
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [tabs, setTabs] = useState({ ...DEFAULT_TABS });
  const [seed, setSeed] = useState(true);
  const [busy, setBusy] = useState(false);

  const toggle = (id) => setTabs((current) => ({ ...current, [id]: !current[id] }));

  const start = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await completeOnboarding({ name, baseCurrency, tabs });
      if (seed) await seedStarterData(tabs);
      onDone?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
        <div className="mb-8 text-center">
          <AppIcon className="mx-auto mb-4 h-16 w-16 rounded-3xl shadow-glow-lg" />
          <h1 className="font-display text-2xl font-extrabold">Welcome to Sonder</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">Live life more while staying balanced. Set up the parts that matter today.</p>
        </div>

        <div className="soft-card space-y-4 p-4">
          <div>
            <label className="label">What should we call you?</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="input"
              maxLength={40}
              enterKeyHint="next"
            />
          </div>
          <div>
            <label className="label">Your currency</label>
            <select value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value)} className="input">
              {CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.symbol} {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Which areas do you want?</label>
            <p className="mb-2 text-xs leading-relaxed text-muted">Pick what matters. You can change this anytime.</p>
            <div className="grid grid-cols-2 gap-2">
              {TOGGLEABLE_TABS.map((tab) => {
                const selected = tabs[tab.id];
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => toggle(tab.id)}
                    className={`flex min-h-12 items-center justify-between rounded-2xl border px-3.5 py-3 text-sm font-semibold transition active:scale-[0.98] ${
                      selected ? 'border-brand bg-brand/10 text-brand' : 'border-line bg-surface-2 text-muted'
                    }`}
                  >
                    {tab.label}
                    <span className={`grid h-5 w-5 place-items-center rounded-full border-2 ${selected ? 'border-brand bg-brand text-white' : 'border-line'}`}>
                      {selected && <Check size={12} strokeWidth={3} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSeed((v) => !v)}
            className={`flex w-full items-center justify-between rounded-2xl border px-3.5 py-3 text-left text-sm font-semibold transition active:scale-[0.99] ${
              seed ? 'border-brand bg-brand/10 text-brand' : 'border-line bg-surface-2 text-muted'
            }`}
          >
            <span className="flex items-center gap-2">
              <Sparkles size={16} />
              Start with a few examples I can edit or delete
            </span>
            <span className={`grid h-5 w-5 place-items-center rounded-full border-2 ${seed ? 'border-brand bg-brand text-white' : 'border-line'}`}>
              {seed && <Check size={12} strokeWidth={3} />}
            </span>
          </button>
        </div>

        <button onClick={start} disabled={busy} className="btn-primary mt-6 w-full py-3.5 text-base">
          {busy ? 'Setting up...' : 'Start living'} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
