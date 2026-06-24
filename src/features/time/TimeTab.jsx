import { useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Clock3, Pencil, Play, Plus, Search, Sparkles, Square, Trash2, TrendingUp } from 'lucide-react';
import { db } from '../../data/db';
import { useFeedback } from '../../components/Feedback';
import BottomSheet from '../../components/BottomSheet';
import CategoryPicker from '../../components/CategoryPicker';
import EmptyState from '../../components/EmptyState';
import ProgressRing from '../../components/ProgressRing';
import MiniBars from '../../components/MiniBars';
import { domainCategoryMeta } from '../../data/categories';
import {
  addTimeEntry, updateTimeEntry, deleteTimeEntry, entriesInWeek, entriesToday,
  formatDuration, timeByCategory, totalMinutes, minutesByDayThisWeek,
} from '../../data/time';
import { humanDate, todayISO, WEEKDAY_LABELS } from '../../lib/dates';

const TIMER_KEY = 'sonder-timer-start';
const hhmm = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export default function TimeTab() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [prefill, setPrefill] = useState(null);
  const [query, setQuery] = useState('');
  const entries = useLiveQuery(() => db.timeEntries.orderBy('date').reverse().toArray(), [], []);
  const customCategories = useLiveQuery(() => db.customCategories.where('domain').equals('time').toArray(), [], []);
  const today = entriesToday(entries || []);
  const week = entriesInWeek(entries || []);
  const todayMinutes = totalMinutes(today);
  const weekMinutes = totalMinutes(week);
  const byCategory = useMemo(() => timeByCategory(week), [week]);
  const dayTrend = useMemo(() => minutesByDayThisWeek(entries || []), [entries]);
  const target = 8 * 60;

  const recent = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = entries || [];
    if (!q) return rows;
    return rows.filter((e) => `${e.description || ''} ${e.category || ''}`.toLowerCase().includes(q));
  }, [entries, query]);

  // Timer stops into a prefilled add form so the user can name/categorise it.
  const onTimerStop = (startISO) => {
    const start = new Date(startISO);
    const end = new Date();
    setPrefill({ date: todayISO(start), startTime: hhmm(start), endTime: hhmm(end), description: '', category: '' });
    setOpen(true);
  };

  return (
    <div className="animate-fade-up space-y-4">
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Time</h1>

      <LiveTimer onStop={onTimerStop} />

      <div className="card-pad">
        <div className="flex items-center gap-5">
          <ProgressRing value={Math.min(1, todayMinutes / target)} size={92} stroke={9} color="rgb(var(--brand))">
            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase text-muted">today</p>
              <p className="text-sm font-extrabold">{formatDuration(todayMinutes)}</p>
            </div>
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <p className="section-title">Awareness</p>
            <p className="font-display text-2xl font-extrabold text-ink">{weekMinutes ? formatDuration(weekMinutes) : 'Start softly'}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Log where time went. No score, just a clearer picture.
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-2xl bg-brand/8 p-3">
          <Sparkles size={16} className="mt-0.5 shrink-0 text-brand" />
          <p className="text-sm font-medium text-ink">A few honest entries can make the day feel less blurry.</p>
        </div>
      </div>

      <Section title="This week">
        {byCategory.length === 0 ? (
          <p className="px-1 text-sm text-muted">No time entries yet this week.</p>
        ) : (
          <div className="space-y-2">
            {byCategory.slice(0, 6).map((row) => {
              const meta = domainCategoryMeta('time', row.category, customCategories || []);
              const pct = weekMinutes ? row.minutes / weekMinutes : 0;
              return (
                <div key={row.category} className="card-pad">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: meta.color }} />
                      <span className="truncate font-semibold">{row.category}</span>
                    </div>
                    <span className="shrink-0 font-bold text-muted">{formatDuration(row.minutes)}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(6, pct * 100)}%`, background: meta.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {dayTrend.some((d) => d.minutes > 0) ? (
        <Section title="By day">
          <div className="card-pad">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp size={16} className="text-brand" />
              <p className="text-sm font-semibold">Minutes logged this week</p>
            </div>
            <MiniBars data={dayTrend.map((d, i) => ({ value: d.minutes, label: WEEKDAY_LABELS[i] }))} color="rgb(var(--brand))" format={(v) => formatDuration(v)} />
          </div>
        </Section>
      ) : null}

      <Section title="Recent">
        {(entries || []).length === 0 ? (
          <EmptyState icon={Clock3} title="No time logged yet" hint="Start the timer or add a range when you are ready." />
        ) : (
          <>
            <div className="relative mb-2">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search entries" className="input pl-10" />
            </div>
            {recent.length === 0 ? (
              <p className="px-1 py-3 text-sm text-muted">No matches for “{query}”.</p>
            ) : (
              <ul className="space-y-2">
                {recent.slice(0, 20).map((entry) => {
                  const meta = domainCategoryMeta('time', entry.category || 'Uncategorized', customCategories || []);
                  return (
                    <li key={entry.id} className="card flex items-center gap-3 p-3">
                      <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ background: meta.color }} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{entry.description}</p>
                        <p className="text-xs text-muted">{humanDate(entry.date)} - {entry.startTime}-{entry.endTime}{entry.category ? ` - ${entry.category}` : ''}</p>
                      </div>
                      <span className="font-display text-sm font-extrabold">{formatDuration(entry.minutes)}</span>
                      <button onClick={() => setEditing(entry)} aria-label="Edit" className="text-muted hover:text-ink"><Pencil size={15} /></button>
                      <button onClick={() => deleteTimeEntry(entry.id)} aria-label="Delete" className="text-muted hover:text-rose-500"><Trash2 size={15} /></button>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </Section>

      <button onClick={() => { setPrefill(null); setOpen(true); }} className="btn-add-primary w-full">
        <span className="add-symbol"><Plus size={16} /></span>
        Add time
      </button>

      <BottomSheet open={open} onClose={() => { setOpen(false); setPrefill(null); }} title="Add time">
        <AddTimeEntryForm initial={prefill} onDone={() => { setOpen(false); setPrefill(null); }} />
      </BottomSheet>

      <BottomSheet open={!!editing} onClose={() => setEditing(null)} title="Edit time">
        {editing ? <AddTimeEntryForm editing={editing} onDone={() => setEditing(null)} /> : null}
      </BottomSheet>
    </div>
  );
}

function LiveTimer({ onStop }) {
  const [startISO, setStartISO] = useState(() => {
    try { return localStorage.getItem(TIMER_KEY); } catch { return null; }
  });
  const [, setTick] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (!startISO) return undefined;
    ref.current = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(ref.current);
  }, [startISO]);

  const start = () => {
    const iso = new Date().toISOString();
    try { localStorage.setItem(TIMER_KEY, iso); } catch { /* ignore */ }
    setStartISO(iso);
  };

  const stop = () => {
    const iso = startISO;
    try { localStorage.removeItem(TIMER_KEY); } catch { /* ignore */ }
    setStartISO(null);
    if (iso) onStop(iso);
  };

  if (!startISO) {
    return (
      <button onClick={start} className="card-pad flex w-full items-center gap-3 text-left transition active:scale-[0.99]">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand/15 text-brand"><Play size={20} /></span>
        <div>
          <p className="font-bold">Start a timer</p>
          <p className="text-sm text-muted">One tap now, name it when you stop.</p>
        </div>
      </button>
    );
  }

  const elapsed = Math.max(0, Math.floor((Date.now() - new Date(startISO).getTime()) / 1000));
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const clock = `${h ? `${h}:` : ''}${String(m).padStart(h ? 2 : 1, '0')}:${String(s).padStart(2, '0')}`;

  return (
    <div className="card-pad flex items-center gap-3">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand/15 text-brand">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="section-title">Timing now</p>
        <p className="font-display text-2xl font-extrabold tabular-nums">{clock}</p>
      </div>
      <button onClick={stop} className="btn-primary h-11 !px-4"><Square size={16} /> Stop</button>
    </div>
  );
}

export function AddTimeEntryForm({ onDone, editing = null, initial = null }) {
  const isEdit = !!editing;
  const seed = editing || initial || {};
  const { toast } = useFeedback();
  const [date, setDate] = useState(seed.date || todayISO());
  const [startTime, setStartTime] = useState(seed.startTime || '09:00');
  const [endTime, setEndTime] = useState(seed.endTime || '10:00');
  const [description, setDescription] = useState(seed.description || '');
  const [category, setCategory] = useState(seed.category || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (isEdit) {
        await updateTimeEntry(editing.id, { date, startTime, endTime, description, category });
        toast('Time updated', 'good');
      } else {
        await addTimeEntry({ date, startTime, endTime, description, category });
        toast('Time logged', 'good');
      }
      onDone?.();
    } catch (err) {
      setError(err.message);
      toast(err.message, 'bad');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 pb-4">
      {error && <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{error}</p>}
      <div>
        <label className="label">What did you do?</label>
        <input
          autoFocus
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Study, commute, deep work..."
          className="input"
          maxLength={100}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="label">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Start</label>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">End</label>
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input" />
        </div>
      </div>
      <CategoryPicker domain="time" value={category} onChange={setCategory} label="Category (optional)" optional />
      <button type="submit" disabled={busy} className="btn-add-primary w-full">
        {!busy && <span className="add-symbol"><Plus size={16} /></span>}
        {busy ? 'Saving...' : isEdit ? 'Save changes' : 'Add time'}
      </button>
    </form>
  );
}

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <p className="section-title">{title}</p>
      </div>
      {children}
    </section>
  );
}
