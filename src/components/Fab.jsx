import { Plus } from 'lucide-react';

export default function Fab({ onClick, label = 'Quick add' }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-5 z-40 grid h-14 w-14 place-items-center rounded-[1.35rem] border border-white/10 bg-gradient-to-br from-brand to-brand-2 text-white shadow-glow-lg transition hover:-translate-y-0.5 active:scale-90"
    >
      <Plus size={26} strokeWidth={2.6} />
    </button>
  );
}
