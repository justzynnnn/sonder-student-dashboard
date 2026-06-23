import { db } from './db';

// Full local data export — true data ownership (privacy requirement).
export async function exportBackup() {
  const tables = db.tables.map((t) => t.name);
  const dump = {};
  for (const name of tables) {
    // eslint-disable-next-line no-await-in-loop
    dump[name] = await db.table(name).toArray();
  }
  return {
    app: 'Sonder',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: dump,
  };
}

export function downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Erase EVERYTHING on this device, then reopen an empty DB so the app keeps
// working. Local-only app => this is the complete "delete my data" path.
export async function clearAllData() {
  await db.delete();
  try {
    localStorage.removeItem('sonder-theme');
  } catch {
    /* ignore */
  }
  await db.open();
}
