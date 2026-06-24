import { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { addTask, updateTask } from '../../data/tasks';
import { addRecurrence } from '../../data/recurrences';
import { useFeedback } from '../../components/Feedback';
import CategoryPicker from '../../components/CategoryPicker';
import RepeatPicker from '../../components/RepeatPicker';
import { todayISO } from '../../lib/dates';

const PRIORITY_OPTS = [
  { id: 'low', label: 'Low', color: '#10b981' },
  { id: 'med', label: 'Medium', color: '#f59e0b' },
  { id: 'high', label: 'High', color: '#ef4444' },
];

// Doubles as add + edit. Pass `editing` (a task row) to edit it in place.
export default function AddTaskForm({ onDone, defaultDueDate = '', editing = null }) {
  const isEdit = !!editing;
  const { toast } = useFeedback();
  const [title, setTitle] = useState(editing?.title ?? '');
  const [priority, setPriority] = useState(editing?.priority ?? 'med');
  const [category, setCategory] = useState(editing?.category ?? 'School');
  const [dueDate, setDueDate] = useState(editing?.dueDate ?? defaultDueDate);
  const [repeat, setRepeat] = useState('none');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (isEdit) {
        await updateTask(editing.id, { title, priority, category, dueDate });
        toast('Task updated', 'good');
      } else if (repeat === 'none') {
        await addTask({ title, priority, category, dueDate });
        toast('Task added', 'good');
      } else {
        await addRecurrence({
          kind: 'task',
          cadence: repeat,
          template: { title, priority, category },
          startDate: dueDate || todayISO(),
        });
        toast('Repeating task set', 'good');
      }
      onDone?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 pb-4">
      {error && <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{error}</p>}

      <div>
        <label className="label">Task</label>
        <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Finish lab report" className="input" maxLength={100} />
      </div>

      <div>
        <label className="label">Priority</label>
        <div className="flex gap-2">
          {PRIORITY_OPTS.map((priorityOption) => {
            const active = priorityOption.id === priority;
            return (
              <button
                key={priorityOption.id}
                type="button"
                onClick={() => setPriority(priorityOption.id)}
                className="chip flex-1 justify-center border transition"
                style={{
                  borderColor: active ? priorityOption.color : 'rgb(var(--line))',
                  background: active ? `color-mix(in srgb, ${priorityOption.color} 18%, transparent)` : 'rgb(var(--surface-2))',
                  color: active ? priorityOption.color : 'rgb(var(--muted))',
                }}
              >
                {priorityOption.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <CategoryPicker domain="tasks" value={category} onChange={setCategory} />
        <div>
          <label className="label">{repeat === 'none' || isEdit ? 'Due (optional)' : 'Starts'}</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" />
        </div>
      </div>

      {!isEdit ? <RepeatPicker value={repeat} onChange={setRepeat} accent="rgb(var(--tasks))" /> : null}

      <button type="submit" disabled={busy} className="btn-add-primary w-full">
        {!busy && <span className="add-symbol">{isEdit ? <Check size={16} /> : <Plus size={16} />}</span>}
        {busy ? 'Saving...' : isEdit ? 'Save changes' : repeat === 'none' ? 'Add task' : 'Set repeating task'}
      </button>
    </form>
  );
}
