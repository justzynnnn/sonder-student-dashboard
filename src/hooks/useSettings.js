import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { DEFAULT_SETTINGS } from '../data/settings';

// Live app settings — re-renders consumers whenever settings change.
// The querier resolves to the row or `null` (never `undefined`) so we can
// distinguish "still loading" (undefined, no result yet) from "no row yet"
// (null → fall back to defaults → onboarding).
export function useSettings() {
  const raw = useLiveQuery(async () => (await db.settings.get('app')) || null);
  const loading = raw === undefined;
  const settings = { ...DEFAULT_SETTINGS, ...(raw || {}) };
  return { settings, loading };
}
