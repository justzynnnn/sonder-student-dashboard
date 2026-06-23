import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Quote, Pin, PinOff, Trash2, Plus } from 'lucide-react';
import { db } from '../../data/db';
import { pickDailyQuote, addQuote, deleteQuote, togglePin } from '../../data/quotes';
import BottomSheet from '../../components/BottomSheet';
import { useFeedback } from '../../components/Feedback';

export default function QuoteCard() {
  const quotes = useLiveQuery(() => db.quotes.toArray(), [], []);
  const [open, setOpen] = useState(false);
  const daily = pickDailyQuote(quotes);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="card relative w-full overflow-hidden p-5 text-left active:scale-[0.99]"
      >
        <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-brand/10 blur-2xl" />
        <Quote size={22} className="mb-2 text-brand" />
        <p className="font-display text-lg font-bold leading-snug text-ink">
          {daily ? daily.text : 'Add your first quote to start each day inspired.'}
        </p>
        {daily?.author ? <p className="mt-2 text-sm text-muted">— {daily.author}</p> : null}
        <p className="mt-3 text-xs font-semibold text-brand">
          {daily?.pinned ? 'Pinned' : 'Tap to manage your quotes'}
        </p>
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Your quote library">
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
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a quote or saying…" className="input" maxLength={200} />
        <div className="flex gap-2">
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author (optional)" className="input" maxLength={40} />
          <button type="submit" disabled={busy} className="btn-primary shrink-0"><Plus size={18} /> Add</button>
        </div>
      </form>

      <p className="section-title mt-5 mb-2">Pin one to stop daily rotation</p>
      <ul className="space-y-2">
        {(quotes || []).map((q) => (
          <li key={q.id} className="card flex items-start gap-3 p-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">{q.text}</p>
              {q.author ? <p className="mt-0.5 text-xs text-muted">— {q.author}</p> : null}
            </div>
            <button onClick={() => togglePin(q.id)} aria-label="Pin" className={`grid h-8 w-8 place-items-center rounded-lg ${q.pinned ? 'bg-brand/15 text-brand' : 'text-muted hover:bg-surface-2'}`}>
              {q.pinned ? <Pin size={16} /> : <PinOff size={16} />}
            </button>
            <button onClick={() => deleteQuote(q.id)} aria-label="Delete" className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:text-rose-500">
              <Trash2 size={16} />
            </button>
          </li>
        ))}
        {(!quotes || quotes.length === 0) && (
          <p className="py-6 text-center text-sm text-muted">No quotes yet — add one above.</p>
        )}
      </ul>
    </div>
  );
}
