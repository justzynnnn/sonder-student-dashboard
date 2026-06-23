import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Trash2, Wallet, Sparkles, Calculator } from 'lucide-react';
import { db } from '../../data/db';
import { useSettings } from '../../hooks/useSettings';
import { useFeedback } from '../../components/Feedback';
import SegmentedControl from '../../components/SegmentedControl';
import ProgressRing from '../../components/ProgressRing';
import EmptyState from '../../components/EmptyState';
import BottomSheet from '../../components/BottomSheet';
import CategoryDonut from './CategoryDonut';
import AddExpenseForm from './AddExpenseForm';
import { formatMoney, currencySymbol } from '../../lib/currency';
import { humanDate } from '../../lib/dates';
import { categoryMeta } from '../../data/categories';
import { moneyNote, affordNote } from '../../lib/encouragement';
import {
  moneyOverview, spentInPeriod, spendingByCategory, affordVerdict,
  addAccount, deleteAccount, addSaving, addToSaving, deleteSaving, deleteExpense,
} from '../../data/money';

export default function MoneyTab() {
  const { settings } = useSettings();
  const cur = settings.baseCurrency;
  const [period, setPeriod] = useState('week');
  const [sheet, setSheet] = useState(null); // 'expense' | 'account' | 'saving'

  const expenses = useLiveQuery(() => db.expenses.orderBy('date').reverse().toArray(), [], []);
  const accounts = useLiveQuery(() => db.accounts.toArray(), [], []);
  const savings = useLiveQuery(() => db.savings.toArray(), [], []);

  const money = moneyOverview(accounts || [], expenses || []);
  const spent = spentInPeriod(expenses || [], period);
  const byCat = spendingByCategory(expenses || [], period);
  const note = moneyNote({ hasAccounts: money.hasAccounts, runway: money.runway });

  return (
    <div className="animate-fade-up space-y-4">
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Money</h1>

      {/* Hero: total money + runway */}
      <div className="card-pad">
        {money.hasAccounts ? (
          <div className="flex items-center gap-5">
            <ProgressRing value={money.runway != null ? Math.min(1, money.runway / 30) : 1} size={104} stroke={11} color="rgb(var(--money))">
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase text-muted">runway</p>
                <p className="text-sm font-extrabold">{money.runway != null ? `${money.runway}d` : '∞'}</p>
              </div>
            </ProgressRing>
            <div className="flex-1">
              <p className="section-title">Total money</p>
              <p className="font-display text-3xl font-extrabold text-money">{formatMoney(money.total, cur)}</p>
              <p className="mt-1 text-xs text-muted">
                {accounts.length} account{accounts.length === 1 ? '' : 's'} · {money.burn > 0 ? `~${formatMoney(money.burn, cur)}/day` : 'no spend yet'}
              </p>
            </div>
          </div>
        ) : (
          <button onClick={() => setSheet('account')} className="flex w-full items-center gap-3 text-left">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-money/15 text-money"><Wallet size={22} /></span>
            <div>
              <p className="font-bold">Add your first account</p>
              <p className="text-sm text-muted">Track your real money and runway.</p>
            </div>
          </button>
        )}
        <div className="mt-3 flex items-start gap-2 rounded-2xl bg-money/8 p-3">
          <Sparkles size={16} className="mt-0.5 shrink-0 text-money" />
          <p className="text-sm font-medium text-ink">{note}</p>
        </div>
      </div>

      <AffordCheck cur={cur} accounts={accounts || []} expenses={expenses || []} />

      {/* Accounts */}
      <Section title="Accounts" action={<AddBtn onClick={() => setSheet('account')} />}>
        {(accounts || []).length === 0 ? (
          <p className="px-1 text-sm text-muted">No accounts yet — add cash, a card, or an e-wallet.</p>
        ) : (
          <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
            {accounts.map((a) => (
              <div key={a.id} className="card relative w-40 shrink-0 p-4">
                <button onClick={() => deleteAccount(a.id)} aria-label="Delete account" className="absolute right-2 top-2 text-muted hover:text-rose-500"><Trash2 size={14} /></button>
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-money/15 text-money"><Wallet size={18} /></span>
                <p className="mt-2 truncate text-sm font-semibold">{a.name}</p>
                <p className="font-display text-lg font-extrabold">{formatMoney(a.balance, cur)}</p>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Spending breakdown */}
      <Section
        title="Spending"
        action={<SegmentedControl className="w-40" options={[{ id: 'week', label: 'Week' }, { id: 'month', label: 'Month' }]} value={period} onChange={setPeriod} />}
      >
        {byCat.length === 0 ? (
          <p className="px-1 text-sm text-muted">No spending logged this {period}. Tap + to add one.</p>
        ) : (
          <div className="card-pad flex items-center gap-5">
            <CategoryDonut data={byCat} total={spent} />
            <ul className="flex-1 space-y-2">
              {byCat.slice(0, 5).map((d) => (
                <li key={d.category} className="flex items-center gap-2 text-sm">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: categoryMeta(d.category).color }} />
                  <span className="flex-1 truncate">{d.category}</span>
                  <span className="font-semibold">{formatMoney(d.total, cur)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      {/* Savings goals */}
      <Section title="Savings goals" action={<AddBtn onClick={() => setSheet('saving')} />}>
        {(savings || []).length === 0 ? (
          <p className="px-1 text-sm text-muted">Saving for something? Add a goal and watch it grow.</p>
        ) : (
          <div className="space-y-2">
            {savings.map((s) => {
              const p = Math.min(1, s.saved / s.target);
              return (
                <div key={s.id} className="card-pad">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{s.name}</p>
                    <button onClick={() => deleteSaving(s.id)} aria-label="Delete" className="text-muted hover:text-rose-500"><Trash2 size={14} /></button>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-gradient-to-r from-money to-emerald-400" style={{ width: `${p * 100}%` }} />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-xs">
                    <span className="text-muted">{formatMoney(s.saved, cur)} / {formatMoney(s.target, cur)}</span>
                    <button onClick={() => addToSaving(s.id, 10)} className="font-semibold text-money">+ Add {currencySymbol(cur)}10</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Recent expenses */}
      <Section title="Recent">
        {(expenses || []).length === 0 ? (
          <EmptyState icon={Wallet} title="No expenses yet" hint="Log your first one with the + button." />
        ) : (
          <ul className="space-y-2">
            {expenses.slice(0, 12).map((e) => (
              <li key={e.id} className="card flex items-center gap-3 p-3">
                <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ background: categoryMeta(e.category).color }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{e.description || e.category}</p>
                  <p className="text-xs text-muted">{humanDate(e.date)} · {e.category}</p>
                </div>
                <span className="font-display font-extrabold">{formatMoney(e.amount, cur)}</span>
                <button onClick={() => deleteExpense(e.id)} aria-label="Delete" className="text-muted hover:text-rose-500"><Trash2 size={15} /></button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <button onClick={() => setSheet('expense')} className="btn-primary w-full">
        <Plus size={18} /> Add expense
      </button>

      {/* Sheets */}
      <BottomSheet open={sheet === 'expense'} onClose={() => setSheet(null)} title="Add expense">
        <AddExpenseForm onDone={() => setSheet(null)} />
      </BottomSheet>
      <BottomSheet open={sheet === 'account'} onClose={() => setSheet(null)} title="Add account">
        <AddAccountForm onDone={() => setSheet(null)} cur={cur} />
      </BottomSheet>
      <BottomSheet open={sheet === 'saving'} onClose={() => setSheet(null)} title="New savings goal">
        <AddSavingForm onDone={() => setSheet(null)} cur={cur} />
      </BottomSheet>
    </div>
  );
}

function Section({ title, action, children }) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <p className="section-title">{title}</p>
        {action}
      </div>
      {children}
    </section>
  );
}

function AddBtn({ onClick }) {
  return <button onClick={onClick} className="btn-soft h-8 !px-3 !py-1 text-xs"><Plus size={14} /> Add</button>;
}

function AffordCheck({ cur, accounts, expenses }) {
  const [amount, setAmount] = useState('');
  const v = amount ? affordVerdict(parseFloat(amount) || 0, accounts, expenses) : null;
  const msg = v ? affordNote(v.level) : null;
  const toneColor = { good: 'text-money', warn: 'text-gym', bad: 'text-rose-500', muted: 'text-muted' };

  return (
    <div className="card-pad">
      <div className="mb-2 flex items-center gap-2">
        <Calculator size={18} className="text-money" />
        <p className="font-semibold">Can I afford this?</p>
      </div>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-muted">{currencySymbol(cur)}</span>
        <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="How much?" className="input pl-8" />
      </div>
      {msg && (
        <div className="mt-2">
          <p className={`text-sm font-semibold ${toneColor[msg.tone]}`}>{msg.text}</p>
          {v && v.level !== 'unknown' && v.level !== 'over' && (
            <p className="mt-0.5 text-xs text-muted">
              Leaves you {formatMoney(v.after, cur)}{v.runwayAfter != null ? ` · ~${v.runwayAfter} days of runway` : ''}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function AddAccountForm({ onDone, cur }) {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [busy, setBusy] = useState(false);
  const { toast } = useFeedback();
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try { await addAccount({ name, balance }); onDone(); }
    catch (err) { toast(err.message, 'bad'); }
    finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-4 pb-4">
      <div>
        <label className="label">Name</label>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Cash, Bank, e-wallet…" className="input" maxLength={40} />
      </div>
      <div>
        <label className="label">Current balance ({cur})</label>
        <input type="number" inputMode="decimal" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0.00" className="input" />
      </div>
      <button disabled={busy} className="btn-primary w-full">Add account</button>
    </form>
  );
}

function AddSavingForm({ onDone, cur }) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState(false);
  const { celebrate, toast } = useFeedback();
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try { await addSaving({ name, target, saved }); celebrate('Goal added'); onDone(); }
    catch (err) { toast(err.message, 'bad'); }
    finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-4 pb-4">
      <div><label className="label">Saving for…</label><input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="New laptop, trip…" className="input" maxLength={40} /></div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div><label className="label">Target ({cur})</label><input type="number" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="0.00" className="input" /></div>
        <div><label className="label">Saved so far</label><input type="number" inputMode="decimal" value={saved} onChange={(e) => setSaved(e.target.value)} placeholder="0.00" className="input" /></div>
      </div>
      <button disabled={busy} className="btn-primary w-full">Create goal</button>
    </form>
  );
}
