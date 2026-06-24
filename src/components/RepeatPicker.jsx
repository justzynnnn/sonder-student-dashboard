import { Repeat } from 'lucide-react';

const OPTIONS = [
  { id: 'none', label: 'Once' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

// Cadence selector shared by the add forms. Hidden in edit mode (you edit the
// single item, not the schedule).
export default function RepeatPicker({ value, onChange, accent = 'rgb(var(--brand))' }) {
  return (
    <div>
      <label className="label flex items-center gap-1.5"><Repeat size={13} /> Repeat</label>
      <div className="grid grid-cols-4 gap-2">
        {OPTIONS.map((opt) => {
          const active = opt.id === value;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className="min-h-11 rounded-2xl border px-1 text-sm font-bold transition active:scale-[0.98]"
              style={{
                borderColor: active ? accent : 'rgb(var(--line))',
                background: active ? `color-mix(in srgb, ${accent} 14%, transparent)` : 'rgb(var(--surface-2))',
                color: active ? accent : 'rgb(var(--muted))',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
