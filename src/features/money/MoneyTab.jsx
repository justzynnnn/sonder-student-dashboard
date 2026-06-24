import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Banknote, Calculator, CreditCard, Plus, Sparkles, Trash2, Wallet } from 'lucide-react';
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
import { domainCategoryMeta } from '../../data/categories';
import { moneyNote, affordNote } from '../../lib/encouragement';
import {
  moneyOverview,
  spentInPeriod,
  spendingByCategory,
  affordVerdict,
  addAccount,
  deleteAccount,
  payCreditCard,
  deleteExpense,
} from '../../data/money';

const ACCOUNT_TYPE_OPTIONS = [
  { id: 'cash', label: 'Cash' },
  { id: 'debit', label: 'Debit' },
  { id: 'credit', label: 'Credit' },
];

export default function MoneyTab() {
  const { settings } = useSettings();
  const cur = settings.baseCurrency;
  const [period, setPeriod] = useState('week');
  const [sheet, setSheet] = useState(null);
  const [payingCard, setPayingCard] = useState(null);

  const expenses = useLiveQuery(() => db.expenses.orderBy('date').reverse().toArray(), [], []);
  const accounts = useLiveQuery(() => db.accounts.toArray(), [], []);
  const customCategories = useLiveQuery(() => db.customCategories.where('domain').equals('money').toArray(), [], []);

  const accountList = accounts || [];
  const money = moneyOverview(accountList, expenses || []);
  const spent = spentInPeriod(expenses || [], period);
  const byCat = spendingByCategory(expenses || [], period);
  const note = moneyNote({ hasAccounts: money.hasAccounts, runway: money.runway });
  const colorFor = (name) => domainCategoryMeta('money', name, customCategories || []).color;

  return (
    <div className="animate-fade-up space-y-4">
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Money</h1>

      <div className="card-pad">
        {money.hasAccounts ? (
          <div className="flex items-center gap-5">
            <ProgressRing value={money.runway != null ? Math.min(1, money.runway / 30) : 1} size={104} stroke={11} color="rgb(var(--money))">
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase text-muted">runway</p>
                <p className="text-sm font-extrabold">{money.runway != null ? `${money.runway}d` : 'steady'}</p>
              </div>
            </ProgressRing>
            <div className="min-w-0 flex-1">
              <p className="section-title">Available cash</p>
              <p className="font-display text-3xl font-extrabold text-money">{formatMoney(money.total, cur)}</p>
              <p className="mt-1 text-xs text-muted">
                {accountList.length} account{accountList.length === 1 ? '' : 's'} - {money.burn > 0 ? `~${formatMoney(money.burn, cur)}/day` : 'no spend pace yet'}
              </p>
              {money.credit.cards.length ? (
                <p className="mt-1 text-xs font-semibold text-muted">
                  Credit due: {formatMoney(money.credit.due, cur)} / {formatMoney(money.credit.limit, cur)}
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <button onClick={() => setSheet('account')} className="flex w-full items-center gap-3 text-left">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-money/15 text-money"><Wallet size={22} /></span>
            <div>
              <p className="font-bold">Add your first account</p>
              <p className="text-sm text-muted">Track cash, debit, or credit cards.</p>
            </div>
          </button>
        )}
        <div className="mt-3 flex items-start gap-2 rounded-2xl bg-money/8 p-3">
          <Sparkles size={16} className="mt-0.5 shrink-0 text-money" />
          <p className="text-sm font-medium text-ink">{note}</p>
        </div>
      </div>

      <AffordCheck cur={cur} accounts={accountList} expenses={expenses || []} />

      <Section title="Accounts" action={<AddBtn onClick={() => setSheet('account')} />}>
        {accountList.length === 0 ? (
          <p className="px-1 text-sm text-muted">No accounts yet. Add cash, debit, or a credit card.</p>
        ) : (
          <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
            {accountList.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                cur={cur}
                onPay={() => setPayingCard(account)}
                onDelete={() => deleteAccount(account.id)}
              />
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Spending"
        action={<SegmentedControl className="w-40" options={[{ id: 'week', label: 'Week' }, { id: 'month', label: 'Month' }]} value={period} onChange={setPeriod} />}
      >
        {byCat.length === 0 ? (
          <p className="px-1 text-sm text-muted">No spending logged this {period}. Tap + to add one.</p>
        ) : (
          <div className="card-pad flex items-center gap-5">
            <CategoryDonut data={byCat} total={spent} colorFor={colorFor} />
            <ul className="min-w-0 flex-1 space-y-2">
              {byCat.slice(0, 5).map((row) => (
                <li key={row.category} className="flex items-center gap-2 text-sm">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: colorFor(row.category) }} />
                  <span className="min-w-0 flex-1 truncate">{row.category}</span>
                  <span className="shrink-0 font-semibold">{formatMoney(row.total, cur)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      <Section title="Recent">
        {(expenses || []).length === 0 ? (
          <EmptyState icon={Wallet} title="No expenses yet" hint="Log your first one with the + button." />
        ) : (
          <ul className="space-y-2">
            {(expenses || []).slice(0, 12).map((expense) => (
              <li key={expense.id} className="card flex items-center gap-3 p-3">
                <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ background: colorFor(expense.category) }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{expense.description || expense.category}</p>
                  <p className="text-xs text-muted">{humanDate(expense.date)} - {expense.category}</p>
                </div>
                <span className="font-display font-extrabold">{formatMoney(expense.amount, cur)}</span>
                <button onClick={() => deleteExpense(expense.id)} aria-label="Delete" className="text-muted hover:text-rose-500"><Trash2 size={15} /></button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <button onClick={() => setSheet('expense')} className="btn-add-primary w-full">
        <span className="add-symbol"><Plus size={16} /></span>
        Add expense
      </button>

      <BottomSheet open={sheet === 'expense'} onClose={() => setSheet(null)} title="Add expense">
        <AddExpenseForm onDone={() => setSheet(null)} />
      </BottomSheet>
      <BottomSheet open={sheet === 'account'} onClose={() => setSheet(null)} title="Add account">
        <AddAccountForm onDone={() => setSheet(null)} cur={cur} />
      </BottomSheet>
      <BottomSheet open={!!payingCard} onClose={() => setPayingCard(null)} title="Pay credit card">
        {payingCard ? <PayCreditForm card={payingCard} cur={cur} onDone={() => setPayingCard(null)} /> : null}
      </BottomSheet>
    </div>
  );
}

function AccountCard({ account, cur, onPay, onDelete }) {
  const isCredit = account.type === 'credit';
  const due = account.balance || 0;
  const limit = account.creditLimit || 0;
  const available = Math.max(0, limit - due);
  const Icon = isCredit ? CreditCard : account.type === 'debit' ? Banknote : Wallet;

  return (
    <div className="card relative w-48 shrink-0 p-4">
      <button onClick={onDelete} aria-label="Delete account" className="absolute right-2 top-2 text-muted hover:text-rose-500"><Trash2 size={14} /></button>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-money/15 text-money"><Icon size={18} /></span>
      <p className="mt-2 truncate text-sm font-semibold">{account.name}</p>
      <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-muted">{isCredit ? 'Credit card' : account.type || 'Cash'}</p>
      {isCredit ? (
        <>
          <p className="mt-1 font-display text-lg font-extrabold">{formatMoney(due, cur)} due</p>
          <p className="text-xs text-muted">{formatMoney(available, cur)} available</p>
          <button type="button" onClick={onPay} className="mt-3 min-h-9 w-full rounded-2xl bg-money/10 px-3 text-xs font-bold text-money transition hover:bg-money/15 active:scale-95">
            Pay card
          </button>
        </>
      ) : (
        <p className="mt-1 font-display text-lg font-extrabold">{formatMoney(account.balance || 0, cur)}</p>
      )}
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
  return (
    <button onClick={onClick} className="btn-add-soft min-h-9 !px-3 !py-1 text-xs">
      <span className="add-symbol-soft"><Plus size={13} /></span>
      Add
    </button>
  );
}

function AffordCheck({ cur, accounts, expenses }) {
  const [amount, setAmount] = useState('');
  const parsed = parseFloat(amount) || 0;
  const verdict = parsed ? affordVerdict(parsed, accounts, expenses) : null;
  const msg = verdict ? affordNote(verdict.level, verdict) : null;
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
      {msg ? (
        <div className="mt-2">
          <p className={`text-sm font-semibold ${toneColor[msg.tone]}`}>{msg.text}</p>
          {verdict.level !== 'unknown' ? (
            <p className="mt-0.5 text-xs leading-relaxed text-muted">
              {verdict.burn > 0
                ? `After your usual pace for the rest of the month, cushion would be ${formatMoney(verdict.cushionAfter, cur)}.`
                : `With no spend pace yet, this is judged by how much of available cash it uses.`}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function AddAccountForm({ onDone, cur }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('cash');
  const [balance, setBalance] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [busy, setBusy] = useState(false);
  const { toast } = useFeedback();

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await addAccount({ name, type, balance, creditLimit });
      onDone();
    } catch (err) {
      toast(err.message, 'bad');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 pb-4">
      <div>
        <label className="label">Name</label>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Cash, bank, student card..." className="input" maxLength={40} />
      </div>
      <div>
        <label className="label">Type</label>
        <div className="grid grid-cols-3 gap-2">
          {ACCOUNT_TYPE_OPTIONS.map((option) => {
            const active = option.id === type;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setType(option.id)}
                className={`min-h-11 rounded-2xl border px-2 text-sm font-bold transition active:scale-[0.98] ${active ? 'border-money bg-money/10 text-money' : 'border-line bg-surface-2 text-muted'}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
      {type === 'credit' ? (
        <div>
          <label className="label">Credit limit ({cur})</label>
          <input type="number" inputMode="decimal" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} placeholder="0.00" className="input" />
        </div>
      ) : (
        <div>
          <label className="label">Current balance ({cur})</label>
          <input type="number" inputMode="decimal" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0.00" className="input" />
        </div>
      )}
      <button disabled={busy} className="btn-add-primary w-full">
        <span className="add-symbol"><Plus size={16} /></span>
        {busy ? 'Saving...' : 'Add account'}
      </button>
    </form>
  );
}

function PayCreditForm({ card, cur, onDone }) {
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const { toast } = useFeedback();

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await payCreditCard(card.id, amount);
      toast('Payment logged', 'good');
      onDone();
    } catch (err) {
      toast(err.message, 'bad');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 pb-4">
      <div className="rounded-[1.35rem] border border-line bg-surface-2 p-3">
        <p className="text-sm font-bold">{card.name}</p>
        <p className="mt-1 text-xs text-muted">Current due: {formatMoney(card.balance || 0, cur)}</p>
      </div>
      <div>
        <label className="label">Payment amount ({cur})</label>
        <input autoFocus type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="input" />
      </div>
      <button disabled={busy} className="btn-add-primary w-full">
        {busy ? 'Saving...' : 'Log payment'}
      </button>
    </form>
  );
}
