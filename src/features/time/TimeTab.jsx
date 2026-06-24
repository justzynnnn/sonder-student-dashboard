import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Clock3, Plus, Sparkles, Trash2 } from 'lucide-react';
import { db } from '../../data/db';
import { useFeedback } from '../../components/Feedback';
import BottomSheet from '../../components/BottomSheet';
import CategoryPicker from '../../components/CategoryPicker';
import EmptyState from '../../components/EmptyState';
import ProgressRing from '../../components/ProgressRing';
import { domainCategoryMeta } from '../../data/categories';
import { addTimeEntry, deleteTimeEntry, entriesInWeek, entriesToday, formatDuration, timeByCategory, totalMinutes } from '../../data/time';
import { humanDate, todayISO } from '../../lib/dates';

export default function TimeTab() {
  const [open, setOpen] = useState(false);
  const entries = useLiveQuery(() => db.timeEntries.orderBy('date').reverse().toArray(), [], []);
  const customCategories = useLiveQuery(() => db.customCategories.where('domain').equals('time').toArray(), [], []);
  const today = entriesToday(entries || []);
  const week = entriesInWeek(entries || []);
  const todayMinutes = totalMinutes(today);
  const weekMinutes = totalMinutes(week);
  const byCategory = useMemo(() => timeByCategory(week), [week]);
  const target = 8 * 60;

  return (
    <div className="animate-fade-up space-y-4">
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Time</h1>

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

      <Section title="Recent">
        {(entries || []).length === 0 ? (
          <EmptyState icon={Clock3} title="No time logged yet" hint="Add the first range when you are ready." />
        ) : (
          <ul className="space-y-2">
            {(entries || []).slice(0, 14).map((entry) => {
              const meta = domainCategoryMeta('time', entry.category || 'Uncategorized', customCategories || []);
              return (
                <li key={entry.id} className="card flex items-center gap-3 p-3">
                  <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ background: meta.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{entry.description}</p>
                    <p className="text-xs text-muted">{humanDate(entry.date)} - {entry.startTime}-{entry.endTime}{entry.category ? ` - ${entry.category}` : ''}</p>
                  </div>
                  <span className="font-display text-sm font-extrabold">{formatDuration(entry.minutes)}</span>
                  <button onClick={() => deleteTimeEntry(entry.id)} aria-label="Delete" className="text-muted hover:text-rose-500"><Trash2 size={15} /></button>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <button onClick={() => setOpen(true)} className="btn-add-primary w-full">
        <span className="add-symbol"><Plus size={16} /></span>
        Add time
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Add time">
        <AddTimeEntryForm onDone={() => setOpen(false)} />
      </BottomSheet>
    </div>
  );
}

export function AddTimeEntryForm({ onDone }) {
  const { toast } = useFeedback();
  const [date, setDate] = useState(todayISO());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await addTimeEntry({ date, startTime, endTime, description, category });
      toast('Time logged', 'good');
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
        {busy ? 'Saving...' : 'Add time'}
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
