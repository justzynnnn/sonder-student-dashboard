import { createContext, useContext, useState, useCallback, useRef } from 'react';

const FeedbackContext = createContext(null);
const CONFETTI_COLORS = ['#6366f1', '#a855f7', '#10b981', '#f97316', '#0ea5e9', '#ec4899', '#eab308'];

// Provides toast() for short messages and celebrate() for small-win confetti +
// optional toast. Positive reinforcement, centralised (plan §2 "small wins").
export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [bursts, setBursts] = useState([]);
  const idRef = useRef(0);

  const toast = useCallback((message, tone = 'default') => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  const celebrate = useCallback((message) => {
    const id = ++idRef.current;
    const pieces = Array.from({ length: 26 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: Math.random() * 0.15,
      rotate: Math.random() * 360,
    }));
    setBursts((b) => [...b, { id, pieces }]);
    setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 1100);
    if (message) toast(message, 'good');
  }, [toast]);

  return (
    <FeedbackContext.Provider value={{ toast, celebrate }}>
      {children}

      {/* Toasts */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto animate-pop-in rounded-2xl px-4 py-2.5 text-sm font-semibold shadow-glow ${
              t.tone === 'good'
                ? 'bg-money text-white'
                : t.tone === 'warn'
                ? 'bg-gym text-white'
                : t.tone === 'bad'
                ? 'bg-rose-500 text-white'
                : 'bg-ink text-surface'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* Confetti bursts */}
      {bursts.map((burst) => (
        <div key={burst.id} className="pointer-events-none fixed inset-x-0 top-24 z-[60] mx-auto h-0 max-w-md">
          {burst.pieces.map((p) => (
            <span
              key={p.id}
              className="confetti-piece"
              style={{
                left: `${p.left}%`,
                background: p.color,
                animationDelay: `${p.delay}s`,
                transform: `rotate(${p.rotate}deg)`,
              }}
            />
          ))}
        </div>
      ))}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) return { toast: () => {}, celebrate: () => {} };
  return ctx;
}
