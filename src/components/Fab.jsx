import { Plus } from 'lucide-react';

// Floating quick-add button — sits above the tab bar, always one tap from
// logging anything.
export default function Fab({ onClick, label = 'Quick add' }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-2 text-white shadow-glow-lg transition active:scale-90"
    >
      <Plus size={26} strokeWidth={2.6} />
    </button>
  );
}
