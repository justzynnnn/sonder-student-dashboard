import { addTask } from './tasks';
import { addAccount, addExpense } from './money';
import { addTimeEntry } from './time';
import { addGoal } from './goals';
import { addHabit } from './habits';
import { todayISO, toISO } from '../lib/dates';

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISO(d);
};

// A few editable examples so a brand-new install isn't five blank screens.
// Everything here is deletable/editable — it's a demo, not real data.
export async function seedStarterData(tabs = {}) {
  if (tabs.tasks) {
    await addTask({ title: 'Read one chapter', priority: 'med', category: 'School', dueDate: todayISO() });
    await addTask({ title: 'Reply to group project chat', priority: 'low', category: 'School', dueDate: '' });
  }

  if (tabs.money) {
    const wallet = await addAccount({ name: 'Cash', type: 'cash', balance: 2000 });
    await addExpense({ amount: 120, category: 'Food', description: 'Lunch', date: todayISO(), accountId: wallet.id });
    await addExpense({ amount: 60, category: 'Transport', description: 'Bus', date: daysAgo(1), accountId: wallet.id });
  }

  if (tabs.time) {
    await addTimeEntry({ date: todayISO(), startTime: '09:00', endTime: '10:30', description: 'Study session', category: 'Study' });
  }

  if (tabs.goals) {
    const goal = await addGoal({ title: 'Build a steady routine', lifeCategory: 'growth' });
    await addHabit({ goalId: goal.id, title: 'Drink water', days: [0, 1, 2, 3, 4, 5, 6] });
    await addHabit({ goalId: goal.id, title: 'Read 20 minutes', days: [0, 1, 2, 3, 4] });
  }
}
