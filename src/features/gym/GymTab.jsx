import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Play, Trash2, Dumbbell, Trophy, Zap } from 'lucide-react';
import { db } from '../../data/db';
import { useFeedback } from '../../components/Feedback';
import EmptyState from '../../components/EmptyState';
import BottomSheet from '../../components/BottomSheet';
import SessionLogger from './SessionLogger';
import { WEEKDAY_LABELS, humanDate, todayISO } from '../../lib/dates';
import { gymNote } from '../../lib/encouragement';
import {
  buildSessionFromPlan, weekConsistency, workoutsThisWeek, personalRecords,
  addPlan, deletePlan, deleteSession,
} from '../../data/gym';

export default function GymTab() {
  const [active, setActive] = useState(null); // session being logged
  const [planSheet, setPlanSheet] = useState(false);

  const plans = useLiveQuery(() => db.plans.toArray(), [], []);
  const sessions = useLiveQuery(() => db.sessions.orderBy('date').reverse().toArray(), [], []);

  const consistency = weekConsistency(sessions || []);
  const thisWeek = workoutsThisWeek(sessions || []);
  const didToday = consistency.find((d) => d.date === todayISO())?.done;
  const prs = personalRecords(sessions || []);

  const startQuick = () => setActive(buildSessionFromPlan(null));
  const startPlan = (plan) => setActive(buildSessionFromPlan(plan));

  return (
    <div className="animate-fade-up space-y-4">
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Gym</h1>

      {/* Weekly consistency */}
      <div className="card-pad">
        <div className="mb-3 flex items-center justify-between">
          <p className="section-title">This week</p>
          <span className="chip bg-gym/15 text-gym"><Zap size={13} /> {thisWeek} workouts</span>
        </div>
        <div className="flex justify-between">
          {consistency.map((d, i) => (
            <div key={d.date} className="flex flex-col items-center gap-1.5">
              <span className="text-[11px] font-semibold text-muted">{WEEKDAY_LABELS[i]}</span>
              <span className={`grid h-9 w-9 place-items-center rounded-xl text-sm font-bold ${
                d.done ? 'bg-gradient-to-br from-gym to-orange-400 text-white shadow-glow' : 'bg-surface-2 text-muted'
              }`}>
                {d.done ? <Dumbbell size={16} /> : ''}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm font-semibold text-ink">{gymNote({ thisWeek, didToday })}</p>
      </div>

      {/* Start */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={startQuick} className="btn-primary py-3.5"><Play size={18} /> Quick start</button>
        <button onClick={() => setPlanSheet(true)} className="btn-add py-3.5">
          <span className="add-symbol-soft"><Plus size={14} /></span>
          New plan
        </button>
      </div>

      {/* Plans */}
      {(plans || []).length > 0 && (
        <section className="space-y-2">
          <p className="section-title px-1">Your workouts</p>
          {plans.map((p) => (
            <div key={p.id} className="card flex items-center gap-3 p-3.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gym/15 text-gym"><Dumbbell size={18} /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.name}</p>
                <p className="text-xs text-muted">{p.exercises.length} exercises</p>
              </div>
              <button onClick={() => startPlan(p)} className="btn-soft h-9 !px-3 text-xs"><Play size={14} /> Start</button>
              <button onClick={() => deletePlan(p.id)} aria-label="Delete plan" className="text-muted hover:text-rose-500"><Trash2 size={15} /></button>
            </div>
          ))}
        </section>
      )}

      {/* Personal records */}
      {prs.length > 0 && (
        <section className="space-y-2">
          <p className="section-title px-1">Personal records</p>
          <div className="card-pad grid grid-cols-2 gap-3">
            {prs.slice(0, 6).map((pr) => (
              <div key={pr.name} className="flex items-center gap-2">
                <Trophy size={16} className="shrink-0 text-amber-500" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{pr.name}</p>
                  <p className="text-xs text-muted">{pr.weight} × {pr.reps}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* History */}
      <section className="space-y-2">
        <p className="section-title px-1">History</p>
        {(sessions || []).length === 0 ? (
          <EmptyState icon={Dumbbell} title="No workouts yet" hint="Hit Quick start and log your first session." />
        ) : (
          <ul className="space-y-2">
            {sessions.map((s) => (
              <li key={s.id} className="card flex items-center gap-3 p-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{s.name}</p>
                  <p className="text-xs text-muted">
                    {humanDate(s.date)} · {s.exercises.length} exercises · {s.exercises.reduce((n, e) => n + e.sets.length, 0)} sets
                  </p>
                </div>
                <button onClick={() => deleteSession(s.id)} aria-label="Delete session" className="text-muted hover:text-rose-500"><Trash2 size={15} /></button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Active session */}
      <BottomSheet open={!!active} onClose={() => setActive(null)} title="Log workout">
        {active && <SessionLogger initial={active} onDone={() => setActive(null)} />}
      </BottomSheet>

      {/* Create plan */}
      <BottomSheet open={planSheet} onClose={() => setPlanSheet(false)} title="New workout plan">
        <CreatePlanForm onDone={() => setPlanSheet(false)} />
      </BottomSheet>
    </div>
  );
}

function CreatePlanForm({ onDone }) {
  const { toast } = useFeedback();
  const [name, setName] = useState('');
  const [rows, setRows] = useState([{ name: '', sets: 3, reps: 10, weight: 0 }]);
  const [busy, setBusy] = useState(false);

  const setRow = (i, field, value) => setRows((r) => r.map((row, j) => (j === i ? { ...row, [field]: value } : row)));
  const addRow = () => setRows((r) => [...r, { name: '', sets: 3, reps: 10, weight: 0 }]);
  const removeRow = (i) => setRows((r) => r.filter((_, j) => j !== i));

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await addPlan({ name, exercises: rows.filter((r) => r.name.trim()) });
      toast('Plan saved', 'good');
      onDone();
    } catch (err) {
      toast(err.message, 'bad');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 pb-4">
      <div>
        <label className="label">Workout name</label>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Push day, Legs, Full body…" className="input" maxLength={50} />
      </div>
      <div className="space-y-2">
        <label className="label">Exercises</label>
        {rows.map((row, i) => (
          <div key={i} className="card p-3">
            <div className="flex gap-2">
              <input value={row.name} onChange={(e) => setRow(i, 'name', e.target.value)} placeholder="Exercise name" className="input" maxLength={40} />
              <button type="button" onClick={() => removeRow(i)} aria-label="Remove" className="shrink-0 text-muted hover:text-rose-500"><Trash2 size={16} /></button>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <Field label="Sets" value={row.sets} onChange={(v) => setRow(i, 'sets', v)} />
              <Field label="Reps" value={row.reps} onChange={(v) => setRow(i, 'reps', v)} />
              <Field label="Weight" value={row.weight} onChange={(v) => setRow(i, 'weight', v)} />
            </div>
          </div>
        ))}
        <button type="button" onClick={addRow} className="btn-add w-full text-sm">
          <span className="add-symbol-soft"><Plus size={14} /></span>
          Add exercise
        </button>
      </div>
      <button disabled={busy} className="btn-add-primary w-full">
        <span className="add-symbol"><Plus size={16} /></span>
        Save plan
      </button>
    </form>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <span className="mb-1 block text-center text-[10px] font-semibold uppercase text-muted">{label}</span>
      <input type="number" inputMode="numeric" value={value} onChange={(e) => onChange(e.target.value)} className="input !py-2 text-center" />
    </div>
  );
}
