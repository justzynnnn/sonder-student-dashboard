import { useEffect, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { useSettings } from '../hooks/useSettings';
import { recordCheckin } from '../data/checkins';
import { seedQuotesIfEmpty } from '../data/quotes';
import { computeStreak } from '../lib/streaks';
import { FeedbackProvider } from '../components/Feedback';

import AppLayout from './AppLayout';
import Onboarding from './Onboarding';
import HomeTab from '../features/home/HomeTab';
import MoneyTab from '../features/money/MoneyTab';
import TasksTab from '../features/tasks/TasksTab';
import GymTab from '../features/gym/GymTab';
import GoalsTab from '../features/goals/GoalsTab';
import SettingsPage from '../features/settings/SettingsPage';
import AppIcon from '../components/AppIcon';

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

  // Daily check-in + first-run seed. Runs once on mount.
  useEffect(() => {
    recordCheckin();
    seedQuotesIfEmpty();
  }, []);

  const streak = useMemo(
    () => computeStreak((checkins || []).map((c) => c.date)).current,
    [checkins],
  );

  if (loading) return <Splash />;
  if (!settings.onboarded) {
    return (
      <FeedbackProvider>
        <Onboarding onDone={() => {}} />
      </FeedbackProvider>
    );
  }

  const tabs = settings.tabs;

  return (
    <FeedbackProvider>
      <Routes>
        <Route element={<AppLayout streak={streak} tabs={tabs} />}>
          <Route index element={<HomeTab streak={streak} tabs={tabs} />} />
          {/* Disabled tabs redirect home so deep links never dead-end. */}
          <Route path="money" element={tabs.money ? <MoneyTab /> : <Navigate to="/" replace />} />
          <Route path="tasks" element={tabs.tasks ? <TasksTab /> : <Navigate to="/" replace />} />
          <Route path="gym" element={tabs.gym ? <GymTab /> : <Navigate to="/" replace />} />
          <Route path="goals" element={tabs.goals ? <GoalsTab /> : <Navigate to="/" replace />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </FeedbackProvider>
  );
}
