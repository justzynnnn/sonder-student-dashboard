import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Send, Sparkles } from 'lucide-react';
import { db } from '../../data/db';
import { addExpense } from '../../data/money';
import { mergeCategories } from '../../data/categories';
import { useFeedback } from '../../components/Feedback';
import { parseExpense } from '../../lib/parseExpense';
import { loggedCheer } from '../../lib/encouragement';
import { formatMoney } from '../../lib/currency';
import { todayISO } from '../../lib/dates';

// One-line natural-language logging: "Lunch 120 gcash" -> a parsed expense.
// The fastest path to logging, with a live preview so it never feels like a
// black box.
export default function QuickLog({ cur }) {
  const { celebrate, toast } = useFeedback();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const accounts = useLiveQuery(() => db.accounts.toArray(), [], []);
  const custom = useLiveQuery(() => db.customCategories.where('domain').equals('money').toArray(), [], []);
  const expenses = useLiveQuery(() => db.expenses.toArray(), [], []);
  const categories = useMemo(() => mergeCategories('money', custom || []), [custom]);

  const preview = useMemo(
    () => (text.trim() ? parseExpense(text, { accounts: accounts || [], categories }) : null),
    [text, accounts, categories],
  );

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const parsed = parseExpense(text, { accounts: accounts || [], categories });
    if (parsed.error) { toast(parsed.error, 'bad'); return; }
    setBusy(true);
    try {
      await addExpense({
        amount: parsed.amount,
        category: parsed.category,
        description: parsed.description,
        date: todayISO(),
        accountId: parsed.accountId || null,
      });
      const todayCount = (expenses || []).filter((x) => x.date === todayISO()).length + 1;
      setText('');
      celebrate(loggedCheer(todayCount));
    } catch (err) {
      toast(err.message, 'bad');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card-pad">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles size={18} className="text-money" />
        <p className="font-semibold">Quick log</p>
      </div>
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='Type "Lunch 120 gcash"'
          className="input"
          enterKeyHint="send"
          aria-label="Quick log expense"
        />
        <button type="submit" disabled={busy || !text.trim()} className="btn-icon-add" aria-label="Log">
          <Send size={18} />
        </button>
      </form>
      {preview && !preview.error ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="chip bg-money/15 text-money">{formatMoney(preview.amount, cur)}</span>
          <span className="chip bg-surface-2 text-muted">{preview.category}</span>
          <span className="chip bg-surface-2 text-muted">{preview.description}</span>
          {preview.accountLabel ? <span className="chip bg-surface-2 text-muted">{preview.accountLabel}</span> : null}
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted">Amount required. Add a word like “gcash” or “cc” to pick an account.</p>
      )}
    </div>
  );
}
