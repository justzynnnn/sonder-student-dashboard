import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Wallet, ListChecks, Dumbbell, Target, Sparkles } from 'lucide-react';
import { db } from '../../data/db';
import { useSettings } from '../../hooks/useSettings';
import QuoteCard from './QuoteCard';
import StatCard from '../../components/StatCard';
import ProgressRing from '../../components/ProgressRing';
import { formatMoney } from '../../lib/currency';
import { moneyOverview } from '../../data/money';
import { todayProgress } from '../../data/tasks';
import { workoutsThisWeek, weekConsistency } from '../../data/gym';
import { overallGoalProgress } from '../../data/goals';
import { buildRecap, recapHeadline } from '../../lib/recap';
import { greeting, messageOfTheDay } from '../../lib/encouragement';
import { todayISO } from '../../lib/dates';

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
  const savings = useLiveQuery(() => db.savings.toArray(), [], []);

  const money = moneyOverview(accounts || [], expenses || []);
  const tp = todayProgress(tasks || []);
  const gymWeek = workoutsThisWeek(sessions || []);
  const didToday = (weekConsistency(sessions || []).find((d) => d.date === todayISO()) || {}).done;
  const goalP = overallGoalProgress(goals || [], milestones || []);

  const recap = useMemo(
    () => buildRecap({ expenses: expenses || [], tasks: tasks || [], sessions: sessions || [], savings: savings || [] }),
    [expenses, tasks, sessions, savings],
  );

  const motd = messageOfTheDay({ streak, tasksToday: tp, money });

  // Snapshot cards, only for enabled tabs.
  const cards = [];
  if (tabs.money) cards.push(
    <StatCard key="money" icon={Wallet} accent="rgb(var(--money))" label="Money"
      value={money.hasAccounts ? formatMoney(money.total, cur) : 'Add account'}
      sub={money.hasAccounts ? (money.runway != null ? `~${money.runway} days at your pace` : 'tap to manage') : 'track your money'}
      onClick={() => navigate('/money')} />,
  );
  if (tabs.tasks) cards.push(
    <StatCard key="tasks" icon={ListChecks} accent="rgb(var(--tasks))" label="Tasks today"
      value={tp.total ? `${tp.done}/${tp.total}` : 'All clear'}
      sub={tp.total ? 'tap to view' : 'nothing due'}
      onClick={() => navigate('/tasks')} />,
  );
  if (tabs.gym) cards.push(
    <StatCard key="gym" icon={Dumbbell} accent="rgb(var(--gym))" label="Workouts this week"
      value={`${gymWeek}`}
      sub={didToday ? 'done today' : 'tap to train'}
      onClick={() => navigate('/gym')} />,
  );
  if (tabs.goals) cards.push(
    <StatCard key="goals" icon={Target} accent="rgb(var(--goals))" label="Goal progress"
      value={`${Math.round(goalP * 100)}%`}
      sub={(goals || []).length ? `${goals.length} active` : 'set a goal'}
      onClick={() => navigate('/goals')} />,
  );

  // Recap stats, only for enabled tabs.
  const recapStats = [];
  if (tabs.gym) recapStats.push({ key: 'w', ring: Math.min(1, recap.workouts / 4), color: 'rgb(var(--gym))', value: recap.workouts, label: 'workouts' });
  if (tabs.tasks) recapStats.push({ key: 't', ring: Math.min(1, recap.tasksDone / 7), color: 'rgb(var(--tasks))', value: recap.tasksDone, label: 'tasks' });
  if (tabs.money) recapStats.push({ key: 's', color: 'rgb(var(--money))', value: formatMoney(recap.spent, cur, { compact: true }), label: 'spent' });
  if (tabs.goals) recapStats.push({ key: 'g', color: 'rgb(var(--goals))', value: `${Math.round(goalP * 100)}%`, label: 'goals' });

  return (
    <div className="animate-fade-up space-y-4">
      <h1 className="font-display text-2xl font-extrabold tracking-tight">{greeting(settings.name)}</h1>

      <QuoteCard />

      {/* Encouragement message of the day */}
      <div className="card flex items-start gap-3 bg-gradient-to-br from-brand/10 to-brand-2/10 p-4">
        <Sparkles size={20} className="mt-0.5 shrink-0 text-brand" />
        <p className="text-sm font-semibold text-ink">{motd}</p>
      </div>

      {/* Snapshot grid */}
      {cards.length > 0 && <div className="grid grid-cols-2 gap-3">{cards}</div>}

      {/* Weekly Life Recap */}
      {recapStats.length > 0 && (
        <div className="card-pad">
          <div className="mb-3 flex items-center justify-between">
            <p className="section-title">This week’s recap</p>
            <span className="text-xs font-semibold text-brand">{recapHeadline(recap)}</span>
          </div>
          <div className="grid gap-2 text-center" style={{ gridTemplateColumns: `repeat(${recapStats.length}, minmax(0, 1fr))` }}>
            {recapStats.map((s) => (
              <RecapStat key={s.key} ring={s.ring} color={s.color} value={s.value} label={s.label} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RecapStat({ ring, color, value, label }) {
  return (
    <div className="flex flex-col items-center gap-1">
      {ring != null ? (
        <ProgressRing value={ring} size={52} stroke={6} color={color}>
          <span className="text-xs font-extrabold">{value}</span>
        </ProgressRing>
      ) : (
        <div className="grid h-[52px] place-items-center">
          <span className="text-sm font-extrabold" style={{ color }}>{value}</span>
        </div>
      )}
      <span className="text-[11px] text-muted">{label}</span>
    </div>
  );
}
