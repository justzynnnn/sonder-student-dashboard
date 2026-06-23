import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Check, Trash2, CheckCircle2 } from 'lucide-react';
import { db } from '../../data/db';
import { saveSession } from '../../data/gym';
import { useFeedback } from '../../components/Feedback';
import RestTimer from './RestTimer';

// Live workout logger. `initial` is built from a plan or empty. Fully editable
// — the user can add exercises/sets on the fly (no fixed templates, plan §Gym).
export default function SessionLogger({ initial, onDone }) {
  const { celebrate } = useFeedback();
  const library = useLiveQuery(() => db.exercises.toArray(), [], []);
  const [name, setName] = useState(initial?.name || 'Workout');
  const [exercises, setExercises] = useState(initial?.exercises || []);
  const [newEx, setNewEx] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (ei, si, field, value) =>
    setExercises((list) =>
      list.map((ex, i) =>
        i !== ei ? ex : { ...ex, sets: ex.sets.map((s, j) => (j !== si ? s : { ...s, [field]: value })) },
      ),
    );

  const toggleSet = (ei, si) =>
    setExercises((list) =>
      list.map((ex, i) =>
        i !== ei ? ex : { ...ex, sets: ex.sets.map((s, j) => (j !== si ? s : { ...s, done: !s.done })) },
      ),
    );

  const addSet = (ei) =>
    setExercises((list) =>
      list.map((ex, i) => {
        if (i !== ei) return ex;
        const last = ex.sets[ex.sets.length - 1] || { reps: 10, weight: 0 };
        return { ...ex, sets: [...ex.sets, { reps: last.reps, weight: last.weight, done: false }] };
      }),
    );

  const removeExercise = (ei) => setExercises((list) => list.filter((_, i) => i !== ei));

  const addExercise = () => {
    const n = newEx.trim();
    if (!n) return;
    setExercises((list) => [...list, { name: n, sets: [{ reps: 10, weight: 0, done: false }] }]);
    setNewEx('');
  };

  const finish = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await saveSession({ ...initial, name, exercises });
      celebrate('Workout complete');
      onDone?.();
    } finally {
      setBusy(false);
    }
  };

  const totalSets = exercises.reduce((n, ex) => n + ex.sets.length, 0);
  const doneSets = exercises.reduce((n, ex) => n + ex.sets.filter((s) => s.done).length, 0);

  return (
    <div className="space-y-4 pb-4">
      <input value={name} onChange={(e) => setName(e.target.value)} className="input text-lg font-bold" placeholder="Workout name" maxLength={50} />

      <RestTimer />

      {exercises.map((ex, ei) => (
        <div key={ei} className="card-pad">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-bold">{ex.name}</p>
            <button onClick={() => removeExercise(ei)} aria-label="Remove exercise" className="text-muted hover:text-rose-500"><Trash2 size={15} /></button>
          </div>
          <div className="mb-1 grid grid-cols-[2rem_1fr_1fr_2.5rem] items-center gap-2 px-1 text-[11px] font-semibold uppercase text-muted">
            <span>Set</span><span>Reps</span><span>Weight</span><span />
          </div>
          <div className="space-y-1.5">
            {ex.sets.map((s, si) => (
              <div key={si} className={`grid grid-cols-[2rem_1fr_1fr_2.5rem] items-center gap-2 rounded-xl p-1 ${s.done ? 'bg-gym/10' : ''}`}>
                <span className="text-center text-sm font-bold text-muted">{si + 1}</span>
                <input type="number" inputMode="numeric" value={s.reps} onChange={(e) => update(ei, si, 'reps', e.target.value)} className="input !py-2 text-center" />
                <input type="number" inputMode="decimal" value={s.weight} onChange={(e) => update(ei, si, 'weight', e.target.value)} className="input !py-2 text-center" />
                <button
                  onClick={() => toggleSet(ei, si)}
                  aria-label="Toggle set done"
                  className={`grid h-9 place-items-center rounded-xl border-2 transition ${s.done ? 'border-gym bg-gym text-white' : 'border-line text-muted'}`}
                >
                  <Check size={16} strokeWidth={3} />
                </button>
              </div>
            ))}
          </div>
          <button onClick={() => addSet(ei)} className="btn-ghost mt-2 h-9 w-full text-xs"><Plus size={14} /> Add set</button>
        </div>
      ))}

      {/* Add exercise */}
      <div className="card-pad">
        <label className="label">Add exercise</label>
        <div className="flex gap-2">
          <input
            list="exercise-library"
            value={newEx}
            onChange={(e) => setNewEx(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addExercise())}
            placeholder="e.g. Bench press"
            className="input"
            maxLength={40}
          />
          <datalist id="exercise-library">
            {(library || []).map((x) => <option key={x.name} value={x.name} />)}
          </datalist>
          <button onClick={addExercise} className="btn-soft shrink-0"><Plus size={18} /></button>
        </div>
      </div>

      <button onClick={finish} disabled={busy || exercises.length === 0} className="btn-primary w-full py-3.5 text-base">
        <CheckCircle2 size={20} /> {busy ? 'Saving…' : `Finish workout (${doneSets}/${totalSets} sets)`}
      </button>
    </div>
  );
}
