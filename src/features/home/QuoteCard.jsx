import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Quote, Pin, PinOff, Trash2, Plus, Sparkles } from 'lucide-react';
import { db } from '../../data/db';
import { pickDailyQuote, addQuote, deleteQuote, togglePin } from '../../data/quotes';
import BottomSheet from '../../components/BottomSheet';
import StatPill from '../../components/StatPill';
import { useFeedback } from '../../components/Feedback';

export default function QuoteCard() {
  const quotes = useLiveQuery(() => db.quotes.toArray(), [], []);
  const [open, setOpen] = useState(false);
  const daily = pickDailyQuote(quotes);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="quote-card group relative w-full overflow-hidden p-5 text-left transition duration-300 hover:-translate-y-0.5 active:scale-[0.99]"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand/15 text-brand">
            <Quote size={19} strokeWidth={2.4} />
          </span>
          <StatPill
            icon={Sparkles}
            label={daily?.pinned ? 'Pinned' : 'Daily'}
            accent="rgb(var(--brand))"
            tone="soft"
          />
        </div>
        <p className="mt-5 font-display text-[1.35rem] font-extrabold leading-tight text-ink">
          {daily ? daily.text : 'Add your first quote to start each day inspired.'}
        </p>
        {daily?.author ? <p className="mt-3 text-sm font-semibold text-muted">- {daily.author}</p> : null}
        <p className="mt-5 text-xs font-bold text-brand/90">Tap to tend your quote library</p>
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Quote library">
        <QuoteLibrary quotes={quotes} />
      </BottomSheet>
    </>
  );
}

function QuoteLibrary({ quotes }) {
  const { toast } = useFeedback();
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);

  const add = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await addQuote({ text, author });
      setText('');
      setAuthor('');
    } catch (err) {
      toast(err.message, 'bad');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pb-4">
      <form onSubmit={add} className="space-y-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a quote or saying..."
          className="input"
          maxLength={200}
          enterKeyHint="next"
        />
        <div className="flex gap-2">
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Author (optional)"
            className="input"
            maxLength={40}
            enterKeyHint="done"
          />
          <button type="submit" disabled={busy} className="btn-add-primary shrink-0">
            <span className="add-symbol"><Plus size={16} /></span>
            <span>Add</span>
          </button>
        </div>
      </form>

      <p className="section-title mb-2 mt-5">Pinned calm</p>
      <ul className="space-y-2">
        {(quotes || []).map((q) => (
          <li key={q.id} className="soft-card flex items-start gap-3 p-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">{q.text}</p>
              {q.author ? <p className="mt-0.5 text-xs text-muted">- {q.author}</p> : null}
            </div>
            <button
              onClick={() => togglePin(q.id)}
              aria-label="Pin"
              className={`grid h-8 w-8 place-items-center rounded-xl ${q.pinned ? 'bg-brand/15 text-brand' : 'text-muted hover:bg-surface-2'}`}
            >
              {q.pinned ? <Pin size={16} /> : <PinOff size={16} />}
            </button>
            <button onClick={() => deleteQuote(q.id)} aria-label="Delete" className="grid h-8 w-8 place-items-center rounded-xl text-muted hover:text-rose-500">
              <Trash2 size={16} />
            </button>
          </li>
        ))}
        {(!quotes || quotes.length === 0) && (
          <p className="py-6 text-center text-sm text-muted">No quotes yet. Add one above.</p>
        )}
      </ul>
    </div>
  );
}
