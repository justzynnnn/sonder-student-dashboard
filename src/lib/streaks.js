import { toISO } from './dates';

// Current streak = consecutive days with a check-in ending today (or yesterday,
// so the streak isn't "lost" until a full day is missed). Longest = best ever.
export function computeStreak(dates) {
  const set = new Set(dates || []);
  if (set.size === 0) return { current: 0, longest: 0 };

  const dayMs = 86_400_000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Current streak
  let current = 0;
  const startsToday = set.has(toISO(today));
  const cursor = new Date(today);
  if (!startsToday) cursor.setTime(cursor.getTime() - dayMs); // allow ending yesterday
  while (set.has(toISO(cursor))) {
    current += 1;
    cursor.setTime(cursor.getTime() - dayMs);
  }

  // Longest streak across all recorded days
  const sorted = [...set].sort();
  let longest = 0;
  let run = 0;
  let prev = null;
  for (const d of sorted) {
    if (prev && (new Date(d) - new Date(prev)) === dayMs) run += 1;
    else run = 1;
    longest = Math.max(longest, run);
    prev = d;
  }

  return { current, longest };
}
