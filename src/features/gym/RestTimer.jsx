import { useEffect, useRef, useState } from 'react';
import { Timer, Pause, Play, RotateCcw } from 'lucide-react';

const PRESETS = [60, 90, 120];

// Rest countdown between sets. Vibrates on finish where supported (feature-
// guarded for Capacitor/web compatibility).
export default function RestTimer() {
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!running) return undefined;
    ref.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(ref.current);
          setRunning(false);
          if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, [running]);

  const start = (secs) => {
    setRemaining(secs);
    setRunning(true);
  };

  const mmss = `${String(Math.floor(remaining / 60)).padStart(1, '0')}:${String(remaining % 60).padStart(2, '0')}`;

  return (
    <div className="card flex items-center gap-3 p-3">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-gym/15 text-gym"><Timer size={20} /></span>
      {remaining > 0 || running ? (
        <>
          <span className="font-display text-2xl font-extrabold tabular-nums">{mmss}</span>
          <div className="ml-auto flex gap-2">
            <button onClick={() => setRunning((v) => !v)} className="btn-ghost h-9 !px-3" aria-label={running ? 'Pause' : 'Resume'}>
              {running ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button onClick={() => { setRemaining(0); setRunning(false); }} className="btn-ghost h-9 !px-3" aria-label="Reset"><RotateCcw size={16} /></button>
          </div>
        </>
      ) : (
        <>
          <span className="text-sm font-semibold text-muted">Rest timer</span>
          <div className="ml-auto flex gap-2">
            {PRESETS.map((p) => (
              <button key={p} onClick={() => start(p)} className="btn-soft h-9 !px-3 text-xs">{p}s</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
