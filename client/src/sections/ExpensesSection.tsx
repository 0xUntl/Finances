import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Expense } from '../lib/types';
import { eur } from '../lib/format';
import { Section } from '../components/Section';
import { AutoInput } from '../components/AutoInput';

type Props = { year: number; month: number; onChange: () => void };

export function ExpensesSection({ year, month, onChange }: Props) {
  const [rows, setRows] = useState<Expense[]>([]);

  const load = useCallback(async () => {
    setRows(await api.get<Expense[]>(`/expenses?year=${year}&month=${month}`));
  }, [year, month]);

  useEffect(() => {
    load();
  }, [load]);

  const total = rows.reduce((a, r) => a + (r.amount || 0), 0);

  const add = async () => {
    await api.post('/expenses', { year, month, amount: 0 });
    await load();
    onChange();
  };

  const upd = async (id: number, patch: Partial<Expense>) => {
    await api.put(`/expenses/${id}`, patch);
    onChange();
  };

  const remove = async (id: number) => {
    await api.del(`/expenses/${id}`);
    await load();
    onChange();
  };

  return (
    <Section
      title="Dépenses personnelles (ponctuelles)"
      hint="Tout ce qui n'est pas récurrent — courses, voyages, achats."
      right={
        <button onClick={add} className="text-sm text-ink/70 hover:text-ink">
          + ajouter
        </button>
      }
    >
      {!rows.length && <p className="text-sm text-slate-400">Aucune dépense ce mois.</p>}
      {!!rows.length && (
        <div className="space-y-1">
          <div className="grid grid-cols-12 gap-2 text-xs text-slate-400 px-2">
            <div className="col-span-1">Jour</div>
            <div className="col-span-6">Libellé</div>
            <div className="col-span-2 text-right">Montant</div>
            <div className="col-span-2">Notes</div>
            <div className="col-span-1"></div>
          </div>
          {rows.map((r) => (
            <div key={r.id} className="grid grid-cols-12 gap-2 items-center px-2 py-1 hover:bg-slate-50 rounded-lg">
              <div className="col-span-1">
                <AutoInput
                  type="number"
                  value={r.day}
                  onSave={(v) => upd(r.id, { day: v === '' ? null : Number(v) })}
                  min="1"
                  max="31"
                />
              </div>
              <div className="col-span-6">
                <AutoInput value={r.label} onSave={(v) => upd(r.id, { label: v || null })} placeholder="…" />
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
              <div className="col-span-2">
                <AutoInput
                  value={r.notes}
                  onSave={(v) => upd(r.id, { notes: v || null })}
                  placeholder="…"
                  className="input-flat text-xs text-slate-500"
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
            <span className="text-slate-500">{rows.length} dépense{rows.length > 1 ? 's' : ''}</span>
            <span className="font-semibold num">{eur(total)}</span>
          </div>
        </div>
      )}
    </Section>
  );
}
