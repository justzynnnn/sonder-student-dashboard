import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { addExpense } from '../../data/money';
import { BUILT_IN_CATEGORIES } from '../../data/categories';
import { useSettings } from '../../hooks/useSettings';
import { useFeedback } from '../../components/Feedback';
import { currencySymbol } from '../../lib/currency';
import { todayISO } from '../../lib/dates';

export default function AddExpenseForm({ onDone }) {
  const { settings } = useSettings();
  const { celebrate, toast } = useFeedback();
  const accounts = useLiveQuery(() => db.accounts.toArray(), [], []);

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return; // double-submit guard
    setBusy(true);
    setError('');
    try {
      await addExpense({ amount, category, description, date, accountId: accountId || null });
      celebrate('Logged');
      onDone?.();
    } catch (err) {
      setError(err.message);
      toast(err.message, 'bad');
    } finally {
      setBusy(false);
    }
  };

  const sym = currencySymbol(settings.baseCurrency);

  return (
    <form onSubmit={submit} className="space-y-4 pb-4">
      {error && <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{error}</p>}

      <div>
        <label className="label">Amount</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-muted">{sym}</span>
          <input
            type="number" inputMode="decimal" step="0.01" min="0" autoFocus
            value={amount} onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00" className="input pl-9 text-lg font-bold"
          />
        </div>
      </div>

      <div>
        <label className="label">Category</label>
        <div className="flex flex-wrap gap-2">
          {BUILT_IN_CATEGORIES.map((c) => {
            const active = c.name === category;
            return (
              <button
                key={c.name} type="button" onClick={() => setCategory(c.name)}
                className="chip border transition"
                style={{
                  borderColor: active ? c.color : 'rgb(var(--line))',
                  background: active ? `color-mix(in srgb, ${c.color} 18%, transparent)` : 'rgb(var(--surface-2))',
                  color: active ? c.color : 'rgb(var(--muted))',
                }}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} /> {c.name}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="label">Note (optional)</label>
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was it for?" className="input" maxLength={80} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Account</label>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="input">
            <option value="">None</option>
            {(accounts || []).map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      </div>

      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? 'Saving…' : 'Add expense'}
      </button>
    </form>
  );
}
