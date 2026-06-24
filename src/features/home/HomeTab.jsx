import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ArrowUpRight,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Flame,
  Heart,
  Moon,
  PiggyBank,
  Repeat,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { db } from '../../data/db';
import { useSettings } from '../../hooks/useSettings';
import { useFeedback } from '../../components/Feedback';
import QuoteCard from './QuoteCard';
import StatCard from '../../components/StatCard';
import StatPill from '../../components/StatPill';
import { formatMoney } from '../../lib/currency';
import { moneyOverview } from '../../data/money';
import { todayProgress, todayTasks, upcomingTasks, toggleTask } from '../../data/tasks';
import { workoutsThisWeek, weekConsistency } from '../../data/gym';
import { habitsForDay, toggleHabit } from '../../data/habits';
import { buildRecap, recapHeadline } from '../../lib/recap';
import { greeting, messageOfTheDay } from '../../lib/encouragement';
import { todayISO, humanDate } from '../../lib/dates';
import { entriesToday, formatDuration, totalMinutes } from '../../data/time';

export default function HomeTab({ streak = 0, tabs = {} }) {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { celebrate } = useFeedback();
  const cur = settings.baseCurrency;

  const expenses = useLiveQuery(() => db.expenses.toArray(), [], []);
  const incomes = useLiveQuery(() => db.incomes.toArray(), [], []);
  const accounts = useLiveQuery(() => db.accounts.toArray(), [], []);
  const tasks = useLiveQuery(() => db.tasks.toArray(), [], []);
  const sessions = useLiveQuery(() => db.sessions.toArray(), [], []);
  const habits = useLiveQuery(() => db.habits.toArray(), [], []);
  const habitCheckins = useLiveQuery(() => db.habitCheckins.toArray(), [], []);
  const timeEntries = useLiveQuery(() => db.timeEntries.toArray(), [], []);

  const money = moneyOverview(accounts || [], expenses || [], incomes || []);
  const taskProgress = todayProgress(tasks || []);
  const dueToday = todayTasks(tasks || []);
  const nextTasks = [...dueToday, ...upcomingTasks(tasks || [])].slice(0, 4);
  const gymWeek = workoutsThisWeek(sessions || []);
  const gymDays = weekConsistency(sessions || []);
  const didToday = (gymDays.find((d) => d.date === todayISO()) || {}).done;
  const todayTime = totalMinutes(entriesToday(timeEntries || []));

  const todaysHabits = habitsForDay(habits || [], habitCheckins || []);
  const habitsDone = todaysHabits.filter((h) => h.done).length;

  const recap = useMemo(
    () => buildRecap({ expenses: expenses || [], tasks: tasks || [], sessions: sessions || [], timeEntries: timeEntries || [] }),
    [expenses, tasks, sessions, timeEntries],
  );

  const motd = messageOfTheDay({ streak, tasksToday: taskProgress, money });

  const onToggleTask = async (id) => {
    const done = await toggleTask(id);
    if (done) celebrate('Nice — one done');
  };

  return (
    <div className="animate-fade-up space-y-4">
      <section className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="section-title">Sonder today</p>
          <h1 className="mt-1 truncate font-display text-2xl font-extrabold tracking-tight text-ink">{greeting(settings.name)}</h1>
        </div>
        <StatPill icon={Flame} label={`${streak} day`} accent="rgb(var(--gym))" tone="soft" />
      </section>

      <QuoteCard />

      <section className="soft-card p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand/15 text-brand">
            <Heart size={18} strokeWidth={2.4} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-snug text-ink">{motd}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">Small steps count here.</p>
          </div>
        </div>
      </section>

      {/* Today's habits — the daily engine (replaces the goals nudge) */}
      {tabs.goals ? (
        <HabitsToday
          habits={todaysHabits}
          done={habitsDone}
          onToggle={(id) => toggleHabit(id)}
          onManage={() => navigate('/goals')}
        />
      ) : null}

      {tabs.tasks ? (
        <TasksUpNext
          tasks={nextTasks}
          dueCount={dueToday.length}
          allDone={taskProgress.total > 0 && taskProgress.done === taskProgress.total}
          onToggle={onToggleTask}
          onOpen={() => navigate('/tasks')}
        />
      ) : null}

      <section className="grid grid-cols-2 gap-3">
        {tabs.money ? (
          <StatCard
            icon={Wallet}
            accent="rgb(var(--money))"
            label="Finance"
            value={money.hasAccounts ? formatMoney(money.total, cur, { compact: true }) : 'Start'}
            sub={money.hasAccounts ? (money.runway != null ? `${money.runway} days buffered` : 'steady until you spend') : 'Add one account'}
            onClick={() => navigate('/money')}
            meta={<StatPill icon={PiggyBank} label="Snapshot" accent="rgb(var(--money))" />}
          />
        ) : null}

        {tabs.gym ? (
          <StatCard
            icon={Dumbbell}
            accent="rgb(var(--gym))"
            label="Gym streak"
            value={gymWeek ? `${gymWeek}/7` : 'Rest'}
            sub={didToday ? 'You showed up today.' : 'Ready when you are.'}
            onClick={() => navigate('/gym')}
            meta={<WeekDots days={gymDays} />}
          />
        ) : null}

        {tabs.time ? (
          <StatCard
            icon={Clock3}
            accent="rgb(var(--time))"
            label="Time"
            value={todayTime ? formatDuration(todayTime) : 'Notice'}
            sub={todayTime ? 'Logged today.' : 'Track where today goes.'}
            onClick={() => navigate('/time')}
            meta={<StatPill icon={Sparkles} label="Aware" accent="rgb(var(--time))" />}
          />
        ) : null}
      </section>

      <GentleRecap
        tabs={tabs}
        recap={recap}
        headline={recapHeadline(recap)}
        habits={{ done: habitsDone, total: todaysHabits.length }}
        currency={cur}
      />
    </div>
  );
}

function HabitsToday({ habits, done, onToggle, onManage }) {
  if (!habits.length) {
    return (
      <button onClick={onManage} className="soft-card flex w-full items-center gap-3 p-4 text-left transition hover:-translate-y-0.5 active:scale-[0.985]">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-goals/15 text-goals"><Repeat size={18} strokeWidth={2.4} /></span>
        <div className="min-w-0">
          <p className="section-title">Habits</p>
          <p className="mt-0.5 text-sm font-semibold text-ink">Add a habit to a goal to start showing up daily.</p>
        </div>
      </button>
    );
  }

  return (
    <section className="soft-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="section-title">Today’s habits</p>
        <StatPill icon={Repeat} label={`${done}/${habits.length}`} accent="rgb(var(--goals))" tone="soft" />
      </div>
      <ul className="space-y-2">
        {habits.map((h) => (
          <li key={h.id} className="flex items-center gap-3">
            <button
              onClick={() => onToggle(h.id)}
              aria-label={h.done ? `Mark ${h.title} not done` : `Mark ${h.title} done`}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition"
              style={h.done ? { borderColor: 'rgb(var(--goals))', background: 'rgb(var(--goals))', color: 'white' } : { borderColor: 'rgb(var(--line))' }}
            >
              {h.done ? <Check size={14} strokeWidth={3} /> : null}
            </button>
            <span className={`min-w-0 flex-1 truncate text-sm font-semibold ${h.done ? 'text-muted line-through' : 'text-ink'}`}>{h.title}</span>
          </li>
        ))}
      </ul>
      <button onClick={onManage} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-2 text-xs font-bold text-muted transition hover:text-ink active:scale-[0.99]">
        Manage in Goals <ArrowUpRight size={14} />
      </button>
    </section>
  );
}

function TasksUpNext({ tasks, dueCount, allDone, onToggle, onOpen }) {
  const today = todayISO();
  return (
    <section className="soft-card p-4">
      <button onClick={onOpen} className="mb-1 flex w-full items-center justify-between gap-3 text-left">
        <p className="section-title">Tasks</p>
        <StatPill icon={CheckCircle2} label={dueCount ? `${dueCount} due` : 'All clear'} accent="rgb(var(--tasks))" tone="soft" />
      </button>

      {tasks.length === 0 ? (
        <p className="py-2 text-sm font-semibold text-ink">
          {allDone ? 'Everything for today is done. Enjoy it.' : 'Nothing due. Add a task or rest easy.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((t) => {
            const overdue = t.dueDate && t.dueDate < today;
            const dueLabel = t.dueDate ? humanDate(t.dueDate) : 'Anytime';
            return (
              <li key={t.id} className="flex items-center gap-3">
                <button
                  onClick={() => onToggle(t.id)}
                  aria-label={`Mark ${t.title} done`}
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-line transition hover:border-tasks"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{t.title}</p>
                  <p className={`text-xs font-medium ${overdue ? 'text-rose-500' : 'text-muted'}`}>{overdue ? `Overdue · ${dueLabel}` : dueLabel}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <button onClick={onOpen} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-2 text-xs font-bold text-muted transition hover:text-ink active:scale-[0.99]">
        Open tasks <ArrowUpRight size={14} />
      </button>
    </section>
  );
}

function WeekDots({ days }) {
  return (
    <div className="flex items-center gap-1.5">
      {(days || []).map((day) => (
        <span
          key={day.date}
          className={`h-2.5 w-2.5 rounded-full transition ${day.done ? 'bg-gym shadow-[0_0_14px_rgb(var(--gym)/0.45)]' : 'bg-surface-2'}`}
        />
      ))}
    </div>
  );
}

function GentleRecap({ tabs, recap, headline, habits, currency }) {
  const stats = [];
  if (tabs.tasks) stats.push({ key: 'tasks', icon: CheckCircle2, label: 'Done', value: recap.tasksDone, accent: 'rgb(var(--tasks))' });
  if (tabs.money) stats.push({ key: 'spent', icon: Wallet, label: 'Spent', value: formatMoney(recap.spent, currency, { compact: true }), accent: 'rgb(var(--money))' });
  if (tabs.time) stats.push({ key: 'time', icon: Clock3, label: 'Aware', value: formatDuration(recap.timeMinutes), accent: 'rgb(var(--time))' });
  if (tabs.gym) stats.push({ key: 'gym', icon: CalendarCheck, label: 'Moved', value: recap.workouts, accent: 'rgb(var(--gym))' });
  if (tabs.goals && habits.total) stats.push({ key: 'habits', icon: Repeat, label: 'Habits', value: `${habits.done}/${habits.total}`, accent: 'rgb(var(--goals))' });
  if (!stats.length) return null;

  return (
    <section className="space-y-3 pb-1">
      <div className="flex items-center justify-between gap-3">
        <p className="section-title">Weekly softness</p>
        <StatPill icon={Moon} label={headline} accent="rgb(var(--brand))" tone="soft" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div key={stat.key} className="soft-card flex items-center gap-3 p-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl" style={{ color: stat.accent, background: `color-mix(in srgb, ${stat.accent} 16%, transparent)` }}>
              <stat.icon size={17} strokeWidth={2.4} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-extrabold leading-none text-ink">{stat.value}</p>
              <p className="mt-1 truncate text-[11px] font-semibold text-muted">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
