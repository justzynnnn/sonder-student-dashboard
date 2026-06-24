import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Plus, Trash2, Check, Sparkles, Target, Pencil, Link2, Flame, Repeat,
} from 'lucide-react';
import { db } from '../../data/db';
import { useSettings } from '../../hooks/useSettings';
import { useFeedback } from '../../components/Feedback';
import ProgressRing from '../../components/ProgressRing';
import EmptyState from '../../components/EmptyState';
import BottomSheet from '../../components/BottomSheet';
import { LIFE_CATEGORIES, lifeCategoryMeta, mergeCategories } from '../../data/categories';
import { humanDate, todayISO, WEEKDAY_LABELS } from '../../lib/dates';
import { formatMoney } from '../../lib/currency';
import { goalNote } from '../../lib/encouragement';
import {
  addGoal, updateGoal, deleteGoal, updateGoalProgress, overallGoalProgress, goalProgress,
  goalCurrent, isLinked, addMilestone, toggleMilestone, deleteMilestone,
} from '../../data/goals';
import {
  addHabit, toggleHabit, deleteHabit, habitsForGoal, habitWeekProgress, habitStreak,
} from '../../data/habits';

export default function GoalsTab() {
  const { settings } = useSettings();
  const cur = settings.baseCurrency;
  const [addOpen, setAddOpen] = useState(false);
  const [editGoal, setEditGoal] = useState(null);
  const [openGoal, setOpenGoal] = useState(null);

  const goals = useLiveQuery(() => db.goals.orderBy('createdAt').reverse().toArray(), [], []);
  const milestones = useLiveQuery(() => db.milestones.toArray(), [], []);
  const accounts = useLiveQuery(() => db.accounts.toArray(), [], []);
  const tasks = useLiveQuery(() => db.tasks.toArray(), [], []);
  const habits = useLiveQuery(() => db.habits.toArray(), [], []);
  const habitCheckins = useLiveQuery(() => db.habitCheckins.toArray(), [], []);

  const ctx = { accounts: accounts || [], tasks: tasks || [] };
  const overall = overallGoalProgress(goals || [], milestones || [], ctx);
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
          action={<button onClick={() => setAddOpen(true)} className="btn-add-primary"><span className="add-symbol"><Plus size={16} /></span> Add a goal</button>}
        />
      ) : (
        <div className="space-y-3">
          {goals.map((g) => {
            const p = goalProgress(g, milestones || [], ctx);
            const meta = lifeCategoryMeta(g.lifeCategory);
            const current = goalCurrent(g, ctx);
            const gHabits = habitsForGoal(habits || [], g.id);
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
                      <p className="text-xs text-muted">
                        {g.linkType === 'account' ? formatMoney(current, cur) : current} / {g.linkType === 'account' ? formatMoney(g.target, cur) : g.target} {g.unit}
                      </p>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {isLinked(g) ? <span className="chip bg-surface-2 text-muted"><Link2 size={12} /> Auto</span> : null}
                      {gHabits.length ? <span className="chip bg-surface-2 text-muted"><Repeat size={12} /> {gHabits.length} habit{gHabits.length === 1 ? '' : 's'}</span> : null}
                      {g.deadline ? <span className="text-xs text-muted">by {humanDate(g.deadline)}</span> : null}
                    </div>
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

      <button onClick={() => setAddOpen(true)} className="btn-add-primary w-full">
        <span className="add-symbol"><Plus size={16} /></span>
        Add a goal
      </button>

      <BottomSheet open={addOpen} onClose={() => setAddOpen(false)} title="New goal">
        <GoalForm cur={cur} accounts={accounts || []} onDone={() => setAddOpen(false)} />
      </BottomSheet>

      <BottomSheet open={!!editGoal} onClose={() => setEditGoal(null)} title="Edit goal">
        {editGoal ? <GoalForm cur={cur} accounts={accounts || []} editing={editGoal} onDone={() => setEditGoal(null)} /> : null}
      </BottomSheet>

      <BottomSheet open={!!detail} onClose={() => setOpenGoal(null)} title={detail?.title || 'Goal'}>
        {detail && (
          <GoalDetail
            goal={detail}
            cur={cur}
            ctx={ctx}
            milestones={(milestones || []).filter((m) => m.goalId === detail.id)}
            habits={habitsForGoal(habits || [], detail.id)}
            habitCheckins={habitCheckins || []}
            onEdit={() => { setOpenGoal(null); setEditGoal(detail); }}
            onClose={() => setOpenGoal(null)}
          />
        )}
      </BottomSheet>
    </div>
  );
}

const LINK_OPTS = [
  { id: 'none', label: 'Manual' },
  { id: 'account', label: 'Money' },
  { id: 'tasks', label: 'Tasks' },
];

function GoalForm({ onDone, cur, accounts, editing = null }) {
  const isEdit = !!editing;
  const { celebrate, toast } = useFeedback();
  const taskCats = useLiveQuery(() => db.customCategories.where('domain').equals('tasks').toArray(), [], []);
  const taskCategories = mergeCategories('tasks', taskCats || []);

  const [title, setTitle] = useState(editing?.title ?? '');
  const [lifeCategory, setLifeCategory] = useState(editing?.lifeCategory ?? 'growth');
  const [linkType, setLinkType] = useState(editing?.linkType ?? 'none');
  const [linkRef, setLinkRef] = useState(editing?.linkRef ?? 'all');
  const [target, setTarget] = useState(editing?.target ? String(editing.target) : '');
  const [unit, setUnit] = useState(editing?.unit ?? '');
  const [deadline, setDeadline] = useState(editing?.deadline ?? '');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const link = linkType === 'none' ? 'none' : linkType;
      const ref = linkType === 'account' ? linkRef : linkType === 'tasks' ? (linkRef || taskCategories[0]?.name) : null;
      const unitFor = linkType === 'tasks' ? 'tasks' : unit;
      const payload = { title, lifeCategory, target, unit: unitFor, deadline, linkType: link, linkRef: ref };
      if (isEdit) {
        await updateGoal(editing.id, payload);
        toast('Goal updated', 'good');
      } else {
        await addGoal(payload);
        celebrate('New goal set');
      }
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

      <div>
        <label className="label flex items-center gap-1.5"><Link2 size={13} /> Track progress by</label>
        <div className="grid grid-cols-3 gap-2">
          {LINK_OPTS.map((opt) => {
            const active = opt.id === linkType;
            return (
              <button
                key={opt.id} type="button" onClick={() => setLinkType(opt.id)}
                className={`min-h-11 rounded-2xl border px-2 text-sm font-bold transition active:scale-[0.98] ${active ? 'border-goals bg-goals/10 text-goals' : 'border-line bg-surface-2 text-muted'}`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-xs text-muted">
          {linkType === 'account' ? 'Progress follows a real account balance.' : linkType === 'tasks' ? 'Progress counts completed tasks in a category.' : 'You update progress yourself, or use milestones.'}
        </p>
      </div>

      {linkType === 'account' ? (
        <div>
          <label className="label">Account</label>
          <select value={linkRef} onChange={(e) => setLinkRef(e.target.value)} className="input">
            <option value="all">All accounts (total cash)</option>
            {(accounts || []).filter((a) => a.type !== 'credit').map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      ) : null}

      {linkType === 'tasks' ? (
        <div>
          <label className="label">Task category</label>
          <select value={linkRef} onChange={(e) => setLinkRef(e.target.value)} className="input">
            {taskCategories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="label">{linkType === 'account' ? `Target amount (${cur})` : linkType === 'tasks' ? 'Target count' : 'Target (optional)'}</label>
          <input type="number" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder={linkType === 'tasks' ? 'e.g. 20' : 'e.g. 12'} className="input" />
        </div>
        {linkType === 'none' ? (
          <div>
            <label className="label">Unit</label>
            <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="books, kg, $…" className="input" maxLength={16} />
          </div>
        ) : null}
      </div>
      <div>
        <label className="label">Deadline (optional — no pressure)</label>
        <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="input" />
      </div>
      {linkType === 'none' ? <p className="text-xs text-muted">Leave target blank to track this goal with milestones and habits instead.</p> : null}
      <button disabled={busy} className="btn-add-primary w-full">
        <span className="add-symbol">{isEdit ? <Pencil size={16} /> : <Plus size={16} />}</span>
        {busy ? 'Saving...' : isEdit ? 'Save changes' : 'Create goal'}
      </button>
    </form>
  );
}

function GoalDetail({ goal, cur, ctx, milestones, habits, habitCheckins, onEdit, onClose }) {
  const { celebrate } = useFeedback();
  const meta = lifeCategoryMeta(goal.lifeCategory);
  const linked = isLinked(goal);
  const liveCurrent = goalCurrent(goal, ctx);
  const [current, setCurrent] = useState(goal.current || 0);
  const [ms, setMs] = useState('');
  const p = goalProgress(goal, milestones, ctx);

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
        <div className="min-w-0 flex-1">
          <span className="chip" style={{ background: `color-mix(in srgb, ${meta.color} 16%, transparent)`, color: meta.color }}>{meta.label}</span>
          <p className="mt-1 text-sm font-semibold" style={{ color: meta.color }}>{goalNote(p)}</p>
        </div>
        <button onClick={onEdit} aria-label="Edit goal" className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-surface-2 text-muted hover:text-ink"><Pencil size={16} /></button>
      </div>

      {linked ? (
        <div className="card-pad">
          <p className="section-title flex items-center gap-1.5"><Link2 size={13} /> Auto-tracked</p>
          <p className="mt-1 text-sm font-semibold">
            {goal.linkType === 'account'
              ? `${formatMoney(liveCurrent, cur)} of ${formatMoney(goal.target, cur)}`
              : `${liveCurrent} of ${goal.target} tasks done`}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {goal.linkType === 'account' ? 'Updates with your account balance.' : `Counts completed tasks in “${goal.linkRef}”.`}
          </p>
        </div>
      ) : goal.target > 0 ? (
        <div className="card-pad">
          <label className="label">Progress: {current} / {goal.target} {goal.unit}</label>
          <input type="range" min="0" max={goal.target} value={current} onChange={(e) => saveProgress(Number(e.target.value))} className="w-full accent-fuchsia-500" />
          <div className="mt-2 flex gap-2">
            <button onClick={() => saveProgress(Math.max(0, current - 1))} className="btn-ghost flex-1">−1</button>
            <button onClick={() => saveProgress(current + 1)} className="btn-soft flex-1">+1</button>
          </div>
        </div>
      ) : null}

      {/* Habits — the daily engine behind this goal */}
      <HabitSection goal={goal} habits={habits} checkins={habitCheckins} />

      <div>
        <p className="section-title mb-2 px-1">Milestones</p>
        <form onSubmit={addMs} className="mb-2 flex gap-2">
          <input value={ms} onChange={(e) => setMs(e.target.value)} placeholder="Add a small win..." className="input" maxLength={80} />
          <button className="btn-icon-add" aria-label="Add milestone"><Plus size={18} /></button>
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

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

function HabitSection({ goal, habits, checkins }) {
  const { celebrate } = useFeedback();
  const meta = lifeCategoryMeta(goal.lifeCategory);
  const [title, setTitle] = useState('');
  const [days, setDays] = useState(ALL_DAYS);
  const [busy, setBusy] = useState(false);

  const toggleDay = (d) => setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()));

  const add = async (e) => {
    e.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      await addHabit({ goalId: goal.id, title, days });
      setTitle('');
      setDays(ALL_DAYS);
    } finally {
      setBusy(false);
    }
  };

  const onToggle = async (id) => {
    const done = await toggleHabit(id);
    if (done) celebrate('Habit done');
  };

  return (
    <div>
      <p className="section-title mb-2 flex items-center gap-1.5 px-1"><Repeat size={13} /> Habits</p>
      <ul className="space-y-1.5">
        {habits.map((h) => {
          const week = habitWeekProgress(h, checkins);
          const streak = habitStreak(h, checkins);
          const doneToday = (checkins || []).some((c) => c.habitId === h.id && c.date === todayISO());
          return (
            <li key={h.id} className="card flex items-center gap-3 p-2.5">
              <button
                onClick={() => onToggle(h.id)}
                aria-label={doneToday ? 'Mark habit not done' : 'Mark habit done'}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2"
                style={doneToday ? { borderColor: meta.color, background: meta.color, color: 'white' } : { borderColor: 'rgb(var(--line))' }}
              >
                {doneToday ? <Check size={14} strokeWidth={3} /> : null}
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{h.title}</p>
                <p className="flex items-center gap-2 text-xs text-muted">
                  {streak > 0 ? <span className="flex items-center gap-0.5 font-semibold text-gym"><Flame size={11} /> {streak}d</span> : null}
                  <span>{Math.round(week * 100)}% this week</span>
                </p>
              </div>
              <button onClick={() => deleteHabit(h.id)} aria-label="Delete habit" className="text-muted hover:text-rose-500"><Trash2 size={14} /></button>
            </li>
          );
        })}
        {habits.length === 0 && <p className="px-1 py-1 text-sm text-muted">Add a daily habit that moves this goal forward.</p>}
      </ul>

      <form onSubmit={add} className="mt-2 space-y-2 rounded-[1.35rem] border border-line bg-surface-2/70 p-3">
        <div className="flex gap-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New habit..." className="input min-h-11 py-2.5" maxLength={60} />
          <button type="submit" disabled={busy} className="btn-add-soft shrink-0">Add</button>
        </div>
        <div className="flex justify-between gap-1">
          {WEEKDAY_LABELS.map((label, i) => {
            const active = days.includes(i);
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i)}
                aria-pressed={active}
                aria-label={`Toggle day ${i + 1}`}
                className={`grid h-8 flex-1 place-items-center rounded-lg text-xs font-bold transition ${active ? 'bg-goals/15 text-goals' : 'bg-surface text-muted'}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </form>
    </div>
  );
}
