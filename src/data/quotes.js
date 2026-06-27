import { db } from './db';
import { generateId } from '../lib/ids';
import { sanitizeText } from '../lib/sanitize';

export const BUNDLED_QUOTES = [
  { text: "You don't have to be great to start, but you have to start to be great.", author: 'Zig Ziglar' },
  { text: 'Do what you can, with what you have, where you are.', author: 'Theodore Roosevelt' },
  { text: 'It is okay to be at a place of struggle. Struggle is just another word for growth.', author: 'Idowu Koyenikan' },
  { text: 'Grief is not a disorder, a disease, or a sign of weakness. It is an emotional, physical, and spiritual necessity.', author: 'Doug Manning' },
  { text: 'There is no moving on without grief. Grief IS how we move.', author: 'Claire Bidwell Smith, LCPC, author of Anxiety: The Missing Stage of Grief' },
  { text: 'Sometimes the bravest and most important thing you can do is just show up.', author: 'Bren\u00e9 Brown, PhD, LMSW, author of Daring Greatly' },
  { text: 'Rock bottom became the solid foundation on which I rebuilt my life.', author: 'J.K. Rowling' },
  { text: "Courage does not always roar. Sometimes courage is the quiet voice at the end of the day saying, 'I will try again tomorrow.'", author: 'Mary Anne Radmacher' },
  { text: 'Hard times are not the enemy of a good life. They are part of it.', author: 'Attributed broadly to modern resilience literature' },
  { text: 'Even the darkest night will end and the sun will rise.', author: 'Victor Hugo, Les Mis\u00e9rables' },
  { text: 'Although the world is full of suffering, it is also full of the overcoming of it.', author: 'Helen Keller' },
  { text: "The human capacity for burden is like bamboo. Far more flexible than you'd ever believe at first glance.", author: "Jodi Picoult, My Sister's Keeper" },
];

export async function seedBundledQuotesIfEmpty() {
  const count = await db.quotes.count();
  if (count > 0) return;

  const now = Date.now();
  await db.quotes.bulkAdd(
    BUNDLED_QUOTES.map((q, i) => ({
      id: generateId(),
      text: q.text,
      author: q.author,
      pinned: 0,
      createdAt: new Date(now + i).toISOString(),
    })),
  );
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
