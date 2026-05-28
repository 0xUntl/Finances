import { MONTHS_FR } from '../lib/format';

type Props = {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
};

export function MonthNav({ year, month, onChange }: Props) {
  const prev = () => {
    if (month === 1) onChange(year - 1, 12);
    else onChange(year, month - 1);
  };
  const next = () => {
    if (month === 12) onChange(year + 1, 1);
    else onChange(year, month + 1);
  };

  return (
    <div className="flex items-center gap-1">
      <button onClick={prev} className="px-2 py-1 text-slate-500 hover:text-ink transition">
        ‹
      </button>
      <div className="flex items-center gap-2">
        <select
          value={month}
          onChange={(e) => onChange(year, Number(e.target.value))}
          className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer"
        >
          {MONTHS_FR.map((m, i) => (
            <option key={i} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={year}
          onChange={(e) => onChange(Number(e.target.value), month)}
          className="w-16 bg-transparent text-sm font-medium focus:outline-none"
        />
      </div>
      <button onClick={next} className="px-2 py-1 text-slate-500 hover:text-ink transition">
        ›
      </button>
    </div>
  );
}
