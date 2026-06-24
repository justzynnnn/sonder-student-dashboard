import { db } from './db';
import { generateId } from '../lib/ids';
import { recordCheckin } from './checkins';
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

export async function updateAccount(id, { name, balance, creditLimit }) {
  const acc = await db.accounts.get(id);
  if (!acc) return;
  const clean = {};
  if (name !== undefined) {
    const n = sanitizeText(name, 40);
    if (n) clean.name = n;
  }
  if (acc.type === 'credit') {
    if (creditLimit !== undefined) clean.creditLimit = sanitizeAmount(creditLimit, { allowZero: true }) ?? 0;
  } else if (balance !== undefined) {
    clean.balance = sanitizeAmount(balance, { allowZero: true, allowNegative: true }) ?? 0;
  }
  await db.accounts.update(id, clean);
}

export async function deleteAccount(id) {
  await db.accounts.delete(id);
}

export async function addExpense({ amount, category, description, date, accountId }, { activity = true } = {}) {
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
  if (activity) recordCheckin(); // logging an expense earns today's check-in
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

// Edit an expense in place, reversing its old balance effect before applying
// the new one so account balances stay consistent.
export async function updateExpense(id, { amount, category, description, date, accountId }) {
  const amt = sanitizeAmount(amount);
  if (amt === null) throw new Error('Enter an amount greater than zero');
  await db.transaction('rw', db.expenses, db.accounts, async () => {
    const old = await db.expenses.get(id);
    if (!old) return;
    if (old.accountId) {
      const a = await db.accounts.get(old.accountId);
      await adjustAccount(old.accountId, a?.type === 'credit' ? -old.amount : old.amount);
    }
    const next = {
      ...old,
      amount: amt,
      category: sanitizeCategory(category),
      description: sanitizeText(description, 80),
      date: sanitizeDate(date),
      accountId: accountId || null,
    };
    await db.expenses.put(next);
    if (next.accountId) {
      const a = await db.accounts.get(next.accountId);
      await adjustAccount(next.accountId, a?.type === 'credit' ? amt : -amt);
    }
  });
}

// ---------- Income (money in — raises balances) ----------
export async function addIncome({ amount, source, date, accountId }, { activity = true } = {}) {
  const amt = sanitizeAmount(amount);
  if (amt === null) throw new Error('Enter an amount greater than zero');
  const income = {
    id: generateId(),
    amount: amt,
    source: sanitizeText(source, 80),
    date: sanitizeDate(date),
    accountId: accountId || null,
    createdAt: new Date().toISOString(),
  };
  await db.transaction('rw', db.incomes, db.accounts, async () => {
    await db.incomes.add(income);
    if (income.accountId) {
      const account = await db.accounts.get(income.accountId);
      // Income onto a credit card pays it down; elsewhere it adds to balance.
      await adjustAccount(income.accountId, account?.type === 'credit' ? -amt : amt);
    }
  });
  if (activity) recordCheckin();
  return income;
}

export async function deleteIncome(id) {
  await db.transaction('rw', db.incomes, db.accounts, async () => {
    const income = await db.incomes.get(id);
    if (!income) return;
    await db.incomes.delete(id);
    if (income.accountId) {
      const account = await db.accounts.get(income.accountId);
      await adjustAccount(income.accountId, account?.type === 'credit' ? income.amount : -income.amount);
    }
  });
}

export async function updateIncome(id, { amount, source, date, accountId }) {
  const amt = sanitizeAmount(amount);
  if (amt === null) throw new Error('Enter an amount greater than zero');
  await db.transaction('rw', db.incomes, db.accounts, async () => {
    const old = await db.incomes.get(id);
    if (!old) return;
    if (old.accountId) {
      const a = await db.accounts.get(old.accountId);
      await adjustAccount(old.accountId, a?.type === 'credit' ? old.amount : -old.amount);
    }
    const next = {
      ...old,
      amount: amt,
      source: sanitizeText(source, 80),
      date: sanitizeDate(date),
      accountId: accountId || null,
    };
    await db.incomes.put(next);
    if (next.accountId) {
      const a = await db.accounts.get(next.accountId);
      await adjustAccount(next.accountId, a?.type === 'credit' ? -amt : amt);
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

// Average daily flow of a dated list over the trailing window.
function dailyRate(rows, days = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffISO = toISO(cutoff);
  const recent = (rows || []).filter((row) => (row.date || '') >= cutoffISO);
  if (recent.length === 0) return 0;
  const total = recent.reduce((sum, row) => sum + (row.amount || 0), 0);
  return Math.round((total / days) * 100) / 100;
}

export function dailyBurn(expenses, days = 30) {
  return dailyRate(expenses, days);
}

export function dailyIncome(incomes, days = 30) {
  return dailyRate(incomes, days);
}

export function moneyOverview(accounts, expenses, incomes = []) {
  const total = totalBalance(accounts);
  const burn = dailyBurn(expenses, 30);
  const income = dailyIncome(incomes, 30);
  // Runway off NET burn — income offsets spending instead of being ignored.
  const netBurn = Math.max(0, Math.round((burn - income) * 100) / 100);
  const runway = netBurn > 0 ? Math.floor(total / netBurn) : null;
  return {
    total,
    burn,
    income,
    netBurn,
    runway,
    credit: creditSummary(accounts),
    hasAccounts: (accounts || []).length > 0,
  };
}

export function affordVerdict(amount, accounts, expenses, incomes = []) {
  const { total, burn, income, hasAccounts } = moneyOverview(accounts, expenses, incomes);
  if (!hasAccounts) return { level: 'unknown', total: 0, burn, paceDays: null, cushionAfter: null };
  const paceDays = burn > 0 ? amount / burn : null;
  if (amount > total && total > 0) {
    return { level: 'over', total, burn, income, paceDays, cushionAfter: Math.round((total - amount) * 100) / 100 };
  }

  // Net the rest-of-month spend against expected income before judging.
  const expectedRest = burn > 0 ? Math.max(0, (burn - income)) * daysLeftInMonth() : 0;
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

  return { level, total, burn, income, expectedRest: Math.round(expectedRest * 100) / 100, paceDays, cushionAfter };
}

export function spendingByCategory(expenses, period) {
  const rows = expensesInPeriod(expenses, period);
  const map = new Map();
  for (const expense of rows) map.set(expense.category, (map.get(expense.category) || 0) + expense.amount);
  return [...map.entries()]
    .map(([category, total]) => ({ category, total: Math.round(total * 100) / 100 }))
    .sort((a, b) => b.total - a.total);
}

// ---------- Trends (history beyond the current period) ----------
// Spend (and income) totalled per ISO week for the last `weeks` weeks, oldest
// first. Used by the Money trend chart so a semester of data is visible.
export function weeklyTotals(expenses, incomes, weeks = 8) {
  const start = startOfWeek();
  const buckets = [];
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const ws = new Date(start);
    ws.setDate(start.getDate() - i * 7);
    const we = new Date(ws);
    we.setDate(ws.getDate() + 7);
    const from = toISO(ws);
    const to = toISO(we);
    const spent = (expenses || [])
      .filter((e) => (e.date || '') >= from && (e.date || '') < to)
      .reduce((s, e) => s + (e.amount || 0), 0);
    const earned = (incomes || [])
      .filter((e) => (e.date || '') >= from && (e.date || '') < to)
      .reduce((s, e) => s + (e.amount || 0), 0);
    buckets.push({ weekStart: from, spent: Math.round(spent * 100) / 100, earned: Math.round(earned * 100) / 100 });
  }
  return buckets;
}
