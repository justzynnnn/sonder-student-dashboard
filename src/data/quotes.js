import { db } from './db';
import { generateId } from '../lib/ids';
import { sanitizeText } from '../lib/sanitize';

const LEGACY_SEED_QUOTES = [
  { text: "Small steps every day add up to big change.", author: 'Sonder' },
  { text: "You don't have to be perfect to make progress.", author: 'Sonder' },
  { text: 'Discipline is choosing what you want most over what you want now.', author: '' },
  { text: 'Take care of your money and your money takes care of you.', author: '' },
  { text: 'A little progress each day adds up to big results.', author: '' },
];

const legacySeedKeys = new Set(LEGACY_SEED_QUOTES.map((q) => `${q.text}\n${q.author}`));

export async function clearLegacySeedQuotesForFreshSetup() {
  const settings = await db.settings.get('app');
  if (settings?.onboarded) return;

  const rows = await db.quotes.toArray();
  const legacyIds = rows
    .filter((q) => legacySeedKeys.has(`${q.text}\n${q.author || ''}`))
    .map((q) => q.id);

  if (legacyIds.length > 0) await db.quotes.bulkDelete(legacyIds);
}

export async function addQuote({ text, author }) {
  const clean = sanitizeText(text, 200);
  if (!clean) throw new Error('Write something first');
  const quote = {
    id: generateId(),
    text: clean,
    author: sanitizeText(author, 40),
    pinned: 0,
    createdAt: new Date().toISOString(),
  };
  await db.quotes.add(quote);
  return quote;
}

export async function deleteQuote(id) {
  await db.quotes.delete(id);
}

// Pin exactly one (toggles). Pinning clears any other pin so only one shows.
export async function togglePin(id) {
  const q = await db.quotes.get(id);
  if (!q) return;
  const willPin = !q.pinned;
  await db.transaction('rw', db.quotes, async () => {
    if (willPin) {
      const pinned = await db.quotes.filter((x) => !!x.pinned).toArray();
      await Promise.all(pinned.map((p) => db.quotes.update(p.id, { pinned: 0 })));
    }
    await db.quotes.update(id, { pinned: willPin ? 1 : 0 });
  });
}

// Deterministic daily pick: pinned quote wins; otherwise rotate by day-of-year.
export function pickDailyQuote(quotes) {
  if (!quotes || quotes.length === 0) return null;
  const pinned = quotes.find((q) => q.pinned);
  if (pinned) return pinned;
  const sorted = [...quotes].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - start) / 86_400_000);
  return sorted[dayOfYear % sorted.length];
}
