import { useState } from 'react';
import { Plus } from 'lucide-react';
import { addTask } from '../../data/tasks';
import { useFeedback } from '../../components/Feedback';

const PRIORITY_OPTS = [
  { id: 'low', label: 'Low', color: '#10b981' },
  { id: 'med', label: 'Medium', color: '#f59e0b' },
  { id: 'high', label: 'High', color: '#ef4444' },
];
const CATEGORY_OPTS = [
  { id: 'school', label: 'School' },
  { id: 'personal', label: 'Personal' },
];

export default function AddTaskForm({ onDone, defaultDueDate = '' }) {
  const { toast } = useFeedback();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('med');
  const [category, setCategory] = useState('school');
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await addTask({ title, priority, category, dueDate });
      toast('Task added', 'good');
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
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Finish lab report" className="input" maxLength={100} />
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
        <div>
          <label className="label">Type</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
            {CATEGORY_OPTS.map((categoryOption) => <option key={categoryOption.id} value={categoryOption.id}>{categoryOption.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Due (optional)</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" />
        </div>
      </div>

      <button type="submit" disabled={busy} className="btn-add-primary w-full">
        {!busy && <span className="add-symbol"><Plus size={16} /></span>}
        {busy ? 'Saving...' : 'Add task'}
      </button>
    </form>
  );
}
