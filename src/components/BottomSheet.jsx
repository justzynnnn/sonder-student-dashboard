import { useCallback, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function BottomSheet({ open, onClose, title, children }) {
  const panelRef = useRef(null);
  const scrollRef = useRef(null);

  const keepFocusedFieldVisible = useCallback((event) => {
    const field = event.target;
    if (!field?.matches?.('input, select, textarea')) return;
    window.setTimeout(() => {
      const scroller = scrollRef.current;
      if (!scroller) return;
      const fieldRect = field.getBoundingClientRect();
      const scrollRect = scroller.getBoundingClientRect();
      const topOverflow = fieldRect.top - scrollRect.top - 24;
      const bottomOverflow = fieldRect.bottom - scrollRect.bottom + 24;
      if (topOverflow < 0) scroller.scrollBy({ top: topOverflow, behavior: 'smooth' });
      if (bottomOverflow > 0) scroller.scrollBy({ top: bottomOverflow, behavior: 'smooth' });
    }, 120);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const scrollY = window.scrollY;
    const previous = {
      left: document.body.style.left,
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
      position: document.body.style.position,
      right: document.body.style.right,
      top: document.body.style.top,
      width: document.body.style.width,
    };
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = '0px';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.left = previous.left;
      document.body.style.overflow = previous.overflow;
      document.body.style.paddingRight = previous.paddingRight;
      document.body.style.position = previous.position;
      document.body.style.right = previous.right;
      document.body.style.top = previous.top;
      document.body.style.width = previous.width;
      window.scrollTo(0, scrollY);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !window.visualViewport) return undefined;
    const syncViewport = () => {
      const panel = panelRef.current;
      if (!panel) return;
      const keyboardInset = Math.max(0, window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop);
      panel.style.maxHeight = `${Math.max(320, window.visualViewport.height - 24)}px`;
      panel.style.marginBottom = `${keyboardInset}px`;
    };
    syncViewport();
    window.visualViewport.addEventListener('resize', syncViewport);
    window.visualViewport.addEventListener('scroll', syncViewport);
    return () => {
      window.visualViewport.removeEventListener('resize', syncViewport);
      window.visualViewport.removeEventListener('scroll', syncViewport);
      if (panelRef.current) {
        panelRef.current.style.maxHeight = '';
        panelRef.current.style.marginBottom = '';
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid items-end justify-items-center p-3 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-hidden="true" tabIndex={-1} className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={panelRef}
        className="bottom-sheet-panel relative flex w-full max-w-lg flex-col overflow-hidden rounded-[1.75rem] border border-line/80 bg-surface shadow-2xl"
        onFocusCapture={keepFocusedFieldVisible}
      >
        <div className="shrink-0 border-b border-line/70 bg-surface/95 px-5 pb-4 pt-3 backdrop-blur">
          <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-line" aria-hidden="true" />
          <div className="flex items-center justify-between gap-3">
            <h2 className="min-w-0 truncate font-display text-lg font-extrabold">{title}</h2>
            <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-surface-2 text-muted transition hover:text-ink active:scale-95">
              <X size={18} />
            </button>
          </div>
        </div>
        <div ref={scrollRef} className="bottom-sheet-scroll w-full overflow-y-auto overscroll-contain px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  );
}
