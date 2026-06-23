import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Trash2, Check, Sun, CalendarClock, CheckCircle2 } from 'lucide-react';
import { db } from '../../data/db';
import { useFeedback } from '../../components/Feedback';
import SegmentedControl from '../../components/SegmentedControl';
import ProgressRing from '../../components/ProgressRing';
import EmptyState from '../../components/EmptyState';
import BottomSheet from '../../components/BottomSheet';
import AddTaskForm from './AddTaskForm';
import { humanDate } from '../../lib/dates';
import { tasksNote } from '../../lib/encouragement';
import {
  todayTasks, upcomingTasks, completedTasks, todayProgress, toggleTask, deleteTask,
} from '../../data/tasks';

const PRIORITY_COLOR = { high: '#ef4444', med: '#f59e0b', low: '#10b981' };

export default function TasksTab() {
  const [view, setView] = useState('today');
  const [open, setOpen] = useState(false);
  const { celebrate } = useFeedback();
  const tasks = useLiveQuery(() => db.tasks.toArray(), [], []);

  const today = todayTasks(tasks || []);
  const upcoming = upcomingTasks(tasks || []);
  const done = completedTasks(tasks || []);
  const tp = todayProgress(tasks || []);
  const ringValue = tp.total ? tp.done / tp.total : 0;

  const list = view === 'today' ? today : view === 'upcoming' ? upcoming : done;

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

      {list.length === 0 ? (
        <EmptyState
          icon={emptyIcon}
          title={view === 'completed' ? 'Nothing completed yet' : view === 'upcoming' ? 'Nothing upcoming' : 'You’re all caught up'}
          hint={view === 'completed' ? 'Finished tasks land here.' : 'Add a task or enjoy the free time.'}
          action={<button onClick={() => setOpen(true)} className="btn-primary"><Plus size={18} /> Add task</button>}
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
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: PRIORITY_COLOR[t.priority] }} title={`${t.priority} priority`} />
              )}
              <button onClick={() => deleteTask(t.id)} aria-label="Delete" className="text-muted hover:text-rose-500"><Trash2 size={15} /></button>
            </li>
          ))}
        </ul>
      )}

      <button onClick={() => setOpen(true)} className="btn-primary w-full"><Plus size={18} /> Add task</button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Add task">
        <AddTaskForm onDone={() => setOpen(false)} defaultDueDate={view === 'upcoming' ? '' : ''} />
      </BottomSheet>
    </div>
  );
}
