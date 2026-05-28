import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { UntilProd } from '../lib/types';
import { eur } from '../lib/format';
import { Section } from '../components/Section';
import { AutoInput } from '../components/AutoInput';

type Props = { year: number; month: number; onChange: () => void };

const STATUS_OPTIONS: { value: UntilProd['status']; label: string; cls: string }[] = [
  { value: 'a_facturer', label: 'à facturer', cls: 'bg-slate-100 text-slate-600' },
  { value: 'envoyee', label: 'envoyée', cls: 'bg-amber-100 text-amber-700' },
  { value: 'payee', label: 'payée', cls: 'bg-emerald-100 text-emerald-700' },
];

export function UntilProdSection({ year, month, onChange }: Props) {
  const [rows, setRows] = useState<UntilProd[]>([]);

  const load = useCallback(async () => {
    setRows(await api.get<UntilProd[]>(`/untilprod?year=${year}&month=${month}`));
  }, [year, month]);

  useEffect(() => {
    load();
  }, [load]);

  const total = rows.reduce((a, r) => a + (r.amount || 0), 0);
  const paid = rows.filter((r) => r.status === 'payee').reduce((a, r) => a + (r.amount || 0), 0);

  const add = async () => {
    await api.post('/untilprod', { year, month, client: 'Client', amount: 0 });
    await load();
    onChange();
  };

  const upd = async (id: number, patch: Partial<UntilProd>) => {
    await api.put(`/untilprod/${id}`, patch);
    onChange();
  };

  const remove = async (id: number) => {
    await api.del(`/untilprod/${id}`);
    await load();
    onChange();
  };

  return (
    <Section
      title="Until Prod (facturation vidéo)"
      hint="Suivi des factures montage vidéo."
      right={
        <button onClick={add} className="text-sm text-ink/70 hover:text-ink">
          + ajouter
        </button>
      }
    >
      {!rows.length && <p className="text-sm text-slate-400">Aucune facture ce mois.</p>}
      {!!rows.length && (
        <div className="space-y-1">
          <div className="grid grid-cols-12 gap-2 text-xs text-slate-400 px-2">
            <div className="col-span-2">Client</div>
            <div className="col-span-3">Période</div>
            <div className="col-span-3">Notes</div>
            <div className="col-span-2 text-right">Montant</div>
            <div className="col-span-1">Statut</div>
            <div className="col-span-1"></div>
          </div>
          {rows.map((r) => (
            <div key={r.id} className="grid grid-cols-12 gap-2 items-center px-2 py-1 hover:bg-slate-50 rounded-lg">
              <div className="col-span-2">
                <AutoInput value={r.client} onSave={(v) => upd(r.id, { client: v || null })} />
              </div>
              <div className="col-span-3">
                <AutoInput value={r.period} onSave={(v) => upd(r.id, { period: v || null })} placeholder="ex: sept-mars" />
              </div>
              <div className="col-span-3">
                <AutoInput
                  value={r.notes}
                  onSave={(v) => upd(r.id, { notes: v || null })}
                  className="input-flat text-xs text-slate-500"
                />
              </div>
              <div className="col-span-2">
                <AutoInput
                  type="number"
                  step="0.01"
                  value={r.amount}
                  onSave={(v) => {
                    upd(r.id, { amount: Number(v) || 0 });
                    setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, amount: Number(v) || 0 } : x)));
                  }}
                  className="input-flat text-right num"
                />
              </div>
              <div className="col-span-1">
                <select
                  value={r.status}
                  onChange={(e) => {
                    const v = e.target.value as UntilProd['status'];
                    upd(r.id, { status: v });
                    setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, status: v } : x)));
                  }}
                  className={`text-xs rounded px-1.5 py-1 cursor-pointer border-0 outline-none ${STATUS_OPTIONS.find((o) => o.value === r.status)?.cls}`}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-1 text-right">
                <button onClick={() => remove(r.id)} className="text-xs text-slate-300 hover:text-red-500">
                  ×
                </button>
              </div>
            </div>
          ))}
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-sm">
            <span className="text-slate-500">{rows.length} ligne{rows.length > 1 ? 's' : ''}</span>
            <span className="num">
              <span className="text-emerald-600 font-medium">{eur(paid)}</span>
              <span className="mx-1 text-slate-300">/</span>
              <span className="font-semibold">{eur(total)}</span>
            </span>
          </div>
        </div>
      )}
    </Section>
  );
}
