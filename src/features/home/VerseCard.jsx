import { useState } from 'react';
import { BookOpen, RefreshCw } from 'lucide-react';
import { verseOfTheDay, randomVerse } from '../../data/verses';

// A gentle verse for the day. Defaults to a day-stable pick so it doesn't
// flicker, with a tap to draw a fresh one at random.
export default function VerseCard() {
  const [verse, setVerse] = useState(() => verseOfTheDay());

  return (
    <section className="quote-card p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand/15 text-brand">
          <BookOpen size={18} strokeWidth={2.4} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="section-title">Verse for today</p>
            <button
              onClick={() => setVerse(randomVerse())}
              aria-label="Another verse"
              className="grid h-7 w-7 place-items-center rounded-full text-muted transition hover:text-brand active:scale-90"
            >
              <RefreshCw size={14} />
            </button>
          </div>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-ink">“{verse.text}”</p>
          <p className="mt-1 text-xs font-bold text-brand">{verse.ref}</p>
        </div>
      </div>
    </section>
  );
}
