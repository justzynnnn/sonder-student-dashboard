import { useEffect, useMemo, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { useSettings } from '../hooks/useSettings';
import { clearLegacySeedQuotesForFreshSetup } from '../data/quotes';
import { materializeRecurrences } from '../data/recurrences';
import { pruneOrphanHabits } from '../data/habits';
import { requestPersistentStorage } from '../data/admin';
import { maybeRemind } from '../lib/reminders';
import { computeStreak } from '../lib/streaks';
import { todayISO } from '../lib/dates';
import { FeedbackProvider } from '../components/Feedback';

import AppLayout from './AppLayout';
import Onboarding from './Onboarding';
import HomeTab from '../features/home/HomeTab';
import MoneyTab from '../features/money/MoneyTab';
import TasksTab from '../features/tasks/TasksTab';
import TimeTab from '../features/time/TimeTab';
import GymTab from '../features/gym/GymTab';
import GoalsTab from '../features/goals/GoalsTab';
import SettingsPage from '../features/settings/SettingsPage';
import AppIcon from '../components/AppIcon';
import FormEffects from '../components/FormEffects';

function Splash() {
  return (
    <div className="grid min-h-screen place-items-center">
      <AppIcon className="h-16 w-16 animate-pop-in rounded-3xl shadow-glow-lg" />
    </div>
  );
}

export default function App() {
  const { settings, loading } = useSettings();
  const checkins = useLiveQuery(() => db.checkins.toArray(), [], []);

  // First-run cleanup, catch up repeating items, and ask to keep data durable.
  // NOTE: no auto check-in — the streak is earned by real actions (logging an
  // expense, finishing a task, a workout, a habit), not by merely opening the app.
  useEffect(() => {
    clearLegacySeedQuotesForFreshSetup();
    materializeRecurrences();
    pruneOrphanHabits();
    requestPersistentStorage();
  }, []);

  // Daily reminder: re-checked every minute against the latest settings/checkins.
  const remindRef = useRef(() => {});
  remindRef.current = () => {
    const checkedInToday = (checkins || []).some((c) => c.date === todayISO());
    maybeRemind(settings, checkedInToday);
  };
  useEffect(() => {
    remindRef.current();
    const id = setInterval(() => remindRef.current(), 60_000);
    return () => clearInterval(id);
  }, []);

  const streak = useMemo(
    () => computeStreak((checkins || []).map((c) => c.date)).current,
    [checkins],
  );

  if (loading) return <Splash />;
  if (!settings.onboarded) {
    return (
      <FeedbackProvider>
        <FormEffects />
        <Onboarding onDone={() => {}} />
      </FeedbackProvider>
    );
  }

  const tabs = settings.tabs;

  return (
    <FeedbackProvider>
      <FormEffects />
      <Routes>
        <Route element={<AppLayout streak={streak} tabs={tabs} />}>
          <Route index element={<HomeTab streak={streak} tabs={tabs} />} />
          {/* Disabled tabs redirect home so deep links never dead-end. */}
          <Route path="money" element={tabs.money ? <MoneyTab /> : <Navigate to="/" replace />} />
          <Route path="tasks" element={tabs.tasks ? <TasksTab /> : <Navigate to="/" replace />} />
          <Route path="time" element={tabs.time ? <TimeTab /> : <Navigate to="/" replace />} />
          <Route path="gym" element={tabs.gym ? <GymTab /> : <Navigate to="/" replace />} />
          <Route path="goals" element={tabs.goals ? <GoalsTab /> : <Navigate to="/" replace />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </FeedbackProvider>
  );
}
