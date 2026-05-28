import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Revenue } from '../lib/types';
import { eur } from '../lib/format';
import { Section } from '../components/Section';
import { AutoInput } from '../components/AutoInput';

type Props = { year: number; month: number; onChange: () => void };

export function RevenuesSection({ year, month, onChange }: Props) {
  const [rows, setRows] = useState<Revenue[]>([]);

  const load = useCallback(async () => {
    const r = await api.get<Revenue[]>(`/revenues?year=${year}&month=${month}`);
    setRows(r);
  }, [year, month]);

  useEffect(() => {
    load();
  }, [load]);

  const total = rows.reduce((a, r) => a + (r.amount_gross || 0), 0);
  const totalDed = rows.reduce((a, r) => a + (r.deduction || 0), 0);

  const add = async () => {
    await api.post('/revenues', { year, month, amount_gross: 0 });
    await load();
    onChange();
  };

  const upd = async (id: number, patch: Partial<Revenue>) => {
    await api.put(`/revenues/${id}`, patch);
    onChange();
  };

  const remove = async (id: number) => {
    await api.del(`/revenues/${id}`);
    await load();
    onChange();
  };

  return (
    <Section
      title="Revenus kiné"
      hint="Chaque revenu est automatiquement réparti dans les enveloppes."
      right={
        <button onClick={add} className="text-sm text-ink/70 hover:text-ink">
          + ajouter
        </button>
      }
    >
      {!rows.length && <p className="text-sm text-slate-400">Aucun revenu pour ce mois.</p>}
      {!!rows.length && (
        <div className="space-y-1">
          <div className="grid grid-cols-12 gap-2 text-xs text-slate-400 px-2">
            <div className="col-span-1">Jour</div>
            <div className="col-span-3">Montant brut</div>
            <div className="col-span-3">Déduction</div>
            <div className="col-span-4">Notes</div>
            <div className="col-span-1"></div>
          </div>
          {rows.map((r) => (
            <div key={r.id} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-1">
                <AutoInput
                  type="number"
                  value={r.day}
                  onSave={(v) => upd(r.id, { day: v === '' ? null : Number(v) })}
                  min="1"
                  max="31"
                />
              </div>
              <div className="col-span-3">
                <AutoInput
                  type="number"
                  step="0.01"
                  value={r.amount_gross}
                  onSave={(v) => {
                    upd(r.id, { amount_gross: Number(v) || 0 });
                    setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, amount_gross: Number(v) || 0 } : x)));
                  }}
                />
              </div>
              <div className="col-span-3 flex items-center gap-2">
                <AutoInput
                  type="number"
                  step="0.01"
                  value={r.deduction}
                  onSave={(v) => {
                    upd(r.id, { deduction: Number(v) || 0 });
                    setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, deduction: Number(v) || 0 } : x)));
                  }}
                />
                <AutoInput
                  value={r.deduction_label}
                  onSave={(v) => upd(r.id, { deduction_label: v || null })}
                  placeholder="(label)"
                />
              </div>
              <div className="col-span-4">
                <AutoInput
                  value={r.notes}
                  onSave={(v) => upd(r.id, { notes: v || null })}
                  placeholder="notes…"
                />
              </div>
              <div className="col-span-1 text-right">
                <button onClick={() => remove(r.id)} className="text-xs text-slate-300 hover:text-red-500">
                  ×
                </button>
              </div>
            </div>
          ))}
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-sm">
            <span className="text-slate-500">
              Total brut · {rows.length} entrée{rows.length > 1 ? 's' : ''}
            </span>
            <span className="font-semibold num">
              {eur(total)}
              {totalDed > 0 && <span className="ml-2 text-xs text-slate-400">(− {eur(totalDed)})</span>}
            </span>
          </div>
        </div>
      )}
    </Section>
  );
}
