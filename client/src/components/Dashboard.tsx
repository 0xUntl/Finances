import type { Settings, Summary } from '../lib/types';
import { eur } from '../lib/format';

type Props = { summary: Summary | null; settings: Settings };

export function Dashboard({ summary }: Props) {
  if (!summary) return <div className="card text-slate-400 text-sm">Calcul…</div>;
  const r = summary.revenue;

  const tile = (label: string, value: number, sub?: string, tone: 'default' | 'pro' | 'perso' | 'invest' | 'bonta' = 'default') => {
    const toneCls = {
      default: 'bg-white border-slate-200',
      pro: 'bg-amber-50 border-amber-100',
      perso: 'bg-sky-50 border-sky-100',
      invest: 'bg-emerald-50 border-emerald-100',
      bonta: 'bg-violet-50 border-violet-100',
    }[tone];
    return (
      <div className={`rounded-2xl border p-4 ${toneCls}`}>
        <div className="label">{label}</div>
        <div className="mt-1 text-xl font-semibold num">{eur(value)}</div>
        {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {tile('Brut du mois', r.gross, r.deductions ? `- ${eur(r.deductions)} déduits` : undefined)}
      {tile('Pro', r.pro, undefined, 'pro')}
      {tile('Perso', r.perso, undefined, 'perso')}
      {tile('Prévision invest', r.prevision_invest, undefined, 'invest')}
      {tile('Bonta & Matelas', r.bonta_matelas, undefined, 'bonta')}
    </div>
  );
}
