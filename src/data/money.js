import { db } from './db';
import { generateId } from '../lib/ids';
import {
  sanitizeText, sanitizeAmount, sanitizeCategory, sanitizeDate, sanitizeEnum,
} from '../lib/sanitize';
import { startOfWeek, startOfMonth, toISO, daysLeftInMonth } from '../lib/dates';

export const ACCOUNT_TYPES = ['cash', 'debit', 'credit'];

export async function addAccount({ name, balance, type = 'cash', creditLimit }) {
  const clean = sanitizeText(name, 40);
  if (!clean) throw new Error('Name your account');
  const accountType = sanitizeEnum(type, ACCOUNT_TYPES, 'cash');
  const limit = accountType === 'credit' ? (sanitizeAmount(creditLimit) ?? 0) : 0;
  const account = {
    id: generateId(),
    name: clean,
    type: accountType,
    balance: accountType === 'credit' ? 0 : (sanitizeAmount(balance, { allowZero: true, allowNegative: true }) ?? 0),
    creditLimit: limit,
    createdAt: new Date().toISOString(),
  };
  await db.accounts.add(account);
  return account;
}

export async function adjustAccount(id, delta) {
  const acc = await db.accounts.get(id);
  if (!acc) return;
  await db.accounts.update(id, { balance: Math.round(((acc.balance || 0) + delta) * 100) / 100 });
}

export async function payCreditCard(id, amount) {
  const amt = sanitizeAmount(amount);
  if (amt === null) throw new Error('Enter a payment amount');
  const acc = await db.accounts.get(id);
  if (!acc || acc.type !== 'credit') return null;
  const next = Math.max(0, Math.round(((acc.balance || 0) - amt) * 100) / 100);
  await db.accounts.update(id, { balance: next });
  return next;
}

export async function deleteAccount(id) {
  await db.accounts.delete(id);
}

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
    if (expense.accountId) {
      const account = await db.accounts.get(expense.accountId);
      await adjustAccount(expense.accountId, account?.type === 'credit' ? amt : -amt);
    }
  });
  return expense;
}

export async function deleteExpense(id) {
  await db.transaction('rw', db.expenses, db.accounts, async () => {
    const expense = await db.expenses.get(id);
    if (!expense) return;
    await db.expenses.delete(id);
    if (expense.accountId) {
      const account = await db.accounts.get(expense.accountId);
      await adjustAccount(expense.accountId, account?.type === 'credit' ? -expense.amount : expense.amount);
    }
  });
}

export async function setBudget(category, limit) {
  const lim = sanitizeAmount(limit, { allowZero: true });
  if (lim === null || lim === 0) {
    await db.budgets.delete(category);
  } else {
    await db.budgets.put({ category, limit: lim });
  }
}

export function periodStartISO(period) {
  return toISO(period === 'month' ? startOfMonth() : startOfWeek());
}

export function expensesInPeriod(expenses, period) {
  const start = periodStartISO(period);
  return (expenses || []).filter((expense) => (expense.date || '') >= start);
}

export function spentInPeriod(expenses, period) {
  return expensesInPeriod(expenses, period).reduce((sum, expense) => sum + (expense.amount || 0), 0);
}

export function totalBalance(accounts) {
  return Math.round((accounts || [])
    .filter((account) => account.type !== 'credit')
    .reduce((sum, account) => sum + (account.balance || 0), 0) * 100) / 100;
}

export function creditSummary(accounts) {
  const cards = (accounts || []).filter((account) => account.type === 'credit');
  const due = Math.round(cards.reduce((sum, account) => sum + (account.balance || 0), 0) * 100) / 100;
  const limit = Math.round(cards.reduce((sum, account) => sum + (account.creditLimit || 0), 0) * 100) / 100;
  const available = Math.max(0, Math.round((limit - due) * 100) / 100);
  return { cards, due, limit, available, utilization: limit > 0 ? due / limit : 0 };
}

export function dailyBurn(expenses, days = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffISO = toISO(cutoff);
  const recent = (expenses || []).filter((expense) => (expense.date || '') >= cutoffISO);
  if (recent.length === 0) return 0;
  const total = recent.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  return Math.round((total / days) * 100) / 100;
}

export function moneyOverview(accounts, expenses) {
  const total = totalBalance(accounts);
  const burn = dailyBurn(expenses, 30);
  const runway = burn > 0 ? Math.floor(total / burn) : null;
  return {
    total,
    burn,
    runway,
    credit: creditSummary(accounts),
    hasAccounts: (accounts || []).length > 0,
  };
}

export function affordVerdict(amount, accounts, expenses) {
  const { total, burn, hasAccounts } = moneyOverview(accounts, expenses);
  if (!hasAccounts) return { level: 'unknown', total: 0, burn, paceDays: null, cushionAfter: null };
  const paceDays = burn > 0 ? amount / burn : null;
  if (amount > total && total > 0) {
    return { level: 'over', total, burn, paceDays, cushionAfter: Math.round((total - amount) * 100) / 100 };
  }

  const expectedRest = burn > 0 ? burn * daysLeftInMonth() : 0;
  const cushionAfter = Math.round((total - expectedRest - amount) * 100) / 100;

  let level = 'yes';
  if (burn <= 0) {
    const pct = total > 0 ? amount / total : 1;
    if (pct > 0.3) level = 'no';
    else if (pct > 0.12) level = 'tight';
  } else if (cushionAfter < 0 || paceDays > 5) {
    level = 'no';
  } else if (paceDays > 2 || cushionAfter < burn * 3) {
    level = 'tight';
  }

  return { level, total, burn, expectedRest: Math.round(expectedRest * 100) / 100, paceDays, cushionAfter };
}

export function spendingByCategory(expenses, period) {
  const rows = expensesInPeriod(expenses, period);
  const map = new Map();
  for (const expense of rows) map.set(expense.category, (map.get(expense.category) || 0) + expense.amount);
  return [...map.entries()]
    .map(([category, total]) => ({ category, total: Math.round(total * 100) / 100 }))
    .sort((a, b) => b.total - a.total);
}
