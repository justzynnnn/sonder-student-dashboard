import { categoryMeta } from '../../data/categories';

// SVG donut of spending-by-category. data: [{ category, total }] (sorted desc).
export default function CategoryDonut({ data, total, size = 132, stroke = 16 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--line))" strokeWidth={stroke} />
      {total > 0 &&
        data.map((d) => {
          const frac = d.total / total;
          const len = frac * c;
          const seg = (
            <circle
              key={d.category}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={categoryMeta(d.category).color}
              strokeWidth={stroke}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return seg;
        })}
    </svg>
  );
}
