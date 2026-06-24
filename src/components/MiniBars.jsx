// Lightweight inline-SVG bar chart for trends — no chart dependency. Pass an
// array of { value, label } and an accent color. Highlights the last bar.
export default function MiniBars({ data = [], color = 'rgb(var(--brand))', height = 56, format }) {
  const values = data.map((d) => (typeof d === 'number' ? d : d.value || 0));
  const max = Math.max(1, ...values);
  const peak = format ? format(Math.max(...values)) : null;

  return (
    <div>
      <div className="flex items-end gap-1.5" style={{ height }} role="img" aria-label="Trend chart">
        {data.map((d, i) => {
          const value = typeof d === 'number' ? d : d.value || 0;
          const last = i === data.length - 1;
          const pct = Math.round((value / max) * 100);
          return (
            <div key={(d.label ?? i) + String(i)} className="flex flex-1 flex-col items-center justify-end" style={{ height: '100%' }}>
              <div
                className="w-full rounded-t-md transition-all duration-500"
                style={{
                  height: `${Math.max(3, pct)}%`,
                  background: color,
                  opacity: last ? 1 : 0.45,
                }}
                title={typeof d === 'object' && d.label ? `${d.label}: ${value}` : String(value)}
              />
            </div>
          );
        })}
      </div>
      {data.some((d) => typeof d === 'object' && d.label) ? (
        <div className="mt-1 flex gap-1.5">
          {data.map((d, i) => (
            <span key={(d.label ?? i) + 'lbl' + i} className="flex-1 truncate text-center text-[9px] font-semibold text-muted">
              {typeof d === 'object' ? d.label : ''}
            </span>
          ))}
        </div>
      ) : null}
      {peak ? <p className="mt-1 text-[10px] font-semibold text-muted">Peak {peak}</p> : null}
    </div>
  );
}
