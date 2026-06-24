import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus } from 'lucide-react';
import { db } from '../data/db';
import { CATEGORY_PALETTE, addCustomCategory, mergeCategories } from '../data/categories';
import { useFeedback } from './Feedback';

export default function CategoryPicker({
  domain,
  value,
  onChange,
  label = 'Category',
  optional = false,
}) {
  const { toast } = useFeedback();
  const custom = useLiveQuery(
    () => db.customCategories.where('domain').equals(domain).toArray(),
    [domain],
    [],
  );
  const categories = useMemo(() => mergeCategories(domain, custom || []), [domain, custom]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(CATEGORY_PALETTE[0]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!optional && !value && categories[0]) onChange?.(categories[0].name);
  }, [categories, onChange, optional, value]);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const category = await addCustomCategory({ domain, name, color });
      onChange?.(category.name);
      setName('');
      setColor(CATEGORY_PALETTE[0]);
      setAdding(false);
    } catch (err) {
      toast(err.message, 'bad');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex flex-wrap gap-2">
        {optional ? (
          <CategoryChip active={!value} name="None" color="rgb(var(--muted))" onClick={() => onChange?.('')} />
        ) : null}
        {categories.map((category) => (
          <CategoryChip
            key={category.name}
            active={category.name === value}
            name={category.name}
            color={category.color}
            onClick={() => onChange?.(category.name)}
          />
        ))}
        <button type="button" onClick={() => setAdding((next) => !next)} className="chip border border-line bg-surface-2 text-muted transition hover:border-brand/25 hover:bg-brand/10 hover:text-brand">
          <Plus size={13} />
          New
        </button>
      </div>

      {adding ? (
        <div className="mt-3 rounded-[1.35rem] border border-line bg-surface-2/70 p-3">
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Category name"
              className="input min-h-11 py-2.5"
              maxLength={30}
            />
            <button type="button" disabled={busy} onClick={submit} className="btn-add-soft shrink-0">
              Add
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {CATEGORY_PALETTE.slice(0, 10).map((swatch) => (
              <button
                key={swatch}
                type="button"
                aria-label={`Use ${swatch}`}
                onClick={() => setColor(swatch)}
                className="h-7 w-7 rounded-full border-2 transition active:scale-95"
                style={{ background: swatch, borderColor: color === swatch ? 'rgb(var(--ink))' : 'transparent' }}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CategoryChip({ active, name, color, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="chip border transition"
      style={{
        borderColor: active ? color : 'rgb(var(--line))',
        background: active ? `color-mix(in srgb, ${color} 18%, transparent)` : 'rgb(var(--surface-2))',
        color: active ? color : 'rgb(var(--muted))',
      }}
    >
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <span className="max-w-28 truncate">{name}</span>
    </button>
  );
}
