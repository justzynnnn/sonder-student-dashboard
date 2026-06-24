import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ArrowUpRight,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Flame,
  Heart,
  Moon,
  PiggyBank,
  Sparkles,
  Target,
  Wallet,
} from 'lucide-react';
import { db } from '../../data/db';
import { useSettings } from '../../hooks/useSettings';
import QuoteCard from './QuoteCard';
import StatCard from '../../components/StatCard';
import StatPill from '../../components/StatPill';
import ProgressRing from '../../components/ProgressRing';
import { formatMoney } from '../../lib/currency';
import { moneyOverview } from '../../data/money';
import { todayProgress } from '../../data/tasks';
import { workoutsThisWeek, weekConsistency } from '../../data/gym';
import { overallGoalProgress } from '../../data/goals';
import { buildRecap, recapHeadline } from '../../lib/recap';
import { greeting, messageOfTheDay } from '../../lib/encouragement';
import { todayISO } from '../../lib/dates';
import { entriesToday, formatDuration, totalMinutes } from '../../data/time';

export default function HomeTab({ streak = 0, tabs = {} }) {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const cur = settings.baseCurrency;

  const expenses = useLiveQuery(() => db.expenses.toArray(), [], []);
  const accounts = useLiveQuery(() => db.accounts.toArray(), [], []);
  const tasks = useLiveQuery(() => db.tasks.toArray(), [], []);
  const sessions = useLiveQuery(() => db.sessions.toArray(), [], []);
  const goals = useLiveQuery(() => db.goals.toArray(), [], []);
  const milestones = useLiveQuery(() => db.milestones.toArray(), [], []);
  const timeEntries = useLiveQuery(() => db.timeEntries.toArray(), [], []);

  const money = moneyOverview(accounts || [], expenses || []);
  const taskProgress = todayProgress(tasks || []);
  const taskRatio = taskProgress.total ? taskProgress.done / taskProgress.total : 1;
  const gymWeek = workoutsThisWeek(sessions || []);
  const gymDays = weekConsistency(sessions || []);
  const didToday = (gymDays.find((d) => d.date === todayISO()) || {}).done;
  const goalProgress = overallGoalProgress(goals || [], milestones || []);
  const todayTime = totalMinutes(entriesToday(timeEntries || []));

  const recap = useMemo(
    () => buildRecap({ expenses: expenses || [], tasks: tasks || [], sessions: sessions || [], timeEntries: timeEntries || [] }),
    [expenses, tasks, sessions, timeEntries],
  );

  const motd = messageOfTheDay({ streak, tasksToday: taskProgress, money });
  const activeGoal = (goals || []).find((goal) => !goal.completedAt) || (goals || [])[0];
  const taskState = taskProgress.total
    ? `${Math.round(taskRatio * 100)}%`
    : 'Clear';

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

      {tabs.tasks ? (
        <button
          onClick={() => navigate('/tasks')}
          className="soft-card group w-full overflow-hidden p-4 text-left transition duration-300 hover:-translate-y-0.5 active:scale-[0.985]"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-title">Tasks</p>
              <p className="mt-1 font-display text-2xl font-extrabold tracking-tight text-ink">
                {taskProgress.total ? `${taskProgress.done}/${taskProgress.total}` : 'All clear'}
              </p>
              <p className="mt-2 text-xs font-medium leading-relaxed text-muted">
                {taskProgress.total ? 'Just the next gentle step.' : 'No due tasks are waiting.'}
              </p>
            </div>
            <ProgressRing value={taskRatio} size={76} stroke={7} color="rgb(var(--tasks))">
              <span className="text-xs font-extrabold text-ink">{taskState}</span>
            </ProgressRing>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-tasks transition-all duration-700"
              style={{ width: `${Math.max(8, taskRatio * 100)}%` }}
            />
          </div>
        </button>
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

      {tabs.goals ? (
        <button
          onClick={() => navigate('/goals')}
          className="soft-card group w-full p-4 text-left transition duration-300 hover:-translate-y-0.5 active:scale-[0.985]"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="section-title">Goals</p>
              <p className="mt-1 font-display text-xl font-extrabold tracking-tight text-ink">
                {activeGoal ? activeGoal.title : 'Choose a north star'}
              </p>
              <p className="mt-2 text-xs font-medium leading-relaxed text-muted">
                {activeGoal ? 'Progress without the pressure.' : 'A goal can be soft and still matter.'}
              </p>
            </div>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-goals/15 text-goals">
              <Target size={18} strokeWidth={2.4} />
            </span>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-goals transition-all duration-700"
                style={{ width: `${Math.max(8, goalProgress * 100)}%` }}
              />
            </div>
            <span className="text-xs font-extrabold text-goals">{Math.round(goalProgress * 100)}%</span>
          </div>
        </button>
      ) : null}

      <GentleRecap
        tabs={tabs}
        recap={recap}
        headline={recapHeadline(recap)}
        goalProgress={goalProgress}
        currency={cur}
      />
    </div>
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

function GentleRecap({ tabs, recap, headline, goalProgress, currency }) {
  const stats = [];
  if (tabs.tasks) stats.push({ key: 'tasks', icon: CheckCircle2, label: 'Done', value: recap.tasksDone, accent: 'rgb(var(--tasks))' });
  if (tabs.money) stats.push({ key: 'spent', icon: Wallet, label: 'Spent', value: formatMoney(recap.spent, currency, { compact: true }), accent: 'rgb(var(--money))' });
  if (tabs.time) stats.push({ key: 'time', icon: Clock3, label: 'Aware', value: formatDuration(recap.timeMinutes), accent: 'rgb(var(--time))' });
  if (tabs.gym) stats.push({ key: 'gym', icon: CalendarCheck, label: 'Moved', value: recap.workouts, accent: 'rgb(var(--gym))' });
  if (tabs.goals) stats.push({ key: 'goals', icon: Target, label: 'Growing', value: `${Math.round(goalProgress * 100)}%`, accent: 'rgb(var(--goals))' });
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
      <button
        type="button"
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-bold text-muted transition hover:text-ink active:scale-[0.99]"
      >
        <Sparkles size={14} />
        Keep going gently
        <ArrowUpRight size={14} />
      </button>
    </section>
  );
}
