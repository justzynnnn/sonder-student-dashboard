import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Check, RotateCcw } from 'lucide-react';
import { db } from '../../data/db';
import { addExpense, updateExpense } from '../../data/money';
import { addRecurrence } from '../../data/recurrences';
import { useSettings } from '../../hooks/useSettings';
import { useFeedback } from '../../components/Feedback';
import CategoryPicker from '../../components/CategoryPicker';
import RepeatPicker from '../../components/RepeatPicker';
import { currencySymbol, formatMoney } from '../../lib/currency';
import { todayISO } from '../../lib/dates';
import { suggestCategory } from '../../lib/categorize';
import { loggedCheer } from '../../lib/encouragement';

const QUICK_AMOUNTS = [50, 100, 200, 500];

// Doubles as add + edit. Pass `editing` (an expense row) to edit it in place.
export default function AddExpenseForm({ onDone, editing = null }) {
  const isEdit = !!editing;
  const { settings } = useSettings();
  const { celebrate, toast } = useFeedback();
  const accounts = useLiveQuery(() => db.accounts.toArray(), [], []);
  const expenses = useLiveQuery(() => db.expenses.orderBy('date').reverse().toArray(), [], []);

  const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
  const [category, setCategory] = useState(editing?.category ?? 'Food');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [accountId, setAccountId] = useState(editing?.accountId ?? '');
  const [date, setDate] = useState(editing?.date ?? todayISO());
  const [repeat, setRepeat] = useState('none');
  const [categoryTouched, setCategoryTouched] = useState(isEdit);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const lastExpense = (expenses || [])[0];
  const descSuggestions = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const e of expenses || []) {
      if (e.description && !seen.has(e.description)) { seen.add(e.description); out.push(e.description); }
      if (out.length >= 8) break;
    }
    return out;
  }, [expenses]);

  // Guess the category from what they typed — unless they've picked one.
  useEffect(() => {
    if (isEdit || categoryTouched) return;
    const guess = suggestCategory(description);
    if (guess && guess !== category) setCategory(guess);
  }, [description, categoryTouched, isEdit, category]);

  const repeatLast = () => {
    if (!lastExpense) return;
    setAmount(String(lastExpense.amount));
    setCategory(lastExpense.category);
    setDescription(lastExpense.description || '');
    setAccountId(lastExpense.accountId || '');
    setCategoryTouched(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (isEdit) {
        await updateExpense(editing.id, { amount, category, description, date, accountId: accountId || null });
        toast('Expense updated', 'good');
      } else if (repeat === 'none') {
        await addExpense({ amount, category, description, date, accountId: accountId || null });
        const todayCount = (expenses || []).filter((x) => x.date === todayISO()).length + 1;
        celebrate(loggedCheer(todayCount));
      } else {
        await addRecurrence({
          kind: 'expense',
          cadence: repeat,
          template: { amount, category, description, accountId: accountId || null },
          startDate: date || todayISO(),
        });
        toast('Repeating expense set', 'good');
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
        <div className="mb-1.5 flex items-center justify-between">
          <label className="label !mb-0">Amount</label>
          {!isEdit && lastExpense ? (
            <button type="button" onClick={repeatLast} className="flex items-center gap-1 text-xs font-bold text-money transition hover:opacity-80">
              <RotateCcw size={12} /> Repeat last
            </button>
          ) : null}
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-muted">{sym}</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="input pl-9 text-lg font-bold"
          />
        </div>
        <div className="mt-2 flex gap-2">
          {QUICK_AMOUNTS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setAmount(String(q))}
              className="flex-1 rounded-xl border border-line bg-surface-2 py-1.5 text-sm font-bold text-muted transition hover:border-money/40 hover:text-money active:scale-95"
            >
              {sym}{q}
            </button>
          ))}
        </div>
      </div>

      <div>
        <CategoryPicker domain="money" value={category} onChange={(c) => { setCategory(c); setCategoryTouched(true); }} />
      </div>

      <div>
        <label className="label">Note (optional)</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What was it for?"
          className="input"
          maxLength={80}
          list="expense-desc-suggestions"
        />
        <datalist id="expense-desc-suggestions">
          {descSuggestions.map((d) => <option key={d} value={d} />)}
        </datalist>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="label">{repeat === 'none' || isEdit ? 'Date' : 'Starts'}</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Account</label>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="input">
            <option value="">None</option>
            {(accounts || []).map((account) => {
              const isCredit = account.type === 'credit';
              const due = account.balance || 0;
              const available = Math.max(0, (account.creditLimit || 0) - due);
              const detail = isCredit
                ? `Due ${formatMoney(due, settings.baseCurrency)} / avail ${formatMoney(available, settings.baseCurrency)}`
                : formatMoney(account.balance || 0, settings.baseCurrency);
              return <option key={account.id} value={account.id}>{account.name} - {detail}</option>;
            })}
          </select>
        </div>
      </div>

      {!isEdit ? <RepeatPicker value={repeat} onChange={setRepeat} accent="rgb(var(--money))" /> : null}

      <button type="submit" disabled={busy} className="btn-add-primary w-full">
        {!busy && <span className="add-symbol">{isEdit ? <Check size={16} /> : <Plus size={16} />}</span>}
        {busy ? 'Saving...' : isEdit ? 'Save changes' : repeat === 'none' ? 'Add expense' : 'Set repeating expense'}
      </button>
    </form>
  );
}
