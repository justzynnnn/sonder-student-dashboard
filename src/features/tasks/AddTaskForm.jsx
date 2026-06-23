import { useState } from 'react';
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
    if (busy) return; // double-submit guard
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
        <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Finish lab report" className="input" maxLength={100} />
      </div>

      <div>
        <label className="label">Priority</label>
        <div className="flex gap-2">
          {PRIORITY_OPTS.map((p) => {
            const active = p.id === priority;
            return (
              <button
                key={p.id} type="button" onClick={() => setPriority(p.id)}
                className="chip flex-1 justify-center border transition"
                style={{
                  borderColor: active ? p.color : 'rgb(var(--line))',
                  background: active ? `color-mix(in srgb, ${p.color} 18%, transparent)` : 'rgb(var(--surface-2))',
                  color: active ? p.color : 'rgb(var(--muted))',
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Type</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
            {CATEGORY_OPTS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Due (optional)</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" />
        </div>
      </div>

      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? 'Saving…' : 'Add task'}
      </button>
    </form>
  );
}
