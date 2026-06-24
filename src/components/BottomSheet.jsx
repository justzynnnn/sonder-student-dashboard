import { useCallback, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function BottomSheet({ open, onClose, title, children }) {
  const panelRef = useRef(null);

  const keepFocusedFieldVisible = useCallback((event) => {
    const field = event.target;
    if (!field?.matches?.('input, select, textarea')) return;
    window.setTimeout(() => {
      field.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
    }, 120);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    const prevPadding = document.body.style.paddingRight;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = '0px';
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.body.style.paddingRight = prevPadding;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !window.visualViewport) return undefined;
    const syncViewport = () => {
      const panel = panelRef.current;
      if (!panel) return;
      panel.style.maxHeight = `${Math.max(320, window.visualViewport.height - 12)}px`;
    };
    syncViewport();
    window.visualViewport.addEventListener('resize', syncViewport);
    window.visualViewport.addEventListener('scroll', syncViewport);
    return () => {
      window.visualViewport.removeEventListener('resize', syncViewport);
      window.visualViewport.removeEventListener('scroll', syncViewport);
      if (panelRef.current) panelRef.current.style.maxHeight = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Close" className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={panelRef}
        className="bottom-sheet-panel relative mx-auto w-full max-w-xl animate-sheet-up rounded-t-[1.75rem] border border-line/80 bg-surface pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl"
        onFocusCapture={keepFocusedFieldVisible}
      >
        <div className="sticky top-0 z-10 border-b border-line/70 bg-surface/95 px-5 pb-4 pt-3 backdrop-blur">
          <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-line" aria-hidden="true" />
          <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-extrabold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-2xl bg-surface-2 text-muted transition hover:text-ink active:scale-95">
            <X size={18} />
          </button>
          </div>
        </div>
        <div className="mx-auto w-full max-w-lg px-5 pt-4">{children}</div>
      </div>
    </div>
  );
}
