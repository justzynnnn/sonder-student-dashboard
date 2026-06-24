import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, ListChecks, Dumbbell, Target } from 'lucide-react';
import BottomSheet from '../components/BottomSheet';
import AddExpenseForm from '../features/money/AddExpenseForm';
import AddTaskForm from '../features/tasks/AddTaskForm';

const MENU = [
  { id: 'expense', tab: 'money', label: 'Expense', icon: Wallet, accent: 'rgb(var(--money))' },
  { id: 'task', tab: 'tasks', label: 'Task', icon: ListChecks, accent: 'rgb(var(--tasks))' },
  { id: 'workout', tab: 'gym', label: 'Workout', icon: Dumbbell, accent: 'rgb(var(--gym))' },
  { id: 'goal', tab: 'goals', label: 'Goal', icon: Target, accent: 'rgb(var(--goals))' },
];

export default function QuickAdd({ open, onClose, tabs = {} }) {
  const [mode, setMode] = useState(null);
  const navigate = useNavigate();
  const items = MENU.filter((m) => tabs[m.tab]);

  const close = () => {
    setMode(null);
    onClose();
  };

  const choose = (id) => {
    if (id === 'workout') {
      close();
      navigate('/gym');
    } else if (id === 'goal') {
      close();
      navigate('/goals');
    } else {
      setMode(id);
    }
  };

  const title = mode === 'expense' ? 'Add expense' : mode === 'task' ? 'Add task' : 'Quick add';

  return (
    <BottomSheet open={open} onClose={close} title={title}>
      {!mode && (
        items.length === 0 ? (
          <p className="px-1 pb-6 pt-2 text-center text-sm text-muted">
            Turn on a tab in Settings to start adding things here.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 pb-4">
            {items.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => choose(m.id)}
                  className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-[1.35rem] border border-line/75 bg-surface-2/70 p-4 text-center transition hover:-translate-y-0.5 hover:border-brand/25 hover:bg-surface active:scale-95"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-2xl" style={{ background: `color-mix(in srgb, ${m.accent} 16%, transparent)`, color: m.accent }}>
                    <Icon size={24} strokeWidth={2.4} />
                  </span>
                  <span className="truncate font-semibold">{m.label}</span>
                </button>
              );
            })}
          </div>
        )
      )}
      {mode === 'expense' && <AddExpenseForm onDone={close} />}
      {mode === 'task' && <AddTaskForm onDone={close} />}
    </BottomSheet>
  );
}
