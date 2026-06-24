import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Plus, Trash2, Check, Sun, CalendarClock, CheckCircle2, Pencil, Search, Repeat, TrendingUp,
} from 'lucide-react';
import { db } from '../../data/db';
import { useFeedback } from '../../components/Feedback';
import SegmentedControl from '../../components/SegmentedControl';
import ProgressRing from '../../components/ProgressRing';
import EmptyState from '../../components/EmptyState';
import BottomSheet from '../../components/BottomSheet';
import MiniBars from '../../components/MiniBars';
import AddTaskForm from './AddTaskForm';
import { humanDate } from '../../lib/dates';
import { tasksNote } from '../../lib/encouragement';
import { recurrencesOfKind, deleteRecurrence, CADENCE_LABELS } from '../../data/recurrences';
import {
  todayTasks, upcomingTasks, completedTasks, todayProgress, toggleTask, deleteTask,
  searchTasks, completedPerWeek,
} from '../../data/tasks';

const PRIORITY_COLOR = { high: '#ef4444', med: '#f59e0b', low: '#10b981' };
const PRIORITY_LABEL = { high: 'High', med: 'Medium', low: 'Low' };

export default function TasksTab() {
  const [view, setView] = useState('today');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const { celebrate } = useFeedback();
  const tasks = useLiveQuery(() => db.tasks.toArray(), [], []);
  const recurrences = useLiveQuery(() => db.recurrences.toArray(), [], []);

  const today = todayTasks(tasks || []);
  const upcoming = upcomingTasks(tasks || []);
  const done = completedTasks(tasks || []);
  const tp = todayProgress(tasks || []);
  const ringValue = tp.total ? tp.done / tp.total : 0;
  const repeating = recurrencesOfKind(recurrences, 'task');
  const trend = useMemo(() => completedPerWeek(tasks || [], 8), [tasks]);

  const baseList = view === 'today' ? today : view === 'upcoming' ? upcoming : done;
  const list = searchTasks(baseList, query);

  const onToggle = async (id) => {
    const isDone = await toggleTask(id);
    if (isDone) celebrate('Nice — one done');
  };

  const emptyIcon = view === 'completed' ? CheckCircle2 : view === 'upcoming' ? CalendarClock : Sun;

  return (
    <div className="animate-fade-up space-y-4">
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Tasks</h1>

      {/* Today progress hero */}
      <div className="card-pad flex items-center gap-4">
        <ProgressRing value={ringValue} size={72} stroke={8} color="rgb(var(--tasks))">
          <span className="text-sm font-extrabold">{tp.done}/{tp.total || 0}</span>
        </ProgressRing>
        <div>
          <p className="section-title">Today</p>
          <p className="text-sm font-semibold text-ink">{tasksNote(tp)}</p>
        </div>
      </div>

      <SegmentedControl
        options={[
          { id: 'today', label: 'Today', badge: today.length || null },
          { id: 'upcoming', label: 'Upcoming', badge: upcoming.length || null },
          { id: 'completed', label: 'Done', badge: done.length || null },
        ]}
        value={view}
        onChange={setView}
      />

      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks" className="input pl-10" />
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={emptyIcon}
          title={query ? 'No matches' : view === 'completed' ? 'Nothing completed yet' : view === 'upcoming' ? 'Nothing upcoming' : 'You’re all caught up'}
          hint={query ? `No tasks match “${query}”.` : view === 'completed' ? 'Finished tasks land here.' : 'Add a task or enjoy the free time.'}
          action={!query ? <button onClick={() => setOpen(true)} className="btn-add-primary"><span className="add-symbol"><Plus size={16} /></span> Add task</button> : null}
        />
      ) : (
        <ul className="space-y-2">
          {list.map((t) => (
            <li key={t.id} className="card flex items-center gap-3 p-3.5">
              <button
                onClick={() => onToggle(t.id)}
                aria-label={t.status === 'done' ? 'Mark not done' : 'Mark done'}
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition ${
                  t.status === 'done' ? 'border-tasks bg-tasks text-white' : 'border-line'
                }`}
              >
                {t.status === 'done' && <Check size={14} strokeWidth={3} />}
              </button>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-semibold ${t.status === 'done' ? 'text-muted line-through' : 'text-ink'}`}>{t.title}</p>
                <p className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                  <span className="capitalize">{t.category}</span>
                  {t.dueDate && <span>· {humanDate(t.dueDate)}</span>}
                </p>
              </div>
              {t.status !== 'done' && (
                <span
                  className="flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                  style={{ color: PRIORITY_COLOR[t.priority], background: `color-mix(in srgb, ${PRIORITY_COLOR[t.priority]} 14%, transparent)` }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: PRIORITY_COLOR[t.priority] }} />
                  {PRIORITY_LABEL[t.priority]}
                </span>
              )}
              <button onClick={() => setEditing(t)} aria-label="Edit task" className="text-muted hover:text-ink"><Pencil size={15} /></button>
              <button onClick={() => deleteTask(t.id)} aria-label="Delete" className="text-muted hover:text-rose-500"><Trash2 size={15} /></button>
            </li>
          ))}
        </ul>
      )}

      {repeating.length ? (
        <section className="space-y-2">
          <p className="section-title flex items-center gap-1.5 px-1"><Repeat size={13} /> Repeating</p>
          <ul className="space-y-2">
            {repeating.map((r) => (
              <li key={r.id} className="card flex items-center gap-3 p-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-tasks/15 text-tasks"><Repeat size={16} /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{r.template.title}</p>
                  <p className="text-xs text-muted">{CADENCE_LABELS[r.cadence]} - next {humanDate(r.nextDate)}</p>
                </div>
                <button onClick={() => deleteRecurrence(r.id)} aria-label="Stop repeating" className="text-muted hover:text-rose-500"><Trash2 size={15} /></button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {trend.some((t) => t.count > 0) ? (
        <section className="space-y-2">
          <p className="section-title flex items-center gap-1.5 px-1"><TrendingUp size={13} /> Completed, last 8 weeks</p>
          <div className="card-pad">
            <MiniBars data={trend.map((t, i) => ({ value: t.count, label: i === trend.length - 1 ? 'now' : '' }))} color="rgb(var(--tasks))" />
          </div>
        </section>
      ) : null}

      <button onClick={() => setOpen(true)} className="btn-add-primary w-full">
        <span className="add-symbol"><Plus size={16} /></span>
        Add task
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Add task">
        <AddTaskForm onDone={() => setOpen(false)} />
      </BottomSheet>

      <BottomSheet open={!!editing} onClose={() => setEditing(null)} title="Edit task">
        {editing ? <AddTaskForm editing={editing} onDone={() => setEditing(null)} /> : null}
      </BottomSheet>
    </div>
  );
}
