import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Check } from 'lucide-react';
import { db } from '../../data/db';
import { addIncome, updateIncome } from '../../data/money';
import { addRecurrence } from '../../data/recurrences';
import { useSettings } from '../../hooks/useSettings';
import { useFeedback } from '../../components/Feedback';
import RepeatPicker from '../../components/RepeatPicker';
import { currencySymbol, formatMoney } from '../../lib/currency';
import { todayISO } from '../../lib/dates';

const SOURCES = ['Allowance', 'Part-time', 'Scholarship', 'Gift', 'Other'];

// Money coming in — allowance, part-time pay, financial aid. Supports repeat so
// a monthly allowance/payday lands automatically.
export default function AddIncomeForm({ onDone, editing = null }) {
  const isEdit = !!editing;
  const { settings } = useSettings();
  const { celebrate, toast } = useFeedback();
  const accounts = useLiveQuery(() => db.accounts.toArray(), [], []);

  const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
  const [source, setSource] = useState(editing?.source ?? 'Allowance');
  const [accountId, setAccountId] = useState(editing?.accountId ?? '');
  const [date, setDate] = useState(editing?.date ?? todayISO());
  const [repeat, setRepeat] = useState('none');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (isEdit) {
        await updateIncome(editing.id, { amount, source, date, accountId: accountId || null });
        toast('Income updated', 'good');
      } else if (repeat === 'none') {
        await addIncome({ amount, source, date, accountId: accountId || null });
        celebrate('Income added');
      } else {
        await addRecurrence({
          kind: 'income',
          cadence: repeat,
          template: { amount, source, accountId: accountId || null },
          startDate: date || todayISO(),
        });
        toast('Repeating income set', 'good');
      }
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
          <input type="number" inputMode="decimal" step="0.01" min="0" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="input pl-9 text-lg font-bold" />
        </div>
      </div>

      <div>
        <label className="label">Source</label>
        <div className="flex flex-wrap gap-2">
          {SOURCES.map((s) => {
            const active = s === source;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSource(s)}
                className="chip border transition"
                style={{
                  borderColor: active ? 'rgb(var(--money))' : 'rgb(var(--line))',
                  background: active ? 'color-mix(in srgb, rgb(var(--money)) 16%, transparent)' : 'rgb(var(--surface-2))',
                  color: active ? 'rgb(var(--money))' : 'rgb(var(--muted))',
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="label">{repeat === 'none' || isEdit ? 'Date' : 'Starts'}</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Into account</label>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="input">
            <option value="">None</option>
            {(accounts || []).map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} - {account.type === 'credit' ? `Due ${formatMoney(account.balance || 0, settings.baseCurrency)}` : formatMoney(account.balance || 0, settings.baseCurrency)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!isEdit ? <RepeatPicker value={repeat} onChange={setRepeat} accent="rgb(var(--money))" /> : null}

      <button type="submit" disabled={busy} className="btn-add-primary w-full">
        {!busy && <span className="add-symbol">{isEdit ? <Check size={16} /> : <Plus size={16} />}</span>}
        {busy ? 'Saving...' : isEdit ? 'Save changes' : repeat === 'none' ? 'Add income' : 'Set repeating income'}
      </button>
    </form>
  );
}
