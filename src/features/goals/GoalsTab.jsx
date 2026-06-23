import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Trash2, Check, Sparkles, Target } from 'lucide-react';
import { db } from '../../data/db';
import { useFeedback } from '../../components/Feedback';
import ProgressRing from '../../components/ProgressRing';
import EmptyState from '../../components/EmptyState';
import BottomSheet from '../../components/BottomSheet';
import { LIFE_CATEGORIES, lifeCategoryMeta } from '../../data/categories';
import { humanDate } from '../../lib/dates';
import { goalNote } from '../../lib/encouragement';
import {
  addGoal, deleteGoal, updateGoalProgress, overallGoalProgress, goalProgress,
  addMilestone, toggleMilestone, deleteMilestone,
} from '../../data/goals';

export default function GoalsTab() {
  const [addOpen, setAddOpen] = useState(false);
  const [openGoal, setOpenGoal] = useState(null);

  const goals = useLiveQuery(() => db.goals.orderBy('createdAt').reverse().toArray(), [], []);
  const milestones = useLiveQuery(() => db.milestones.toArray(), [], []);

  const overall = overallGoalProgress(goals || [], milestones || []);
  const detail = (goals || []).find((g) => g.id === openGoal) || null;

  return (
    <div className="animate-fade-up space-y-4">
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Goals</h1>

      {/* Overall hero */}
      <div className="card relative overflow-hidden p-5">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-goals/15 blur-2xl" />
        <div className="flex items-center gap-5">
          <ProgressRing value={overall} size={92} stroke={10} color="rgb(var(--goals))">
            <span className="font-display text-lg font-extrabold">{Math.round(overall * 100)}%</span>
          </ProgressRing>
          <div>
            <p className="font-display text-lg font-bold">This is the life you’re building.</p>
            <p className="mt-0.5 text-sm text-muted">{(goals || []).length} goals in motion. Every step counts.</p>
          </div>
        </div>
      </div>

      {(goals || []).length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          hint="Dream a little — what are you building toward?"
          action={<button onClick={() => setAddOpen(true)} className="btn-primary"><Plus size={18} /> Add a goal</button>}
        />
      ) : (
        <div className="space-y-3">
          {goals.map((g) => {
            const p = goalProgress(g, milestones || []);
            const meta = lifeCategoryMeta(g.lifeCategory);
            return (
              <button key={g.id} onClick={() => setOpenGoal(g.id)} className="card w-full p-4 text-left transition active:scale-[0.99]">
                <div className="flex items-center gap-4">
                  <ProgressRing value={p} size={60} stroke={7} color={meta.color}>
                    <span className="text-xs font-extrabold">{Math.round(p * 100)}%</span>
                  </ProgressRing>
                  <div className="min-w-0 flex-1">
                    <span className="chip mb-1" style={{ background: `color-mix(in srgb, ${meta.color} 16%, transparent)`, color: meta.color }}>
                      {meta.label}
                    </span>
                    <p className="truncate font-semibold">{g.title}</p>
                    {g.target > 0 && (
                      <p className="text-xs text-muted">{g.current} / {g.target} {g.unit}</p>
                    )}
                    {g.deadline && <p className="text-xs text-muted">by {humanDate(g.deadline)}</p>}
                  </div>
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold" style={{ color: meta.color }}>
                  <Sparkles size={14} /> {goalNote(p)}
                </p>
              </button>
            );
          })}
        </div>
      )}

      <button onClick={() => setAddOpen(true)} className="btn-primary w-full"><Plus size={18} /> Add a goal</button>

      <BottomSheet open={addOpen} onClose={() => setAddOpen(false)} title="New goal">
        <AddGoalForm onDone={() => setAddOpen(false)} />
      </BottomSheet>

      <BottomSheet open={!!detail} onClose={() => setOpenGoal(null)} title={detail?.title || 'Goal'}>
        {detail && <GoalDetail goal={detail} milestones={(milestones || []).filter((m) => m.goalId === detail.id)} onClose={() => setOpenGoal(null)} />}
      </BottomSheet>
    </div>
  );
}

function AddGoalForm({ onDone }) {
  const { celebrate, toast } = useFeedback();
  const [title, setTitle] = useState('');
  const [lifeCategory, setLifeCategory] = useState('growth');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('');
  const [deadline, setDeadline] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await addGoal({ title, lifeCategory, target, unit, deadline });
      celebrate('New goal set');
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
        <label className="label">Goal</label>
        <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Save for a trip, Read 12 books" className="input" maxLength={80} />
      </div>
      <div>
        <label className="label">Life area</label>
        <div className="flex flex-wrap gap-2">
          {LIFE_CATEGORIES.map((c) => {
            const active = c.id === lifeCategory;
            return (
              <button
                key={c.id} type="button" onClick={() => setLifeCategory(c.id)}
                className="chip border transition"
                style={{
                  borderColor: active ? c.color : 'rgb(var(--line))',
                  background: active ? `color-mix(in srgb, ${c.color} 18%, transparent)` : 'rgb(var(--surface-2))',
                  color: active ? c.color : 'rgb(var(--muted))',
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Target (optional)</label>
          <input type="number" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. 12" className="input" />
        </div>
        <div>
          <label className="label">Unit</label>
          <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="books, kg, $…" className="input" maxLength={16} />
        </div>
      </div>
      <div>
        <label className="label">Deadline (optional — no pressure)</label>
        <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="input" />
      </div>
      <p className="text-xs text-muted">Leave target blank to track this goal with milestones instead.</p>
      <button disabled={busy} className="btn-primary w-full">Create goal</button>
    </form>
  );
}

function GoalDetail({ goal, milestones, onClose }) {
  const { celebrate } = useFeedback();
  const meta = lifeCategoryMeta(goal.lifeCategory);
  const [current, setCurrent] = useState(goal.current || 0);
  const [ms, setMs] = useState('');
  const p = goalProgress(goal, milestones);

  const saveProgress = async (val) => {
    setCurrent(val);
    await updateGoalProgress(goal.id, val);
    if (goal.target > 0 && val >= goal.target) celebrate('Goal reached');
  };

  const addMs = async (e) => {
    e.preventDefault();
    if (!ms.trim()) return;
    await addMilestone(goal.id, ms);
    setMs('');
  };

  return (
    <div className="space-y-5 pb-4">
      <div className="flex items-center gap-4">
        <ProgressRing value={p} size={72} stroke={8} color={meta.color}>
          <span className="font-display font-extrabold">{Math.round(p * 100)}%</span>
        </ProgressRing>
        <div>
          <span className="chip" style={{ background: `color-mix(in srgb, ${meta.color} 16%, transparent)`, color: meta.color }}>{meta.label}</span>
          <p className="mt-1 text-sm font-semibold" style={{ color: meta.color }}>{goalNote(p)}</p>
        </div>
      </div>

      {goal.target > 0 && (
        <div className="card-pad">
          <label className="label">Progress: {current} / {goal.target} {goal.unit}</label>
          <input type="range" min="0" max={goal.target} value={current} onChange={(e) => saveProgress(Number(e.target.value))} className="w-full accent-fuchsia-500" />
          <div className="mt-2 flex gap-2">
            <button onClick={() => saveProgress(Math.max(0, current - 1))} className="btn-ghost flex-1">−1</button>
            <button onClick={() => saveProgress(current + 1)} className="btn-soft flex-1">+1</button>
          </div>
        </div>
      )}

      <div>
        <p className="section-title mb-2 px-1">Milestones</p>
        <form onSubmit={addMs} className="mb-2 flex gap-2">
          <input value={ms} onChange={(e) => setMs(e.target.value)} placeholder="Add a small win…" className="input" maxLength={80} />
          <button className="btn-soft shrink-0"><Plus size={18} /></button>
        </form>
        <ul className="space-y-1.5">
          {milestones.map((m) => (
            <li key={m.id} className="card flex items-center gap-3 p-2.5">
              <button onClick={() => toggleMilestone(m.id)} aria-label="Toggle" className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${m.done ? 'border-goals bg-goals text-white' : 'border-line'}`} style={m.done ? { borderColor: meta.color, background: meta.color } : {}}>
                {m.done ? <Check size={14} strokeWidth={3} /> : null}
              </button>
              <span className={`flex-1 text-sm ${m.done ? 'text-muted line-through' : ''}`}>{m.title}</span>
              <button onClick={() => deleteMilestone(m.id)} aria-label="Delete" className="text-muted hover:text-rose-500"><Trash2 size={14} /></button>
            </li>
          ))}
          {milestones.length === 0 && <p className="px-1 py-2 text-sm text-muted">Break this goal into small wins.</p>}
        </ul>
      </div>

      <button
        onClick={async () => { await deleteGoal(goal.id); onClose(); }}
        className="btn-ghost w-full text-rose-500"
      >
        <Trash2 size={16} /> Delete goal
      </button>
    </div>
  );
}
