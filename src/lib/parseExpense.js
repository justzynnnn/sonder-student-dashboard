// Natural-language expense parser for one-line "quick log".
// Understands things like:
//   "Lunch 120"            -> { amount: 120, description: 'Lunch' }
//   "Grocery 3.5k gcash"   -> amount 3500, matched to a GCash account
//   "Coffee 80 cc"         -> amount 80, category Coffee, matched to a credit card
//   "60 jeep"              -> amount 60, description 'jeep', category Transport
// Returns { amount, description, category, accountId, accountLabel } or { error }.
import { sanitizeAmount } from './sanitize';
import { suggestCategory } from './categorize';

function parseAmountToken(raw) {
  if (!raw) return null;
  let s = raw.toLowerCase().replace(/[₱$,]/g, '').trim();
  let mult = 1;
  if (/[0-9]k$/.test(s)) { mult = 1_000; s = s.slice(0, -1); }
  else if (/[0-9]m$/.test(s)) { mult = 1_000_000; s = s.slice(0, -1); }
  const n = parseFloat(s);
  if (!Number.isFinite(n)) return null;
  return n * mult;
}

const AMOUNT_RE = /^[₱$]?\d+(?:[.,]\d+)?[km]?$/i;

function matchAccount(token, accounts) {
  const t = token.toLowerCase();
  if (['cc', 'credit', 'card'].includes(t)) return accounts.find((a) => a.type === 'credit') || null;
  if (['cash'].includes(t)) return accounts.find((a) => a.type === 'cash') || null;
  if (['debit', 'bank'].includes(t)) return accounts.find((a) => a.type === 'debit') || null;
  return (
    accounts.find((a) => a.name?.toLowerCase() === t)
    || accounts.find((a) => t.length >= 3 && a.name?.toLowerCase().includes(t))
    || null
  );
}

export function parseExpense(text, { accounts = [], categories = [] } = {}) {
  const cleaned = String(text || '').trim();
  if (!cleaned) return { error: 'Try "Lunch 120" or "Grocery 500 gcash"' };

  const tokens = cleaned.split(/\s+/);
  const known = categories.map((c) => (c.name || c).toLowerCase());
  let amount = null;
  let accountId = null;
  let accountLabel = null;
  let category = null;
  const descParts = [];

  for (const token of tokens) {
    if (amount === null && AMOUNT_RE.test(token)) {
      const val = parseAmountToken(token);
      if (val !== null) { amount = val; continue; }
    }
    if (!accountId) {
      const a = matchAccount(token, accounts);
      if (a) { accountId = a.id; accountLabel = a.name; continue; }
    }
    if (!category && known.includes(token.toLowerCase())) {
      category = (categories.find((c) => (c.name || c).toLowerCase() === token.toLowerCase()));
      category = category?.name || category;
      continue;
    }
    descParts.push(token);
  }

  const safe = sanitizeAmount(amount);
  if (safe === null) return { error: 'Add an amount, e.g. "Lunch 120" or "Grocery 3.5k"' };

  const description = descParts.join(' ').trim() || 'Expense';
  const finalCategory = category || suggestCategory(description) || 'Other';
  return { amount: safe, description, category: finalCategory, accountId, accountLabel };
}
