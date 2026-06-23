import { db } from './db';
import { generateId } from '../lib/ids';
import {
  sanitizeText, sanitizeAmount, sanitizeCategory, sanitizeDate,
} from '../lib/sanitize';
import { startOfWeek, startOfMonth, toISO } from '../lib/dates';

// ---------- Accounts (wallets) ----------
export async function addAccount({ name, balance }) {
  const clean = sanitizeText(name, 40);
  if (!clean) throw new Error('Name your account');
  const account = {
    id: generateId(),
    name: clean,
    balance: sanitizeAmount(balance, { allowZero: true, allowNegative: true }) ?? 0,
    createdAt: new Date().toISOString(),
  };
  await db.accounts.add(account);
  return account;
}

export async function adjustAccount(id, delta) {
  const acc = await db.accounts.get(id);
  if (!acc) return;
  await db.accounts.update(id, { balance: Math.round((acc.balance + delta) * 100) / 100 });
}

export async function deleteAccount(id) {
  await db.accounts.delete(id);
}

// ---------- Expenses ----------
export async function addExpense({ amount, category, description, date, accountId }) {
  const amt = sanitizeAmount(amount);
  if (amt === null) throw new Error('Enter an amount greater than zero');
  const expense = {
    id: generateId(),
    amount: amt,
    category: sanitizeCategory(category),
    description: sanitizeText(description, 80),
    date: sanitizeDate(date),
    accountId: accountId || null,
    createdAt: new Date().toISOString(),
  };
  await db.transaction('rw', db.expenses, db.accounts, async () => {
    await db.expenses.add(expense);
    if (expense.accountId) await adjustAccount(expense.accountId, -amt);
  });
  return expense;
}

export async function deleteExpense(id) {
  await db.transaction('rw', db.expenses, db.accounts, async () => {
    const e = await db.expenses.get(id);
    if (!e) return;
    await db.expenses.delete(id);
    if (e.accountId) await adjustAccount(e.accountId, e.amount); // refund
  });
}

// ---------- Budgets (per-category monthly limit) ----------
export async function setBudget(category, limit) {
  const lim = sanitizeAmount(limit, { allowZero: true });
  if (lim === null || lim === 0) {
    await db.budgets.delete(category);
  } else {
    await db.budgets.put({ category, limit: lim });
  }
}

// ---------- Savings goals ----------
export async function addSaving({ name, target, saved }) {
  const clean = sanitizeText(name, 40);
  if (!clean) throw new Error('Name your savings goal');
  const t = sanitizeAmount(target);
  if (t === null) throw new Error('Set a target amount');
  const item = {
    id: generateId(),
    name: clean,
    target: t,
    saved: sanitizeAmount(saved, { allowZero: true }) ?? 0,
    createdAt: new Date().toISOString(),
  };
  await db.savings.add(item);
  return item;
}

export async function addToSaving(id, delta) {
  const s = await db.savings.get(id);
  if (!s) return;
  const next = Math.max(0, Math.round((s.saved + (sanitizeAmount(delta, { allowNegative: true }) ?? 0)) * 100) / 100);
  await db.savings.update(id, { saved: next });
}

export async function deleteSaving(id) {
  await db.savings.delete(id);
}

// ---------- Derived insights (pure helpers over already-loaded rows) ----------
export function periodStartISO(period) {
  return toISO(period === 'month' ? startOfMonth() : startOfWeek());
}

export function expensesInPeriod(expenses, period) {
  const start = periodStartISO(period);
  return (expenses || []).filter((e) => (e.date || '') >= start);
}

export function spentInPeriod(expenses, period) {
  return expensesInPeriod(expenses, period).reduce((sum, e) => sum + (e.amount || 0), 0);
}

// Total money the student actually has across all accounts.
export function totalBalance(accounts) {
  return Math.round((accounts || []).reduce((s, a) => s + (a.balance || 0), 0) * 100) / 100;
}

// Average daily spend over the trailing `days` window (their real burn rate).
export function dailyBurn(expenses, days = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffISO = toISO(cutoff);
  const recent = (expenses || []).filter((e) => (e.date || '') >= cutoffISO);
  if (recent.length === 0) return 0;
  const total = recent.reduce((s, e) => s + (e.amount || 0), 0);
  return Math.round((total / days) * 100) / 100;
}

// Money-smart snapshot: how much they have, how fast they spend, how long it lasts.
export function moneyOverview(accounts, expenses) {
  const total = totalBalance(accounts);
  const burn = dailyBurn(expenses, 30);
  const runway = burn > 0 ? Math.floor(total / burn) : null; // null = no spend history yet
  return { total, burn, runway, hasAccounts: (accounts || []).length > 0 };
}

// "Can I afford this?" judged against what they actually have + their burn rate.
// No budget/allowance needed — it reasons about real money and runway impact.
export function affordVerdict(amount, accounts, expenses) {
  const { total, burn, hasAccounts } = moneyOverview(accounts, expenses);
  if (!hasAccounts) return { level: 'unknown', total: 0, after: 0, runwayAfter: null };
  const after = Math.round((total - amount) * 100) / 100;
  const runwayAfter = burn > 0 ? Math.floor(Math.max(0, after) / burn) : null;
  if (amount > total) return { level: 'over', total, after, runwayAfter };
  const pct = total > 0 ? amount / total : 1;
  let level;
  if (pct <= 0.1) level = 'yes';
  else if (pct <= 0.3) level = 'tight';
  else level = 'no';
  return { level, total, after, pct, runwayAfter };
}

export function spendingByCategory(expenses, period) {
  const rows = expensesInPeriod(expenses, period);
  const map = new Map();
  for (const e of rows) map.set(e.category, (map.get(e.category) || 0) + e.amount);
  return [...map.entries()]
    .map(([category, total]) => ({ category, total: Math.round(total * 100) / 100 }))
    .sort((a, b) => b.total - a.total);
}
