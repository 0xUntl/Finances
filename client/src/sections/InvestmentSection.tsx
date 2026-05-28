import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import type { Investment, Settings, Summary } from '../lib/types';
import { eur } from '../lib/format';
import { Section } from '../components/Section';
import { AutoInput } from '../components/AutoInput';

type Props = {
  year: number;
  month: number;
  settings: Settings;
  summary: Summary | null;
  onChange: () => void;
};

const GROUP_LABEL: Record<string, string> = { pea: 'PEA', or: 'Or', crypto: 'Crypto' };

export function InvestmentSection({ year, month, settings, summary, onChange }: Props) {
  const [rows, setRows] = useState<Investment[]>([]);

  const load = useCallback(async () => {
    setRows(await api.get<Investment[]>(`/investments?year=${year}&month=${month}`));
  }, [year, month]);

  useEffect(() => {
    load();
  }, [load]);

  const totalAlloue = summary?.revenue.prevision_invest ?? 0;
  const alloc = settings.invest_allocation;

  const groupTotals = useMemo(() => ({
    pea: totalAlloue * (alloc.pea || 0),
    or: totalAlloue * (alloc.or || 0),
    crypto: totalAlloue * (alloc.crypto || 0),
  }), [totalAlloue, alloc]);

  const upd = async (id: number, patch: Partial<Investment>) => {
    await api.put(`/investments/${id}`, patch);
    onChange();
  };

  const toggle = async (r: Investment) => {
    const next = r.done ? 0 : 1;
    setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, done: next } : x)));
    await api.put(`/investments/${r.id}/status`, { year, month, done: next });
    onChange();
  };

  const add = async (group: 'pea' | 'or' | 'crypto') => {
    await api.post('/investments', {
      support: group === 'pea' ? 'PEA' : group === 'or' ? 'monCOFFRE' : 'Ledger',
      asset: 'Nouveau',
      group_pct: 0,
      parent_group: group,
      sort_order: rows.length + 99,
    });
    await load();
    onChange();
  };

  const remove = async (id: number) => {
    if (!confirm('Supprimer cette ligne ?')) return;
    await api.del(`/investments/${id}`);
    await load();
    onChange();
  };

  return (
    <Section
      title="Investissement"
      hint="Calcul automatique basé sur l'enveloppe Prévision invest du mois."
    >
      <div className="grid grid-cols-3 gap-3 mb-5">
        {(['pea', 'or', 'crypto'] as const).map((g) => (
          <div key={g} className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3">
            <div className="label">{GROUP_LABEL[g]} ({((alloc[g] || 0) * 100).toFixed(0)}%)</div>
            <div className="text-lg font-semibold num mt-1">{eur(groupTotals[g])}</div>
          </div>
        ))}
      </div>

      {(['pea', 'or', 'crypto'] as const).map((g) => {
        const groupRows = rows.filter((r) => r.parent_group === g);
        return (
          <div key={g} className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-slate-700">{GROUP_LABEL[g]}</h4>
              <button onClick={() => add(g)} className="text-xs text-ink/60 hover:text-ink">
                + ligne
              </button>
            </div>
            {!groupRows.length && <p className="text-xs text-slate-400 pl-2">—</p>}
            {!!groupRows.length && (
              <div className="space-y-1">
                <div className="grid grid-cols-12 gap-2 text-xs text-slate-400 px-2">
                  <div className="col-span-1"></div>
                  <div className="col-span-3">Support</div>
                  <div className="col-span-3">Actif</div>
                  <div className="col-span-2">ISIN</div>
                  <div className="col-span-1 text-right">%</div>
                  <div className="col-span-1 text-right">Montant</div>
                  <div className="col-span-1"></div>
                </div>
                {groupRows.map((r) => {
                  const amount = groupTotals[g] * (r.group_pct || 0);
                  return (
                    <div
                      key={r.id}
                      className={`grid grid-cols-12 gap-2 items-center px-2 py-1 rounded-lg transition ${
                        r.done ? 'bg-emerald-50/40' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="col-span-1 flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={!!r.done}
                          onChange={() => toggle(r)}
                          className="w-4 h-4 accent-emerald-600 cursor-pointer"
                        />
                        {!!r.automated && <span className="text-[10px] text-emerald-600">auto</span>}
                      </div>
                      <div className="col-span-3">
                        <AutoInput value={r.support} onSave={(v) => upd(r.id, { support: v })} />
                      </div>
                      <div className="col-span-3">
                        <AutoInput value={r.asset} onSave={(v) => upd(r.id, { asset: v })} />
                      </div>
                      <div className="col-span-2">
                        <AutoInput
                          value={r.isin}
                          onSave={(v) => upd(r.id, { isin: v || null })}
                          className="input-flat text-xs text-slate-500"
                        />
                      </div>
                      <div className="col-span-1">
                        <AutoInput
                          type="number"
                          step="0.01"
                          value={r.group_pct}
                          onSave={(v) => {
                            upd(r.id, { group_pct: Number(v) || 0 });
                            setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, group_pct: Number(v) || 0 } : x)));
                          }}
                          className="input-flat text-right text-xs"
                        />
                      </div>
                      <div className="col-span-1 text-right text-sm num text-slate-600">{eur(amount)}</div>
                      <div className="col-span-1 text-right">
                        <button onClick={() => remove(r.id)} className="text-xs text-slate-300 hover:text-red-500">
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </Section>
  );
}
