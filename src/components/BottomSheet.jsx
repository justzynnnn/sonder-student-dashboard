import { useEffect } from 'react';
import { X } from 'lucide-react';

// Mobile-first bottom sheet modal. Locks body scroll while open and respects
// the safe-area inset so the close affordance clears the home indicator.
export default function BottomSheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Close" className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[88vh] animate-sheet-up overflow-y-auto rounded-t-4xl border border-line bg-surface pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface/95 px-5 py-4 backdrop-blur">
          <h2 className="font-display text-lg font-extrabold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-xl bg-surface-2 text-muted">
            <X size={18} />
          </button>
        </div>
        <div className="mx-auto w-full max-w-lg px-5 pt-4">{children}</div>
      </div>
    </div>
  );
}
