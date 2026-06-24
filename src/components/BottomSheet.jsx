import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function BottomSheet({ open, onClose, title, children }) {
  const frameRef = useRef(null);
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
    const previous = {
      bodyOverflow: document.body.style.overflow,
      bodyPaddingRight: document.body.style.paddingRight,
      htmlOverflow: document.documentElement.style.overflow,
    };
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = '0px';
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous.bodyOverflow;
      document.body.style.paddingRight = previous.bodyPaddingRight;
      document.documentElement.style.overflow = previous.htmlOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !window.visualViewport) return undefined;
    const syncViewport = () => {
      const frame = frameRef.current;
      const panel = panelRef.current;
      if (!panel || !frame) return;
      const viewportHeight = window.visualViewport.height;
      frame.style.height = `${viewportHeight}px`;
      frame.style.top = `${window.visualViewport.offsetTop}px`;
      frame.style.bottom = 'auto';
      panel.style.maxHeight = `${Math.max(320, window.visualViewport.height - 24)}px`;
    };
    syncViewport();
    window.visualViewport.addEventListener('resize', syncViewport);
    window.visualViewport.addEventListener('scroll', syncViewport);
    return () => {
      window.visualViewport.removeEventListener('resize', syncViewport);
      window.visualViewport.removeEventListener('scroll', syncViewport);
      if (panelRef.current) {
        panelRef.current.style.maxHeight = '';
      }
      if (frameRef.current) {
        frameRef.current.style.height = '';
        frameRef.current.style.top = '';
        frameRef.current.style.bottom = '';
      }
    };
  }, [open]);

  if (!open) return null;

  const sheet = (
    <div ref={frameRef} className="bottom-sheet-frame fixed inset-x-0 top-0 z-50 grid h-[100dvh] items-end justify-items-center p-3 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-hidden="true" tabIndex={-1} className="bottom-sheet-backdrop absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
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

  return createPortal(sheet, document.body);
}
